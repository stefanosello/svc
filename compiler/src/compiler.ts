import cors from 'cors';
import path from 'path';
import express from 'express';
import bodyParser from 'body-parser';

import JobQueue, { Job, ProcessOutput } from './classes/jobQueue';
import { spawn } from 'child_process';
import shlex from 'shlex';

const app = express();


const MANDATORY_CONFIG_KEYS = [
    "COMPILER_PORT",
    "COMPILER_BASE_DIR",
    "COMPILER_QUEUE_MAXJOBS",
];
MANDATORY_CONFIG_KEYS.forEach(key => {
  if (!process.env[key]) throw new Error(`Missing config key: ${key}`);
});
const baseDir = process.env.COMPILER_BASE_DIR;
const PORT = process.env.COMPILER_PORT;

/* -------------- WEB SERVER CONFIGURATION -------------- */
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(cors());

/* -------------- QUEUE CONFIGURATION -------------- */

const QUEUE_MAX_JOBS = parseInt(process.env.COMPILER_QUEUE_MAXJOBS || "") || 0;
let jobQueue: JobQueue;


async function compile(job: Job): Promise<ProcessOutput> {

  // TODO change to spawnSync?
  async function spawnChild(cmd: string, args: string[]): Promise<ProcessOutput> {
    const child = spawn(cmd, args);
  
    let stdout = "";
    for await (const chunk of child.stdout) {
        //console.log('stdout chunk: '+chunk);
        stdout += chunk;
    }
    let stderr = "";
    for await (const chunk of child.stderr) {
        //console.error('stderr chunk: '+chunk);
        stderr += chunk;
    }
    const exitCode: number = await new Promise( (resolve, reject) => {
        child.on('close', resolve);
    });
    
    return { stdout, stderr, exitCode };
  }

  const cmdStr = `g++ ${job.cflags} ${job.inPath} -o ${job.outPath}`;
  const cmdShlexed: string[] = shlex.split(cmdStr) || [];
  const cmd = cmdShlexed.shift() || '';
  const args = cmdShlexed || [];
  
  return spawnChild(cmd, args);
}

app.post('/compile', (req, res) => {
    const cflags: string = req.body.cflags || "";
    const inFilename: string = req.body.inFilename;
    const inPath: string = path.join(baseDir || "", inFilename||"");
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

app.listen(PORT, () => {
  console.log(`Compiler listening on port ${PORT}`);

  jobQueue = new JobQueue(QUEUE_MAX_JOBS, (job: Job): Promise<ProcessOutput> => {
    return compile(job);
  });
})