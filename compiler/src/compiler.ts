import express from 'express';
import { spawnSync } from 'child_process';
import shlex from 'shlex';
import path from 'path';
import bodyParser from 'body-parser'
import fs from 'fs';
import RSMQWorker from "rsmq-worker";
import RedisSMQ, { QueueMessage }  from "rsmq";
import axios from 'axios';

const base_dir = "/src";

const backendInstance = axios.create({
  baseURL: 'http://svc-backend:80/',
})

var options = {
  host: "svc-smq",
  port: 6379
};

const rsmq = new RedisSMQ( options );
const worker = new RSMQWorker( "myqueue", { ...options, autostart: true } );

function compile(inPath: string, outPath: string) {
  const cmdStr = `g++ -std=c++17 ${inPath} -o ${outPath}` ;
  const cmdShlexed: string[] = shlex.split(cmdStr) || [];

  const cmd = cmdShlexed.shift() || '';
  const args = cmdShlexed || [];
  
  console.log(`[COMPILER] Executing: ${cmd} ${args.join(" ")}`);
  return spawnSync(cmd, args, { 
    timeout: 1 * 60 * 1000, // 1 minute timeout
  });
}

function rmFile(filePath: string) {
  console.log("[COMPILER] Removing file: ", filePath);
  fs.unlinkSync(filePath);
}

const app = express();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

app.get("/", (req, res) => {
  res.status(500).send("<h1>Compiler shouldn't work!</h1>");
});
/*
app.post("/compile", (req, res) => {
  const inFilename = req.body.filename;
  const inPath = path.join(base_dir, inFilename);

  const outFilename: string = `${inFilename}.out`;
  const outPath = path.join(base_dir, outFilename);

  const process = compile(inPath, outPath);

  console.log(`[COMPILER] Compilation terminated with status ${process.status}`);
  
  if (process.status == 0) {
    rmFile(outPath);
  }
  
  const data = {
    exitCode: process.status,
    stdout: process.stdout.toLocaleString(),
    stderr: process.stderr.toLocaleString(),
  };

  res.status(200).send(data);
});
*/
app.listen(1337, () => {
  console.log(`[INFO] Compiler service running on port 1337`);

/*
  rsmq.createQueue({ qname: "myqueue" }, function (err, resp) {
    if (err) {
      console.error(err)
      return
    }
  
    if (resp === 1) {
      console.log("queue created")
    }
  });
*/
  worker.on( "message", ( msg: string, next: Function, id: string ) => {  
    
    if (id) {
      console.log("Message received and deleted from queue", id)
      
      // parse message and compile
      const payload = JSON.parse(msg);
      const inFilename: string = payload.filename;
      const inPath: string = path.join(base_dir, inFilename);
    
      const outFilename: string = `${inFilename}.out`;
      const outPath: string = path.join(base_dir, outFilename);
    
      const process = compile(inPath, outPath);
    
      console.log(`[COMPILER] Compilation terminated with status ${process.status}`);
      
      if (process.status == 0) {
        rmFile(outPath);
      }
      
      const data = {
        exitCode: process.status,
        stdout: process.stdout.toLocaleString(),
        stderr: process.stderr.toLocaleString(),
      };

      // TODO: gestire risposta?
      backendInstance.post("/compilation-result", { data });


      rsmq.deleteMessage({ qname: "myqueue", id }, function (err, resp) {
        if (err) {
          console.error(err)
          return
        }
      
        if (resp === 1) {
          console.log("Message deleted.")
        } else {
          console.log("Message not found.")
        }
      });

    } else {
      console.log("No messages for me...")
    }
  });

});
