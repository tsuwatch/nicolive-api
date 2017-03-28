import cheerio from 'cheerio';
import BaseViewer from './BaseViewer';

export default class AlertViewer extends BaseViewer {
  constructor({
    port,
    addr,
    thread,
    communityIds
  }) {
    super({
      port,
      addr,
      thread,
      version: '20061206',
      res_from: '-1'
    });

    this.followedCommunityIds = communityIds;
  }

  setOnDataEvent() {
    this.connection.on('data', (buffer => {
      const data = cheerio(`<data>${buffer}</data>`);
      const resultCode = data.find('thread').attr('resultcode');

      if (resultCode === '0') this.connection.emit('handshaked');

      const comments = data.find('chat');
      for (let i=0, len=comments.length; i < len; i++) {
        const element = cheerio(comments[i]);
        const text = element.text();
        if (this.isFollowed(text.split(',')[1])) {
          const comment = {
            attr: element.attr(),
            text
          };
          this.connection.emit('notify', comment);
        }
      }
    }));
  }

  isFollowed(communityId) {
    return this.followedCommunityIds.indexOf(communityId) !== -1
  }
}
