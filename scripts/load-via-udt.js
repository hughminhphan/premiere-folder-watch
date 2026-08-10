#!/usr/bin/env node

const crypto = require("node:crypto");
const fs = require("node:fs");
const net = require("node:net");
const path = require("node:path");

const manifestPath = path.resolve(process.argv[2] || path.join(__dirname, "..", "manifest.json"));
const pluginFolder = path.dirname(manifestPath);
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const port = Number(process.env.UDT_PORT || 14001);

function createFrame(payloadText, opcode = 1) {
  const payload = Buffer.from(payloadText);
  const mask = crypto.randomBytes(4);
  let header;

  if (payload.length < 126) {
    header = Buffer.from([0x80 | opcode, 0x80 | payload.length]);
  } else if (payload.length < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x80 | opcode;
    header[1] = 0x80 | 126;
    header.writeUInt16BE(payload.length, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x80 | opcode;
    header[1] = 0x80 | 127;
    header.writeBigUInt64BE(BigInt(payload.length), 2);
  }

  const frame = Buffer.alloc(header.length + mask.length + payload.length);
  header.copy(frame, 0);
  mask.copy(frame, header.length);
  for (let index = 0; index < payload.length; index += 1) {
    frame[header.length + mask.length + index] = payload[index] ^ mask[index % mask.length];
  }
  return frame;
}

function loadPlugin() {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: "127.0.0.1", port });
    const messages = [];
    let buffer = Buffer.alloc(0);
    let phase = "handshake";
    let premiereClientId = null;
    let finished = false;

    const timeout = setTimeout(() => {
      finish(new Error(`Adobe load timed out. Messages: ${JSON.stringify(messages)}`));
    }, 15000);

    function finish(error, result) {
      if (finished) return;
      finished = true;
      clearTimeout(timeout);
      socket.destroy();
      if (error) reject(error);
      else resolve(result);
    }

    function send(message) {
      socket.write(createFrame(JSON.stringify(message)));
    }

    function handleMessage(message) {
      messages.push(message);

      if (
        message.command === "didAddRuntimeClient" &&
        message.app &&
        String(message.app.appId).toLowerCase() === "premierepro"
      ) {
        premiereClientId = message.id;
      }

      if (message.command === "didCompleteConnection") {
        if (!premiereClientId) {
          finish(new Error("Premiere is not connected to the Adobe developer service."));
          return;
        }
        send({
          command: "proxy",
          clientId: premiereClientId,
          requestId: 1,
          message: {
            command: "Plugin",
            action: "validate",
            params: { provider: { type: "disk", path: pluginFolder } },
            manifest,
          },
        });
        return;
      }

      if (message.command === "reply" && message.requestId === 1) {
        if (message.error || message.success === false) {
          finish(new Error(`Adobe validation failed: ${JSON.stringify(message)}`));
          return;
        }
        send({
          command: "proxy",
          clientId: premiereClientId,
          requestId: 2,
          message: {
            command: "Plugin",
            action: "load",
            params: { provider: { type: "disk", path: pluginFolder } },
            breakOnStart: false,
            isPlaygroundPlugin: false,
          },
        });
        return;
      }

      if (message.command === "reply" && message.requestId === 2) {
        if (message.error) {
          finish(new Error(`Adobe load failed: ${JSON.stringify(message)}`));
          return;
        }
        finish(null, {
          app: messages.find((item) => item.command === "didAddRuntimeClient").app,
          validation: messages.find((item) => item.requestId === 1),
          load: message,
        });
      }
    }

    function parseFrames() {
      while (buffer.length >= 2) {
        const first = buffer[0];
        const second = buffer[1];
        let payloadLength = second & 0x7f;
        let offset = 2;

        if (payloadLength === 126) {
          if (buffer.length < 4) return;
          payloadLength = buffer.readUInt16BE(2);
          offset = 4;
        } else if (payloadLength === 127) {
          if (buffer.length < 10) return;
          payloadLength = Number(buffer.readBigUInt64BE(2));
          offset = 10;
        }

        const isMasked = Boolean(second & 0x80);
        const frameLength = offset + (isMasked ? 4 : 0) + payloadLength;
        if (buffer.length < frameLength) return;

        let payload = buffer.subarray(offset + (isMasked ? 4 : 0), frameLength);
        if (isMasked) {
          const mask = buffer.subarray(offset, offset + 4);
          const decoded = Buffer.alloc(payloadLength);
          for (let index = 0; index < payloadLength; index += 1) {
            decoded[index] = payload[index] ^ mask[index % mask.length];
          }
          payload = decoded;
        }
        buffer = buffer.subarray(frameLength);

        const opcode = first & 0x0f;
        if (opcode === 1) {
          handleMessage(JSON.parse(payload.toString("utf8")));
        } else if (opcode === 8) {
          finish(new Error("Adobe closed the developer-service connection."));
          return;
        } else if (opcode === 9) {
          socket.write(createFrame(payload.toString("utf8"), 10));
        }
        if (finished) return;
      }
    }

    socket.on("connect", () => {
      const key = crypto.randomBytes(16).toString("base64");
      socket.write(
        `GET /socket/cli HTTP/1.1\r\n` +
          `Host: 127.0.0.1:${port}\r\n` +
          "Upgrade: websocket\r\n" +
          "Connection: Upgrade\r\n" +
          `Sec-WebSocket-Key: ${key}\r\n` +
          "Sec-WebSocket-Version: 13\r\n\r\n",
      );
    });

    socket.on("data", (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
      if (phase === "handshake") {
        const end = buffer.indexOf("\r\n\r\n");
        if (end === -1) return;
        const response = buffer.subarray(0, end).toString("utf8");
        if (!response.startsWith("HTTP/1.1 101")) {
          finish(new Error(`Adobe WebSocket handshake failed: ${response}`));
          return;
        }
        buffer = buffer.subarray(end + 4);
        phase = "frames";
      }
      parseFrames();
    });

    socket.on("error", finish);
  });
}

loadPlugin()
  .then((result) => {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  })
  .catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
