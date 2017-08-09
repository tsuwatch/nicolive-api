import MessageServer from './MessageServer';
import LiveViewer from './viewer/LiveViewer';
import User from './User';
import Live from './Live';
import Room from './Room';

export default class Manager {
  constructor(playerStatus, cookie) {
    const {addr, port, thread} = playerStatus.ms;
    this.messageServer = new MessageServer({addr, port, thread, room: new Room(playerStatus.user.room_label)});
    this.user = new User(playerStatus.user);
    this.live = new Live(playerStatus.stream);
    this.viewer = null;
    this.cookie = cookie;
    this._messageServers = [];
    this._viewers = [];
  }

  connect(server) {
    return new Promise((resolve, reject) => {
      const {addr, port, thread} = server;
      const viewer = new LiveViewer({
        addr,
        port,
        thread,
        open_time: this.live.openTime,
        user_id: this.user.userId,
        premium: this.user.premium,
        mail: '184',
        res_from: 0,
        version: '20061206',
        cookie: this.cookie,
        room: server.room
      });
      viewer.establish(this.viewer ? this.viewer.connection : null);
      viewer.connection.on('handshaked', () => resolve(viewer));
      viewer.connection.on('fail', () => reject());
      viewer.connection.on('comment', (comment) => {
        if (this._isEjectMe(comment)) viewer.connection.emit('ejected');
      });
    });
  }

  seekArenaRoom() {
    return new Promise((resolve) => this._connectPreviousRoom(this._messageServers[0].previous(), resolve));
  }

  seekLastRoom() {
    return new Promise((resolve) => this._connectNextRoom(this._messageServers[this._messageServers.length - 1].next(), resolve));
  }

  connectAll() {
    return new Promise((resolve) => {
      this._messageServers = [this.messageServer];

      this.connect(this.messageServer)
        .then((viewer) => {
          this.viewer = viewer;
          this._viewers.push(viewer);
          return this.seekArenaRoom()
        })
        .then(() => this.seekLastRoom())
        .then(() => resolve());
    });
  }

  disconnect() {
    for (let i=0; i<this._viewers.length; i++) {
      this._viewers[i].connection.destroy();
    }
  }

  _connectPreviousRoom(server, res) {
    return new Promise((resolve) => {
      this.connect(server)
        .then(viewer => {
          this._messageServers.unshift(server);
          this._viewers.unshift(viewer);
          resolve(server);
        })
        .catch(() => res());
    }).then(server => this._connectPreviousRoom(server.previous(), res));
  }

  _connectNextRoom(server, res) {
    return new Promise((resolve) => {
      this.connect(server)
        .then(viewer => {
          this._messageServers.push(server);
          this._viewers.push(viewer);
          resolve(server);
        })
        .catch(() => res());
    }).then(server => this._connectNextRoom(server.next(), res));
  }

  _isEjectMe(comment) {
    return comment.isEject() && Number(comment.attr.thread) === this.messageServer.thread && Number(comment.text.match(/\d+/)[0]) === Number(this.user.roomSeetno);
  }
}
