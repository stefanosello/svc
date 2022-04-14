import express from 'express';
import bodyParser from 'body-parser';
import { createServer } from "http";
import { Socket } from 'socket.io';

import QueueHandler from './classes/queueHandler';
import SocketHandler from './classes/socketHandler';
import { createFile, removeFile } from './utils/filesystemUtils';
import { checkEnv, corsConfig, corsOpts, queueName } from './utils/startupUtils';

/* -------------- INITIALIZATION -------------- */
checkEnv();
const app = express();
const httpServer = createServer(app);
const queueHandler = new QueueHandler();
const ioHandler = new SocketHandler(httpServer, {cors: corsOpts});
queueHandler.createQueue(queueName);

/* -------------- WEB SERVER CONFIGURATION -------------- */
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(corsConfig);

app.get("/", (_, res) => {
  res.status(200).end();
});

app.post("/compile", async (req, res) => {
  const codeTxt = req.body.code;
  const cflags = req.body.cflags || undefined;
  const clientId = req.body.clientId;
  console.log(`[HTTP] Got compilation request from ${req.hostname}  - ${clientId}`);
  const [_, inFilename] = createFile(codeTxt);
  const payload = { inFilename, cflags, clientId };
  const queueRes = await queueHandler.pushToQueue(queueName, JSON.stringify(payload));
  if (queueRes) {
    res.status(200).send("OK!");
  } else {
    res.status(503).send("[QUEUE] Service unavailable");
  }
});

app.post("/compilation-result", (req, res) => {
  console.log("[HTTP] Got compilation results");
  const inFilename: string = req.body.data.inFilename;
  removeFile(inFilename);
  delete req.body.data.inFilename;
  const clientId: string = req.body.data.clientId;
  ioHandler.emitToClient(clientId, "compilation-result", req.body.data.compilationResults);
  res.status(200).send("OK!");
});

httpServer.listen(process.env.BACKEND_HTTP_PORT, () => {
  console.log(`[HTTP] Server running on port ${process.env.BACKEND_HTTP_PORT}`);

  const io = ioHandler.getSocketInstance();
  io.on("connection", (socket: Socket) => {
    console.log("[SOCKET] Accepted connection from client", socket.id);
    ioHandler.addClientSocket(socket.id, socket);

    socket.on('disconnect', () => {
      ioHandler.removeClientSocket(socket.id);
    });
  });
});
