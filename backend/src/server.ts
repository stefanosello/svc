import axios from 'axios';
import express from 'express';
import bodyParser from 'body-parser';

import { createFile, removeFile } from './utils/filesystemUtils';
import { checkEnv, corsConfig, CompilationResult} from './utils/startupUtils';

/* -------------- INITIALIZATION -------------- */
checkEnv();

const compilerInstance = axios.create({
  baseURL: process.env.COMPILER_API_ROOT
})

const PORT = process.env.BACKEND_HTTP_PORT || 8080;


/* -------------- WEB SERVER CONFIGURATION -------------- */
const app = express();
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(corsConfig);

app.get("/", async (_, res) => {
  const maxActiveJobsResult: any = await compilerInstance.get('/stats/maxActiveJobs');
  res.status(200).send(`
    <h1>SVC BACKEND</h1>
    </br>
    Compiler max jobs: ${maxActiveJobsResult.data.maxActiveJobs}`
  );
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