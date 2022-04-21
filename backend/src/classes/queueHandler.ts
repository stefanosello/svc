import RedisSMQ from 'rsmq';
const NAMESPACE = 'rsmq';

export default class QueueHandler {
  private maxJobs: number;
  private queueInstance: RedisSMQ;

  private countJobs: number;

  constructor() {
    this.maxJobs = parseInt(process.env.BACKEND_QUEUE_MAXJOBS || "") || 0;
    this.countJobs = 0;
    this.queueInstance = new RedisSMQ({
      host: process.env.BACKEND_QUEUE_HOST,
      port: parseInt(process.env.BACKEND_QUEUE_PORT || ""),
      ns: NAMESPACE,
      realtime: true
    });
  }

  public getQueueInstance(): RedisSMQ {
    return this.queueInstance;
  }

  public getMaxJobs(): number {
    return this.maxJobs;
  }

  public createQueue(queueName: string): void {
    this.queueInstance.createQueue({ qname: queueName }, (err, resp) => {
      if (err) {
        if (`${err}`.startsWith("queueExists")) { console.log("[QUEUE] Queue already exists"); }
        else { console.error(err); }
      } else if (resp === 1) {
        console.log(`[QUEUE] Queue '${queueName}' created. Max items: ${this.maxJobs}`);
      }
    });
  }

  public async pushToQueue(queueName: string, message: string): Promise<string | boolean> {
/*    
    if ((await this.getQueueLength(queueName)) >= this.maxJobs) {
      throw new Error("[QUEUE] Max jobs reached!"); // TODO: throw custom error for max jobs
    } else {
      let messageId = await this.queueInstance.sendMessageAsync({ qname: queueName, message });
      return messageId || false;
    }
*/

/*
    console.log("[QUEUE] Waiting for queue...")
    await this.isQueueFree();
    

    this.countJobs++;
    console.log("[QUEUE] go")
    let messageId = await this.queueInstance.sendMessageAsync({ qname: queueName, message });
    return messageId || false;
*/
    let messageId = await this.queueInstance.sendMessageAsync({ qname: queueName, message });
    return messageId || false;
  }

  public decrement() {
    this.countJobs--;
  }

  private async isQueueFree() {
    return new Promise((resolve, reject) => {

      while(this.countJobs >= this.maxJobs) { }

      resolve(true);
      /*
      let interval = setInterval( ()=>{
        
        if (this.countJobs < this.maxJobs) {
          resolve(true);
          clearInterval(interval);
        }
        
      }, 100);

      */
    })
  }

  private async getQueueLength(queueName: string): Promise<number> {
    const queueInfo = await this.queueInstance.getQueueAttributesAsync({ qname: queueName });
    return queueInfo.msgs;
  }

}