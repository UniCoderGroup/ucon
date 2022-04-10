import { io, Socket } from "socket.io-client";

export class BrowserLogger {
  constructor(name: string = "Unnamed") {
    this.name = name;
  }

  name: string;
  socket?: Socket;

  attach(serverUri: string) {
    if (this.socket) this.detach();
    this.socket = io(serverUri);
    this.socket.emit("attach", this.name);
  }

  detach() {
    if (!this.socket) throw new Error("Please attech log server!");
    this.socket.emit("dettach");
    this.socket.disconnect();
    this.socket = undefined;
  }

  log(...objs: any[]) {
    let str = JSON.stringify(objs);
    if (!this.socket) throw new Error("Please attech log server!");
    this.socket.emit("log message", str);
  }
}

var debug_logger = new BrowserLogger();
export default debug_logger;
