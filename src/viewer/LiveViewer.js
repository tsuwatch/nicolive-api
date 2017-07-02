import cheerio from 'cheerio';
import BaseViewer from './BaseViewer';
import Comment from '../Comment';

export default class LiveViewer extends BaseViewer {
  constructor({
    port,
    addr,
    open_time,
    thread,
    version,
    res_from,
    user_id,
    premium,
    mail,
    cookie,
    room
  }) {
    super({
      port,
      addr,
      thread,
      version,
      res_from,
      cookie
    });

    this.open_time = open_time;
    this.user_id = user_id;
    this.premium = premium;
    this.mail = mail;
    this.room = room;
  }

  setOnDataEvent(connection) {
    const mainConnection = connection ? connection : this.connection;
    this.connection.on('data', (buffer => {
      const chunk = buffer.toString();
      if (!chunk.match(/\0$/)) return;
      const data = cheerio(`<data>${chunk}</data>`);

      const resultCodeValue = data.find('thread').attr('resultcode');
      if (resultCodeValue) {
        const foundThread = data.find('thread');
        this.ticket = foundThread.attr('ticket');
        this.last_res = foundThread.attr('last_res');
        if (resultCodeValue === '0') {
          this.connection.emit('handshaked');
        } else {
          this.connection.emit('fail', foundThread.toString());
          this.connection.destroy();
        }
      }

      const comments = data.find('chat');
      for (let i=0, len=comments.length; i < len; i++) {
        const element = cheerio(comments[i]);
        const comment = new Comment(element, this.room);

        mainConnection.emit('comment', comment);
        this.last_res = comment.attr.no;
      }
    }));
  }

  comment(text, options = {}) {
    return new Promise((resolve, reject) => {
      this.client.getPostKey(this.thread, this.last_res)
        .then(postkey => {
          const vpos = (Math.floor(Date.now() / 1000) - this.open_time) * 100;
          const chat = cheerio('<chat />');
          chat.attr(JSON.parse(JSON.stringify({
            thread: this.thread,
            ticket: this.ticket,
            mail: this.mail,
            user_id: this.user_id,
            premium: this.premium
          })));
          chat.attr({vpos})
          chat.attr({postkey});
          if (options.mail) chat.attr('mail', options.mail);
          chat.text(text);

          this.connection.write(`${chat}\0`);
          resolve();
        })
        .catch(err => reject(err));
    });
  }
}
