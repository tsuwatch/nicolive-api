import net from 'net';
import request from 'request';
import cheerio from 'cheerio';
import querystring from 'querystring';

export default class NicoliveAPI {
  static login({email, password}) {
    return new Promise((resolve, reject) => {
      request.post(
        {
          url: 'https://secure.nicovideo.jp/secure/login',
          form: {
            mail_tel: email,
            password
          }
        }
        , ((err, res) => {
          if (err) reject(err);

          const cookies = res.headers['set-cookie'];
          const cookie = cookies.find((cookie => cookie.indexOf('user_session=user_session') === 0)) || '';
          const userSession = cookie.slice(0, cookie.indexOf(';') + 1)
          if (!userSession) reject('Invalid user');
          resolve(new NicoliveAPI(userSession));
        })
      );
    });
  }

  constructor(cookie) {
    this.cookie = cookie;
    this.connection = null;
    this.playerStatus = null;
    this.attrs = null;
  }

  getPlayerStatus(liveId) {
    return new Promise((resolve, reject) => {
      request({
        url: `http://live.nicovideo.jp/api/getplayerstatus/${liveId}`,
        headers: {
          Cookie: this.cookie
        }
      }, (err, res, body) => {
        if (err) reject(err);

        const playerStatus = cheerio(body);

        const errMessage = playerStatus.find('error code').text();
        if (errMessage.length) reject(errMessage);

        const ms = playerStatus.find('ms');
        resolve({
          port: ms.find('port').eq(0).text(),
          addr: ms.find('addr').eq(0).text(),
          open_time: playerStatus.find('open_time').eq(0).text(),
          title: playerStatus.find('title').eq(0).text(),
          description: playerStatus.find('description').eq(0).text(),
          thread: ms.find('thread').eq(0).text(),
          version: '20061206',
          res_from: 0,
          user_id: playerStatus.find('user_id').eq(0).text(),
          premium: playerStatus.find('is_premium').eq(0).text(),
          mail: '184'
        });
      });
    });
  }

  getPostKey() {
    return new Promise((resolve, reject) => {
      const query = querystring.stringify({
        thread: this.attrs.thread,
        block_no: Math.floor((parseInt(this.playerStatus.no) + 1) / 100)
      });
      request({
        url: `http://live.nicovideo.jp/api/getpostkey?${query}`,
        headers: {
          Cookie: this.cookie
        }
      }, (err, res, body) => {
        if (err) reject(err);

        resolve(body.split('=').pop());
      })
    });
  }

  connect(liveId) {
    return new Promise((resolve, reject) => {
      this.getPlayerStatus(liveId)
        .then(playerStatus => {
          this.playerStatus = playerStatus;
          const {port, addr, thread, version, res_from, user_id, premium, mail} = playerStatus;
          this.connection = net.connect(port, addr);

          this.connection.on('connect', () => {
            const comment = cheerio('<thread />');
            comment.attr({thread, version, res_from});
            comment.options.xmlMode = 'on';
            this.connection.write(comment.toString() + '\0');
            this.connection.setEncoding('utf-8');
          });

          this.connection.on('data', ((buffer) => {
            const chunk = buffer.toString();
            if (!chunk.match(/\0$/)) return;
            const data = cheerio(`<data>${chunk}</data>`);

            const resultCodeValue = data.find('thread').attr('resultcode');
            if (resultCodeValue) {
              const foundThread = data.find('thread');
              const ticket = foundThread.attr('ticket');
              playerStatus.last_res = foundThread.attr('last_res');
              this.attrs = {thread, ticket, mail, user_id, premium};
              if (resultCodeValue === '0') {
                this.connection.emit('handshaked', this.attrs, playerStatus);
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
              if (comment.attr.no > playerStatus.comment_count) playerStatus.last_res = comment.attr.no;
            }
          }));

          resolve(this.connection);
      })
        .catch(err => reject(err));
    });
  }

  comment(text, options = {}) {
    this.getPostKey().then(postkey => {
      const vpos = (Math.floor(Date.now() / 1000) - this.playerStatus.open_time) * 100;
      const chat = cheerio('<chat />');
      chat.attr(JSON.parse(JSON.stringify(this.attrs)));
      chat.attr({vpos})
      chat.attr({postkey});
      if (options.mail) chat.attr('mail', options.mail);
      chat.text(text);

      this.connection.write(`${chat}\0`);
    });
  }
}
