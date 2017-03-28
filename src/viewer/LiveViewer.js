import cheerio from 'cheerio';
import querystring from 'querystring';
import request from 'request';
import BaseViewer from './BaseViewer';

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
    cookie
  }) {
    super({
      port,
      addr,
      thread,
      version,
      res_from
    });

    this.open_time = open_time;
    this.user_id = user_id;
    this.premium = premium;
    this.mail = mail;
    this.cookie = cookie;
  }

  setOnDataEvent() {
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
          this.connection.emit('error', foundThread.toString());
        }
      }

      const comments = data.find('chat');
      for (let i=0, len=comments.length; i < len; i++) {
        const element = cheerio(comments[i]);
        const comment = {
          attr: element.attr(),
          text: element.text(),
          usericon: 'http://uni.res.nimg.jp/img/user/thumb/blank.jpg'
        };
        const {anonymity, user_id} = comment.attr;
        if (!anonymity && user_id) comment.usericon = `http://usericon.nimg.jp/usericon/${user_id.slice(0, 2)}/${user_id}.jpg`;
        this.connection.emit('comment', comment);
        this.last_res = comment.attr.no;
      }
    }));
  }

  comment(text, options = {}) {
    return new Promise((resolve, reject) => {
      this.getPostKey()
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

  getPostKey() {
    return new Promise((resolve, reject) => {
      const query = querystring.stringify({
        thread: this.thread,
        block_no: Math.floor((parseInt(this.last_res) + 1) / 100)
      });
      request({
        url: `http://live.nicovideo.jp/api/getpostkey?${query}`,
        headers: {
          Cookie: this.cookie
        }
      }, (err, res, body) => {
        if (err) reject(err);

        const postKey = body.split('=').pop();

        if (postKey === '') reject('fail');

        resolve(postKey);
      })
    });
  }
}
