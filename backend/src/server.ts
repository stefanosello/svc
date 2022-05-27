import axios from 'axios';
import fs from 'fs';
import express from 'express';
import bodyParser from 'body-parser';
import  { performance, PerformanceObserver } from 'perf_hooks';

import { createFile, removeFile } from './utils/filesystemUtils';
import { checkEnv, corsConfig, CompilationResult} from './utils/startupUtils';

/* PERFORMACES */
let measure: any = {}
const perfObserver = new PerformanceObserver((items) => {
  items.getEntries().forEach(entry => {
    measure[entry.name] = entry.duration;
  })
  if (Object.values(measure).length === 3) {
    if (process.env.PERFORMANCES_RECORD_PATH) {
      const perfPath = process.env.PERFORMANCES_RECORD_PATH;
      if (!fs.existsSync(perfPath))
        fs.appendFileSync(perfPath, "server;disk;compiler\n");
      fs.appendFileSync(perfPath, `${measure.server - measure.disk - measure.compiler};${measure.disk};${measure.compiler}\n`.replace(/\./g, ","));
    }
    measure = {};
  }
})
perfObserver.observe({ entryTypes: ["measure"], buffered: true })

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
  const maxJobsReachedResult: any = await compilerInstance.get('/stats/maxJobsReached');
  const maxJobsResult: any = await compilerInstance.get('/stats/maxJobs');

  res.status(200).send(`
    <h1>SVC BACKEND</h1>
    </br>
    Compiler max jobs available: ${maxJobsResult.data.maxJobs}
    </br>
    Compiler max jobs reached: ${maxJobsReachedResult.data.maxJobsReached}
    `
  );
});

app.get("/stats/update", async (req, res) => {
  const maxJobs = req.query.maxJobs || undefined;
  const resetMaxJobs = req.query.resetMaxJobs || undefined;

  if (!maxJobs && !resetMaxJobs) {
    res.status(200).send(`
      Missing query parameters.
      </br>
      Available options:
      </br>
      <ul>
        <li><b>maxJobs</b>: int         set number of simultaneous jobs available
        <li><b>resetMaxJobs</b>         reset to 0 the current number of jobs reached
      </ul>
    `);

  }
  
  const result = await compilerInstance.post("/stats/update", {maxJobs, resetMaxJobs});
  res.status(200).send(result.data);
});

app.post("/compile", async (req, res) => {
  performance.mark('server-start');
  const codeTxt = req.body.code;
  const cflags = req.body.cflags || undefined;

  performance.mark('disk-start');
  const [_, inFilename] = createFile(codeTxt);
  performance.mark('disk-end');
  performance.measure('disk', 'disk-start', 'disk-end')

  console.log(`[HTTP] Got compilation request from ${req.hostname} - ${inFilename}`);
  const payload = { inFilename, cflags };
  
  performance.mark('compile-start');
  const compilationResponse: any = await compilerInstance.post("/compile", payload);
  performance.mark('compile-end');
  performance.measure('compiler', 'compile-start', 'compile-end')

  const compilationResult: CompilationResult = compilationResponse.data;
  removeFile(compilationResult.inPath);
  removeFile(compilationResult.outPath);

  performance.mark('server-end');
  performance.measure('server', 'server-start', 'server-end')
  
  res.status(200).send(compilationResult.procOutput);
});


app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
})