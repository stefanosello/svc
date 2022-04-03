import { Server as socketServer, Socket } from 'socket.io';
import { Server as httpServer } from "http";

export default class SocketHandler {
  private sockets: {[key: string]: Socket} = {};
  private socketInstance: socketServer;

  constructor(httpServer: httpServer, options: any) {
    this.socketInstance = new socketServer(httpServer, options);
  }

  public getSocketInstance(): socketServer {
    return this.socketInstance;
  }

  public getClientSocket(clientId: string): Socket | undefined {
    return this.sockets[clientId] || undefined;
  }

  public addClientSocket(clientId: string, socket: Socket) {
    if (!this.getClientSocket(clientId)) {
      this.sockets[clientId] = socket;
    }
  }

  public removeClientSocket(clientId: string) {
    delete this.sockets[clientId];
  }

  public emitToClient(clientId: string, event: string, data: any) {
    const socket: Socket | undefined = this.getClientSocket(clientId);
    if (socket) {
      socket.emit(event, data);
    }
  }
}