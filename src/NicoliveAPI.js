import request from 'request';
import cheerio from 'cheerio';
import querystring from 'querystring';
import AlertViewer from './viewer/AlertViewer';
import Manager from './Manager';
import Community from './Community';
import User from './User';

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
        , ((err, res, body) => {
          if (err) reject(err);

          const alertTicket = cheerio(body);

          if (alertTicket['1'].attribs['status'] !== 'ok') reject('fail');

          resolve(alertTicket.find('ticket').eq(0).text());
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
        const stream = playerStatus.find('stream');
        const user = playerStatus.find('user');
        resolve({
          stream: {
            title: stream.find('title').eq(0).text(),
            description: stream.find('description').eq(0).text(),
            default_community: stream.find('default_community').eq(0).text(),
            watch_count: stream.find('watch_count').eq(0).text(),
            comment_count: stream.find('comment_count').eq(0).text(),
            open_time: stream.find('open_time').eq(0).text(),
          },
          ms: {
            addr: ms.find('addr').eq(0).text(),
            port: ms.find('port').eq(0).text(),
            thread: ms.find('thread').eq(0).text(),
          },
          user: {
            user_id: user.find('user_id').eq(0).text(),
            nickname: user.find('nickname').eq(0).text(),
            premium: user.find('is_premium').eq(0).text(),
            room_label: user.find('room_label').eq(0).text(),
            room_seetno: user.find('room_seetno').eq(0).text()
          },
          version: '20061206',
          res_from: 0,
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
        , ((err, res, body) => {
          if (err) reject(err);

          const alertStatus = cheerio(body);

          if (alertStatus['2'].attribs['status'] !== 'ok') reject('fail')

          const communities = alertStatus.find('community_id');
          let communityIds = [];
          for (let i=0, len=communities.length; i < len; i++) {
            const element = cheerio(communities[i]);
            communityIds.push(element.text());
          }

          resolve({
            user_hash: alertStatus.find('user_hash').eq(0).text(),
            addr: alertStatus.find('addr').eq(0).text(),
            port: alertStatus.find('port').eq(0).text(),
            thread: alertStatus.find('thread').eq(0).text(),
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

  getCommunityInfo(communityId) {
    return new Promise((resolve, reject) => {
      request({
        url: `http://api.ce.nicovideo.jp/api/v1/community.info?id=${communityId}`,
        headers: {
          Cookie: this.cookie
        }
      }, (err, res, body) => {
        if (err) reject(err);

        const data = cheerio(body);

        const error = data.find('error');
        if (error.length !== 0) {
          reject({
            code: error.find('code').eq(0).text(),
            description: error.find('description').eq(0).text()
          });
        }

        resolve(new Community({
          global_id: data.find('global_id').eq(0).text(),
          name: data.find('name').eq(0).text(),
          description: data.find('description').eq(0).text(),
          level: data.find('level').eq(0).text(),
          thumbnail: data.find('thumbnail').eq(0).text()
        }));
      });
    });
  }

  getUserInfo(userId) {
    return new Promise((resolve, reject) => {
      request({
        url: `http://api.ce.nicovideo.jp/api/v1/user.info?user_id=${userId}`,
      }, (err, res, body) => {
        if (err) reject(err);

        const data = cheerio(body);

        const error = data.find('error');
        if (error.length !== 0) {
          reject({
            code: error.find('code').eq(0).text(),
            description: error.find('description').eq(0).text()
          });
        }

        resolve(new User({
          user_id: data.find('id').eq(0).text(),
          nickname: data.find('nickname').eq(0).text(),
          thumbnail_url: data.find('thumbnail_url').eq(0).text()
        }))
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
      Promise.resolve()
        .then(() => {
          return this.getPlayerStatus(liveId)
        })
        .then(playerStatus => {
          return new Manager(playerStatus, this.cookie);
        }).then(manager => {
          manager.connectAll().then(() => resolve(manager));
        })
        .catch(err => reject(err));
    });
  }
}
