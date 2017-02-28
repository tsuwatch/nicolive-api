import net from 'net';
import cheerio from 'cheerio';
import getPlayerStatus from './getPlayerStatus';

export default function(liveId, cookie) {
  return new Promise((resolve, reject) => {
    getPlayerStatus(liveId, cookie)
      .then(playerStatus => {
        const {port, addr, thread, version, res_from, user_id, premium, mail} = playerStatus;
        const viewer = net.connect(port, addr);

        viewer.on('connect', () => {
          const comment = cheerio('<thread />');
          comment.attr({thread, version, res_from});
          comment.options.xmlMode = 'on';
          viewer.write(comment.toString() + '\0');
          viewer.setEncoding('utf-8');
        });

        viewer.on('data', ((buffer) => {
          const chunk = buffer.toString();
          if (!chunk.match(/\0$/)) return;
          const data = cheerio(`<data>${chunk}</data>`);

          const resultCodeValue = data.find('thread').attr('resultcode');
          if (resultCodeValue) {
            const foundThread = data.find('thread');
            const ticket = foundThread.attr('ticket');
            playerStatus.last_res = foundThread.attr('last_res');
            const attrs = {thread, ticket, mail, user_id, premium: premium};
            if (resultCodeValue === '0') {
              viewer.emit('handshaked', attrs, playerStatus);
            } else {
              viewer.emit('error', data.find('thread').toString());
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
            viewer.emit('comment', comment);
            if (comment.attr.no > playerStatus.comment_count) playerStatus.last_res = comment.attr.no;
          }
        }));

        resolve(viewer);
    })
      .catch(err => reject(err));
  });
}
