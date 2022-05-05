import axios from 'axios';
import express, { Response } from 'express';
import bodyParser from 'body-parser';

import { createFile, removeFile } from './utils/filesystemUtils';
import { checkEnv, corsConfig, corsOpts, queueName } from './utils/startupUtils';
import cors from 'cors';

/* -------------- INITIALIZATION -------------- */
checkEnv();

const compilerInstance = axios.create({
  baseURL: `http://${process.env.COMPILER_HOST}:${process.env.COMPILER_PORT}/`
})

const PORT = process.env.BACKEND_HTTP_PORT;

interface ProcessOutput {
  stdout: string,
  stderr: string,
  exitCode: number
};
interface CompilationResult {
  procOutput: ProcessOutput,
  inPath: string,
  outPath: string
}


/* -------------- WEB SERVER CONFIGURATION -------------- */
const app = express();
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(cors({origin: true}));

app.get("/", (_, res) => {
  res.status(200).end();
});

app.post("/compile", async (req, res) => {
  const codeTxt = req.body.code;
  const cflags = req.body.cflags || undefined;

  const [_, inFilename] = createFile(codeTxt);
  console.log(`[HTTP] Got compilation request from ${req.hostname} - ${inFilename}`);
  const payload = { inFilename, cflags };
  const compilationResponse: any = await compilerInstance.post("/compile", payload);

  const compilationResult: CompilationResult = compilationResponse.data;
  removeFile(compilationResult.inPath);
  removeFile(compilationResult.outPath);

  res.status(200).send(compilationResult.procOutput);
});


app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
})