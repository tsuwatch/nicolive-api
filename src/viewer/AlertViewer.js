import cheerio from 'cheerio';
import BaseViewer from './BaseViewer';

export default class AlertViewer extends BaseViewer {
  constructor({
    port,
    addr,
    thread,
    communityIds,
    cookie
  }) {
    super({
      port,
      addr,
      thread,
      version: '20061206',
      res_from: '-1',
      cookie
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
        const [liveId, communityId] = text.split(',');
        if (this.isFollowed(communityId)) {
          this.client.getStreamInfo(liveId)
            .then(streamInfo => this.connection.emit('notify', streamInfo))
            .catch(err => this.connection.emit('error', err));
        }
      }
    }));
  }

  isFollowed(communityId) {
    return this.followedCommunityIds.indexOf(communityId) !== -1
  }
}
