export default class Comment {
  constructor(element, room) {
    this.attr = element.attr();
    this.text = element.text();
    this.room = room;
  }

  get userIcon() {
    const {anonymity, user_id} = this.attr;
    if (!anonymity && user_id) return `http://usericon.nimg.jp/usericon/${user_id.slice(0, 2)}/${user_id}.jpg`;
    return 'http://uni.res.nimg.jp/img/user/thumb/blank.jpg';
  }

  isEject() {
    const {premium} = this.attr;
    return premium === '3' && this.text.includes('/hb ifseetno');
  }

  isUser() {
    const {premium} = this.attr;
    return premium === '0' || premium === '1';
  }

  isSystem() {
    const {premium} = this.attr;
    return premium === '3' || premium === '4' || premium === '5';
  }

  isBSP() {
    return this.attr.premium === '6';
  }
}
