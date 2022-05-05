import { Response } from 'express';

export interface ProcessOutput {
  stdout: string,
  stderr: string,
  exitCode: number
};
export interface Job {
  inPath: string,
  outPath: string,
  cflags: string,
  res: Response
};
export interface CompilationResult {
  procOutput: ProcessOutput,
  inPath: string,
  outPath: string
}

export default class JobQueue {
  private activeJobs: number;
  private maxJobs: number;
  private cb: Function;
  private jobs: Job[];

  constructor(maxJobs: number, cb: Function) {
    this.maxJobs = maxJobs;
    this.activeJobs = 0;
    this.jobs = [];
    this.cb = cb;
  }

  public async execute(job: Job) {
    if (this.activeJobs < this.maxJobs) {
      this.activeJobs += 1;
      const procOutput: ProcessOutput = await this.cb(job);
      
      this.activeJobs --;
      this.executePendingJob()
      const responseBody: CompilationResult = {
        procOutput,
        inPath: job.inPath,
        outPath: job.outPath
      }
      job.res.status(200).send(responseBody);
    } else {
    
      this.enqueue(job);

    }
  }

  private executePendingJob() {
    const job: Job | undefined = this.dequeue();
    if (job) {
      this.execute(job);
    }
  }

  public getMaxJobs(): number {
    return this.maxJobs;
  }

  public getActiveJobs(): number {
    return this.activeJobs;
  }

  private enqueue(job: Job) {
    this.jobs.push(job);
  }

  private dequeue(): Job | undefined {
    return this.jobs.shift();
  }
}