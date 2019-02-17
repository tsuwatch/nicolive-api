export default class Room {
  static getIndex(label) {
    if (/c[oh]\d+/.test(label)) return 0;
    if (/バックステージパス/.test(label)) return 0;
    if (/アリーナ/.test(label)) return 0;
    if (/立ち見(\d)/.test(label)) return Number(label.match(/立ち見(\d)/)[1]);
    return null;
  }

  constructor(label) {
    this.label = label;
    this.index = Room.getIndex(label);
  }

  get shortLabel() {
    if (this.index === 0) return 'ｱ';
    if (Number.isInteger(this.index)) return this.index;
    return '';
  }

  next() {
    if (Number.isInteger(this.index)) return new Room(`立ち見${this.index + 1}`);
    return new Room('');
  }

  previous() {
    if (this.index === 0) return new Room('');
    if (this.index === 1) return new Room('アリーナ');
    if (Number.isInteger(this.index)) return new Room(`立ち見${this.index - 1}`);
    return new Room('');
  }
}
