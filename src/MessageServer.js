export default class MessageServer {
  static get COMMUNITY_MESSAGE_SERVERS() {
    return [
      [101, 2805], [102, 2815], [103, 2825], [104, 2835], [105, 2845],
      [101, 2806], [102, 2816], [103, 2826], [104, 2836], [105, 2846],
      [101, 2807], [102, 2817], [103, 2827], [104, 2837], [105, 2847],
      [101, 2808], [102, 2818], [103, 2828], [104, 2838], [105, 2848],
      [101, 2809], [102, 2819], [103, 2829], [104, 2839], [105, 2849],
      [101, 2810], [102, 2820], [103, 2830], [104, 2840], [105, 2850],
      [101, 2811], [102, 2821], [103, 2831], [104, 2841], [105, 2851],
      [101, 2812], [102, 2822], [103, 2832], [104, 2842], [105, 2852],
      [101, 2813], [102, 2823], [103, 2833], [104, 2843], [105, 2853],
      [101, 2814], [102, 2824], [103, 2834], [104, 2844], [105, 2854]
    ];
  }

  static get CHANNEL_MESSAGE_SERVERS() {
    return [
      [101, 2815], [102, 2828], [103, 2841], [104, 2854], [105, 2867], [106, 2880],
      [101, 2816], [102, 2829], [103, 2842], [104, 2855], [105, 2868], [106, 2881],
      [101, 2817], [102, 2830], [103, 2843], [104, 2856], [105, 2869], [106, 2882]
    ];
  }

  static firstMessageServer(isChannel) {
    return isChannel ? MessageServer.CHANNEL_MESSAGE_SERVERS[0] : MessageServer.COMMUNITY_MESSAGE_SERVERS[0];
  }

  static lastMessageServer(isChannel) {
    return isChannel ? MessageServer.CHANNEL_MESSAGE_SERVERS[MessageServer.CHANNEL_MESSAGE_SERVERS.length - 1] : MessageServer.COMMUNITY_MESSAGE_SERVERS[MessageServer.COMMUNITY_MESSAGE_SERVERS.length - 1];
  }

  constructor({addr, port, thread, room}) {
    this.addr = addr;
    this.port = ~~port;
    this.thread = ~~thread;
    this.room = room;
  }

  previous() {
    return this.neighbor(-1);
  }

  next() {
    return this.neighbor(1);
  }

  neighbor(count) {
    const thread = this.thread + count;
    const serverNumber = ~~this.addr.match(/\D+(\d+)\D+/)[1];
    const serverIndex = this.getServerIndex(serverNumber);

    let server = null;
    if (count === -1 && this.isFirstMessageServer(serverNumber)) {
      server = MessageServer.lastMessageServer(this.isChannel());
    } else if (count === 1 && this.isLastMessageServer(serverNumber)) {
      server = MessageServer.firstMessageServer(this.isChannel());
    } else {
      const index = serverIndex + count;
      server = this.isChannel() ? MessageServer.CHANNEL_MESSAGE_SERVERS[index] : MessageServer.COMMUNITY_MESSAGE_SERVERS[index];
    }

    let room = null;
    if (count === 1) {
      room = this.room.next();
    } else {
      room = this.room.previous();
    }

    const addr = this.buildMessageServerAddr({addr: this.addr, serverNumber: server[0]});

    return new MessageServer({addr: addr, port: server[1], thread, room: room});
  }

  isChannel() {
    return /omsg\d+/.test(this.addr);
  }

  isFirstMessageServer(serverNumber) {
    const firstMessageServer = MessageServer.firstMessageServer(this.isChannel());
    return firstMessageServer[0] === serverNumber && firstMessageServer[1] === this.port;
  }

  isLastMessageServer(serverNumber) {
    const lastMessageServer = MessageServer.lastMessageServer(this.isChannel());
    return lastMessageServer[0] === serverNumber && lastMessageServer[1] === this.port;
  }

  getServerIndex(serverNumber) {
    const servers = this.isChannel() ? MessageServer.CHANNEL_MESSAGE_SERVERS : MessageServer.COMMUNITY_MESSAGE_SERVERS;
    return servers.findIndex(server => server[0] === serverNumber && server[1] === this.port);
  }

  buildMessageServerAddr({addr, serverNumber}) {
    const matched = addr.match(/(\D+)\d+(\D+)/);
    return `${matched[1]}${serverNumber}${matched[2]}`;
  }
}
