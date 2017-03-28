import request from 'request';
import cheerio from 'cheerio';
import querystring from 'querystring';
import AlertViewer from './viewer/AlertViewer';
import LiveViewer from './viewer/LiveViewer';

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

          const client = new NicoliveAPI(userSession);
          client.email = email;
          client.password = password;
          resolve(client);
        })
      );
    });
  }

  constructor(cookie) {
    this.cookie = cookie;
  }

  getPostKey(thread, lastRes) {
    return new Promise((resolve, reject) => {
      const query = querystring.stringify({
        thread,
        block_no: Math.floor((parseInt(lastRes) + 1) / 100)
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

  getAlertTicket() {
    return new Promise((resolve, reject) => {
      request.post(
        {
          url: 'https://secure.nicovideo.jp/secure/login?site=nicolive_antenna',
          form: {
            mail: this.email,
            password: this.password
          }
        }
        , ((err, res) => {
          if (err) reject(err);

          const body = cheerio(res.body);

          if (body['1'].attribs['status'] !== 'ok') reject('fail');

          resolve(body.find('ticket').eq(0).text());
        })
      );
    });
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

  getAlertStatus(ticket) {
    return new Promise((resolve, reject) => {
      request.post(
        {
          url: 'http://live.nicovideo.jp/api/getalertstatus',
          form: { ticket }
        }
        , ((err, res) => {
          if (err) reject(err);

          const body = cheerio(res.body);

          if (body['2'].attribs['status'] !== 'ok') reject('fail')

          const communities = body.find('community_id');
          let communityIds = [];
          for (let i=0, len=communities.length; i < len; i++) {
            const element = cheerio(communities[i]);
            communityIds.push(element.text());
          }

          resolve({
            user_hash: body.find('user_hash').eq(0).text(),
            addr: body.find('addr').eq(0).text(),
            port: body.find('port').eq(0).text(),
            thread: body.find('thread').eq(0).text(),
            communityIds
          });
        })
      );
    });
  }

  getStreamInfo(liveId) {
    return new Promise((resolve, reject) => {
      request({
        url: `http://live.nicovideo.jp/api/getstreaminfo/lv${liveId}`,
        headers: {
          Cookie: this.cookie
        }
      }, (err, res, body) => {
        if (err) reject(err);

        const streamInfo = cheerio(body);

        if (streamInfo['2'].attribs['status'] === 'fail') reject('fail');

        resolve({
          contentId: `lv${liveId}`,
          title: streamInfo.find('title').eq(0).text(),
          description: streamInfo.find('description').eq(0).text(),
          providerType: streamInfo.find('provider_type').eq(0).text(),
          defaultCommunity: streamInfo.find('default_community').eq(0).text(),
          name: streamInfo.find('name').eq(0).text(),
          thumbnail: streamInfo.find('thumbnail').eq(0).text()
        });
      });
    });
  }

  connectAlert() {
    return new Promise((resolve, reject) => {
      Promise.resolve()
        .then(() => {
          return this.getAlertTicket()
        })
        .then(ticket => {
          return this.getAlertStatus(ticket);
        })
        .then(status => {
          const {port, addr, thread, communityIds} = status;
          const viewer = new AlertViewer({port, addr, thread, communityIds, cookie: this.cookie});
          viewer.establish();

          resolve(viewer);
        })
        .catch(err => reject(err));
    });
  }


  connectLive(liveId) {
    return new Promise((resolve, reject) => {
      this.getPlayerStatus(liveId)
        .then(playerStatus => {
          const {port, addr, open_time, thread, version, res_from, user_id, premium, mail} = playerStatus;
          const viewer = new LiveViewer({
            port,
            addr,
            open_time,
            thread,
            version,
            res_from,
            user_id,
            premium,
            mail,
            cookie: this.cookie
          });
          viewer.establish();

          resolve(viewer);
      })
        .catch(err => reject(err));
    });
  }
}
