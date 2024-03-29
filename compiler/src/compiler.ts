import cors from 'cors';
import path from 'path';
import express from 'express';
import bodyParser from 'body-parser';

import JobQueue, { Job, ProcessOutput } from './classes/jobQueue';
import { spawn } from 'child_process';
import shlex from 'shlex';

const MANDATORY_CONFIG_KEYS = [
  "COMPILER_HTTP_PORT",
  "COMPILER_BASE_DIR",
  "COMPILER_QUEUE_MAXJOBS",
];
MANDATORY_CONFIG_KEYS.forEach(key => {
  if (!process.env[key]) throw new Error(`Missing config key: ${key}`);
});
const baseDir = process.env.COMPILER_BASE_DIR;
const PORT = process.env.COMPILER_HTTP_PORT || 8082;

/* -------------- WEB SERVER CONFIGURATION -------------- */
const app = express();
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(cors());

/* -------------- QUEUE CONFIGURATION -------------- */

let jobQueue: JobQueue;
const QUEUE_MAX_JOBS = parseInt(process.env.COMPILER_QUEUE_MAXJOBS || "") || 0;

async function spawnChild(cmd: string, args: string[]): Promise<ProcessOutput> {
  let stdout = "";
  let stderr = "";
  const child = spawn(cmd, args);
  for await (const chunk of child.stdout) stdout += chunk;
  for await (const chunk of child.stderr) stderr += chunk;
  const exitCode: number = await new Promise((resolve, _) => child.on('close', resolve));
  return { stdout, stderr, exitCode };
}

async function compile(job: Job): Promise<ProcessOutput> {
  const cmdStr = `g++ -fsyntax-only ${job.cflags} ${job.inPath} -o ${job.outPath}`;
  const cmdShlexed: string[] = shlex.split(cmdStr) || [];
  const cmd = cmdShlexed.shift() || '';
  const args = cmdShlexed || [];
  return spawnChild(cmd, args);
}

/** 
 * POST  /compile
*/
app.post('/compile', (req, res) => {
  const cflags: string = req.body.cflags || "";
  const inFilename: string = req.body.inFilename;
  const inPath: string = path.join(baseDir || "", inFilename || "");
  const outFilename: string = `${inFilename}.out`;
  const outPath: string = path.join(baseDir || "", outFilename);
  const job: Job = {
    inPath,
    outPath,
    cflags,
    res
  }
  jobQueue.execute(job);
})

/** 
 * GET  /stats/maxJobsReached 
 * Returns number of maximum simultaneous jobs executed 
 * 
*/
app.get('/stats/maxJobsReached', (_, res) => {
  const maxJobsReached: number = jobQueue.getMaxJobsReached();
  res.status(200).send({ maxJobsReached });
});

/** 
 * GET  /stats/maxJobs 
 * Returns number of maximum simultaneous jobs allowed to execute 
 * 
*/
app.get('/stats/maxJobs', (_, res) => {
  const maxJobs: number = jobQueue.getMaxJobs();
  res.status(200).send({ maxJobs });
});

app.post('/stats/update', (req, res) => {
  const maxJobs: number = req.body.maxJobs || undefined;
  const resetMaxJobs: number = req.body.resetMaxJobs || undefined;
  if (maxJobs) {
    jobQueue.setMaxJobs(maxJobs);
  }
  if (resetMaxJobs) {
    jobQueue.setMaxJobsReached(0);
  }
  res.status(200).send(`OK: ${maxJobs}, ${resetMaxJobs}`);
})

app.listen(PORT, () => {
  console.log(`Compiler listening on port ${PORT}`);

  jobQueue = new JobQueue(QUEUE_MAX_JOBS,
    (job: Job): Promise<ProcessOutput> => {
      return compile(job);
    });
})