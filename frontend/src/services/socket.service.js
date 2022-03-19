import { io } from 'socket.io-client'
import apiService from './api.service';

class SocketService {
  socket;
  connected;

  constructor() {
    this.connected = false;
  }

  init() {
    this.socket = io(`${process.env.VUE_APP_API_HOST}:${process.env.VUE_APP_API_PORT}`);
    this.socket.on('connect', () => {
      this.connected = true;
      apiService.updateClientId(this.socket.id);
    });
  }

  on(channel, cb) {
    this.socket.on(channel, cb);
  }
}

export default new SocketService();