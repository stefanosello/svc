import express from 'express';
import bodyParser from 'body-parser'
import path from 'path';
import fs from 'fs';
import RedisSMQ from "rsmq";

const base_dir = "/src";
const rsmq = new RedisSMQ( {host: "svc-smq", port: 6379, ns: "rsmq", realtime: true} );

rsmq.createQueue({ qname: "myqueue" }, function (err, resp) {
  if (err) {
    console.error(err)
    return
  }

  if (resp === 1) {
    console.log("queue created")
  }
});

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
  
  /*
  console.log(`[INFO] exit code: ${res.data.exitCode}`);
  console.log(`[INFO] stdout:\n${res.data.stdout}`);
  console.log(`[INFO] stderr:\n${res.data.stderr}`);
  */
}

const app = express();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

app.get("/", (req, res) => {
  res.status(200).send("<h1>Backend works!</h1>");
});

app.post("/compilation-result", (req, res) => {

  console.log(req.body.data);

});

app.listen(80, () => {
  console.log(`[INFO] Server running on port 80`);

  setTimeout( () => {
    doRequest('tests/fail.cpp');
    doRequest('tests/pass.cpp');
  }, 3000);
});
