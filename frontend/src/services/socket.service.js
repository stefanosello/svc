import { io } from 'socket.io-client'

const SocketService = {
    init() {
        this.socket = io(`${process.env.VUE_APP_API_HOST}:${process.env.VUE_APP_API_PORT}`);
    },

    on(channel, cb) {
        this.socket.on(channel, cb);
    }
};
  
export { SocketService }