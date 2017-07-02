export default class User {
  constructor({user_id, nickname, premium, room_label, room_seetno}) {
    this.userId = user_id;
    this.nickname = nickname;
    this.premium = premium;
    this.roomLabel = room_label;
    this.roomSeetno = room_seetno;
  }
}
