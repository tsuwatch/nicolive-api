export default class User {
  constructor({user_id, nickname, thumbnail_url, premium, room_label, room_seetno} = {}) {
    this.id = user_id;
    this.nickname = nickname;
    this.thumbnailUrl = thumbnail_url;
    this.premium = premium;
    this.roomLabel = room_label;
    this.roomSeetno = room_seetno;
  }
}
