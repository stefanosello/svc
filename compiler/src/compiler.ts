import express from 'express';

import { spawn, spawnSync } from 'child_process';
import shlex from 'shlex';
import path from 'path';
import bodyParser from 'body-parser'
import fs from 'fs';

const app = express();
const base_dir = "/src";

function compile(fullPath: string, outFilename: string) {
  const cmdStr = `g++ -std=c++17 ${fullPath} -o ${outFilename}` ;
  const cmdShlexed: string[] = shlex.split(cmdStr) || [];

  const cmd = cmdShlexed.shift() || '';
  const args = cmdShlexed || [];
  
  console.log("[INFO] Executing: ", cmd, args);
  return spawnSync(cmd, args, { 
    timeout: 1 * 60 * 1000, // 1 minute timeout
  });
}

function rmFile(filename: string) {
  console.log("[INFO] Removing file: ", filename);
  fs.unlinkSync(filename);
}

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

app.post("/compile", (req, res) => {
  const inFilename = req.body.filename;
  const inFullPath = path.join(base_dir, inFilename);

  const outFilename: string = `${inFilename}.out`;
  const process = compile(inFullPath, outFilename);
  if (process.status == 0) {
    rmFile(outFilename);
  }
  
  const data = {
    exitCode: process.status,
    stdout: process.stdout.toLocaleString(),
    stderr: process.stderr.toLocaleString(),
  }
  res.status(200).send(data);
});

app.listen(1337, () => {
  console.log(`server running on port 1337`);
});
