import express from 'express';
import axios from 'axios';
import bodyParser from 'body-parser'
import path from 'path';
import fs from 'fs';

const instance = axios.create({
  baseURL: 'http://svc-compiler:1337/',
})

const base_dir = "/src";

async function doRequest(filename: string) {
  const fullPath = path.join(base_dir, filename);
  if (!fs.existsSync(fullPath)) {
    throw new Error("File does not exists!");
  }

  const res = await instance.post("/compile", { filename } );
  
  console.log(`[INFO] exit code: ${res.data.exitCode}`);
  console.log(`[INFO] stdout:\n${res.data.stdout}`);
  console.log(`[INFO] stderr:\n${res.data.stderr}`);
}

const app = express();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

app.get("/", (req, res) => {
  res.status(200).send("<h1>Backend works!</h1>");
});

app.listen(80, () => {
  console.log(`[INFO] Server running on port 80`);
  
  doRequest('tests/pass.cpp');
  doRequest('tests/fail.cpp');
});
