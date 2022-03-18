import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser'
import path from 'path';
import fs from 'fs';
import RedisSMQ from 'rsmq';
import { randomUUID } from 'crypto';

const base_dir = "/src";
const rsmq = new RedisSMQ( {host: "redis-smq", port: 6379, ns: "rsmq", realtime: true} );

rsmq.createQueue({ qname: "myqueue" }, function (err, resp) {
  if (err) {
    console.error(err)
    return
  }

  if (resp === 1) {
    console.log("queue created")
  }
});

function createFile(code: string): string {
  const inFilename = `${randomUUID()}.cpp`;
  const inPath = path.join(base_dir, inFilename);
  fs.writeFileSync(inPath, code);

  return inFilename
}

async function doRequest(filename: string) {
  const fullPath = path.join(base_dir, filename);
  if (!fs.existsSync(fullPath)) {
    throw new Error("File does not exists!");
  }

  const payload = {
    filename: filename,
  };

  console.log("Sending request for", payload);
  rsmq.sendMessage({ qname: "myqueue", message: JSON.stringify(payload) }, function (err, resp) {
    if (err) { 
      console.error(err)
      return
    }
  
    console.log("Message sent. ID:", resp);
  });
}

const app = express();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

const allowedOrigins = ['http://localhost:8081'];
app.use(cors({
  methods: 'POST',
  optionsSuccessStatus: 200,
  origin: (origin, cb) => {
    console.log(`[CORS] Received req by origin: ${origin}`);
    if (origin && allowedOrigins.indexOf(origin) !== -1) {
      cb(null, true);
    } else {
      cb(new Error('Not Allowed by CORS'))
    }
  }
}));

app.get("/", (req, res) => {
  res.status(200).send("<h1>Backend works!</h1>");
});

app.post("/compile", (req, res) => {
  const codeTxt = req.body.code;
  console.log("[INFO] Got compilation request", req.hostname);
  const inFilename = createFile(codeTxt);
  console.log("[INFO] Created file to compile: ", inFilename);
  doRequest(inFilename);
  res.status(200).send("OK!");
});

app.post("/compilation-result", (req, res) => {
  console.log("[INFO] Got compilation results");
  console.log(req.body.data);
});

app.listen(8080, () => {
  console.log(`[INFO] Server running on port 8080`);
});
