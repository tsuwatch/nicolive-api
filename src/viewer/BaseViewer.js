import net from 'net';
import cheerio from 'cheerio';
import NicoliveAPI from '../NicoliveAPI';

export default class BaseViewer {
  constructor({
    port,
    addr,
    thread,
    version,
    res_from,
    cookie
  }) {
    this.port = port;
    this.addr = addr;
    this.thread = thread;
    this.version = version;
    this.res_from = res_from;
    this.connection = null;
    this.client = new NicoliveAPI(cookie);
  }

  establish(viewer) {
    this.connect();
    this.setOnConnectEvent();
    this.setOnDataEvent(viewer);
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
