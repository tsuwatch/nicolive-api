import net from 'net';
import cheerio from 'cheerio';

export default class BaseViewer {
  constructor({
    port,
    addr,
    thread,
    version,
    res_from
  }) {
    this.port = port;
    this.addr = addr;
    this.thread = thread;
    this.version = version;
    this.res_from = res_from;
    this.connection = null;
  }

  establish() {
    this.connect();
    this.setOnConnectEvent();
    this.setOnDataEvent();
  }

  connect() {
    this.connection = net.connect(this.port, this.addr);
  }

  setOnConnectEvent() {
    this.connection.on('connect', () => {
      const comment = cheerio('<thread />');
      comment.attr({
        thread: this.thread,
        version: this.version,
        res_from: this.res_from
      });
      comment.options.xmlMode = 'on';
      this.connection.write(`${comment}\0`);
      this.connection.setEncoding('utf-8');
    });
  }

  setOnDataEvent() {
    throw new Error('Not implemented error');
  }
}
