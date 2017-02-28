import request from 'request';
import cheerio from 'cheerio';

export default function(liveId, cookie) {
  return new Promise((resolve, reject) => {
    request({
      url: `http://live.nicovideo.jp/api/getplayerstatus/${liveId}`,
      headers: {
        Cookie: cookie
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
