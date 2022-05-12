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

  private maxJobsReached: number;

  constructor(maxJobs: number, cb: Function) {
    this.maxJobs = maxJobs;
    this.activeJobs = 0;
    this.jobs = [];
    this.cb = cb;

    this.maxJobsReached = 0;
  }

  public async execute(job: Job) {
    if (this.activeJobs < this.maxJobs) {
      this.activeJobs += 1;
      if (this.activeJobs > this.maxJobsReached) {
        this.maxJobsReached = this.activeJobs;
        console.log(`[COMPILER] Max active jobs: ${this.activeJobs}`)
      }
      const procOutput: ProcessOutput = await this.cb(job);
      
      this.activeJobs -= 1;
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

  public setMaxJobs(maxJobs: number) {
    this.maxJobs = maxJobs;
  }
  public getMaxJobs(): number {
    return this.maxJobs;
  }

  public getActiveJobs(): number {
    return this.activeJobs;
  }

  public setMaxJobsReached(maxJobsReached: number) {
    this.maxJobsReached = maxJobsReached;
  }
  
  public getMaxJobsReached(): number {
    return this.maxJobsReached;
  }

  private enqueue(job: Job) {
    this.jobs.push(job);
  }

  private dequeue(): Job | undefined {
    return this.jobs.shift();
  }
}