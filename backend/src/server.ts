import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser'
import path from 'path';
import fs from 'fs';
import RedisSMQ from 'rsmq';
import { randomUUID } from 'crypto';
import { createServer } from "http";
import { Server, Socket } from 'socket.io'

const MANDATORY_CONFIG_KEYS = [
  "BACKEND_BASE_DIR",
  "BACKEND_QUEUE_NAME",
  "BACKEND_QUEUE_HOST",
  "BACKEND_QUEUE_PORT",
  "BACKEND_ALLOWED_HOSTS",
  "BACKEND_HTTP_PORT"
];
MANDATORY_CONFIG_KEYS.forEach(key => {
  if (!process.env[key]) throw new Error(`Missing config key: ${key}`);
});

/* -------------- ORIGIN DEFINITION -------------- */
// taken from
// https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/cors/index.d.ts
const allowedOrigins: string[] = (process.env.NODE_ENV !== 'production') ? (process.env.BACKEND_ALLOWED_HOSTS || "").split(",") : [];
const corsOpts: cors.CorsOptions = {
    origin: (requestOrigin: string | undefined, callback: (err: Error | null, origin?: boolean | string | RegExp | (boolean | string | RegExp)[]) => void) => {
      if (process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      console.log(`[CORS] Received req by origin: ${requestOrigin}`);
      if (requestOrigin && allowedOrigins && allowedOrigins.indexOf(requestOrigin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not Allowed by CORS'))
      }

    }
};

const baseDir = process.env.BACKEND_BASE_DIR || "";
const rsmq = new RedisSMQ({
  host: process.env.BACKEND_QUEUE_HOST,
  port: parseInt(process.env.BACKEND_QUEUE_PORT || ""),
  ns: "rsmq",
  realtime: true
});
const queueName = process.env.BACKEND_QUEUE_NAME || "";
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: corsOpts });

/* -------------- QUEUE METHODS -------------- */

rsmq.createQueue({ qname: queueName }, (err, resp) => {
  if (err) {
    if (`${err}`.startsWith("queueExists")) { console.log("[QUEUE] Queue already exists"); }
    else { console.error(err); }
    return 1;
  }
  if (resp === 1) console.log("queue created");
});
 
function createFile(code: string): string {
  const inFilename = `${randomUUID()}.cpp`;
  const inPath = path.join(baseDir, inFilename);
  fs.writeFileSync(inPath, code);
  return inFilename
} 

async function doRequest(filename: string, clientId: string) {
  const fullPath = path.join(baseDir, filename);
  if (!fs.existsSync(fullPath)) throw new Error("File does not exists!");

  const payload = { filename, clientId };
  console.log("Sending request for", payload);
  rsmq.sendMessage({ qname: queueName, message: JSON.stringify(payload)}, (err, resp) => {
    if (err) { console.error(err); return 1; }
    console.log("Message sent. ID:", resp);
  });
}

/* -------------- SOCKET METHODS -------------- */
interface SocketObj { clientId: string, socket: Socket };
const sockets: SocketObj[] = [];
function addClientSocket(clientId: string, socket: Socket) {
  if (!getClientSocket(clientId)) {
    sockets.push({clientId, socket});
  }
}

function removeClientSocket(clientId: string) {
  const socketObj : SocketObj|undefined = sockets.find( e => e.clientId == clientId) || undefined;
  if (socketObj) {
    sockets.slice(sockets.indexOf(socketObj), 1);
  }
}

function getClientSocket(clientId: string): Socket|undefined {
  const socketObj : SocketObj|undefined = sockets.find( e => e.clientId == clientId) || undefined;
  if (socketObj) {
    return socketObj.socket;
  }
  return undefined;
}

/* -------------- WEB SERVER METHODS -------------- */

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(cors(corsOpts));

app.get("/", (_, res) => {
  res.status(200).send("<h1>Backend works!</h1>");
});

app.post("/compile", (req, res) => {
  const codeTxt = req.body.code;
  const clientId = req.body.clientId;
  console.log(`[INFO] Got compilation request from ${req.hostname}  - ${clientId}`);
  const inFilename = createFile(codeTxt);
  console.log(`[INFO] Created file to compile: ${inFilename}`);
  doRequest(inFilename, clientId);
  res.status(200).send("OK!");
});

app.post("/compilation-result", (req, res) => {
  console.log("[INFO] Got compilation results");
  console.log(req.body.data);

  const clientId: string = req.body.data.clientId;
  if (clientId) {
    const socket: Socket|undefined = getClientSocket(clientId);
    if (socket) {
      socket.emit("compilation-result", req.body.data.compilationResults);
    }
  }
});

httpServer.listen(process.env.BACKEND_HTTP_PORT, () => {
  console.log(`[INFO] Server running on port ${process.env.BACKEND_HTTP_PORT}`);

  io.on("connection", (socket: Socket) => {
    console.log("Accepted connection from client", socket.id);
    addClientSocket(socket.id, socket);
    socket.emit('user-connected', socket.id)

    socket.on('disconnect', () => {
      removeClientSocket(socket.id);
    });
  });
});
