import { spawnSync } from 'child_process';
import shlex from 'shlex';
import path from 'path';
import fs from 'fs';
import RSMQWorker from "rsmq-worker";
import RedisSMQ from "rsmq";
import axios from 'axios';

const MANDATORY_CONFIG_KEYS = [
  "COMPILER_BASE_DIR",
  "COMPILER_BACKEND_HOST",
  "COMPILER_QUEUE_HOST",
  "COMPILER_QUEUE_PORT",
  "COMPILER_QUEUE_NAME"
];
MANDATORY_CONFIG_KEYS.forEach(key => {
  if (!process.env[key]) {
    throw new Error(`Missing config key: ${key}`);
  }
});

const baseDir = process.env.COMPILER_BASE_DIR;
const options = {
  host: process.env.COMPILER_QUEUE_HOST,
  port: parseInt(process.env.COMPILER_QUEUE_PORT  || "")
};

const rsmq = new RedisSMQ( options );
const worker = new RSMQWorker( "myqueue", { ...options, autostart: true } );
const backendInstance = axios.create({
  baseURL: process.env.COMPILER_BACKEND_HOST
})

function compile(inPath: string, outPath: string) {
  const cmdStr = `g++ -std=c++17 ${inPath} -o ${outPath}`;
  const cmdShlexed: string[] = shlex.split(cmdStr) || [];
  const cmd = cmdShlexed.shift() || '';
  const args = cmdShlexed || [];
  
  console.log(`[COMPILER] Executing: ${cmd} ${args.join(" ")}`);
  return spawnSync(cmd, args);
}

function rmFile(filePath: string) {
  console.log("[COMPILER] Removing file: ", filePath);
  fs.unlinkSync(filePath);
}

worker.on( "message", ( msg: string, next: Function, id: string ) => {  
  console.log(`[WORKER] Received message ${id}`);
  // parse message and compile
  const payload = JSON.parse(msg);
  const inFilename: string = payload.filename;
  const inPath: string = path.join(baseDir || "", inFilename);
  const outFilename: string = `${inFilename}.out`;
  const outPath: string = path.join(baseDir || "", outFilename);
  const process = compile(inPath, outPath);
  console.log(`[COMPILER] Compilation terminated with status ${process.status}`);
  
  const data = {
    exitCode: process.status,
    stdout: process.stdout.toLocaleString(),
    stderr: process.stderr.toLocaleString(),
  };
  if (process.status === 0) rmFile(outPath);
  backendInstance.post("/compilation-result", { data });
  rsmq.deleteMessage({ qname: "myqueue", id }, (_) => {});
});