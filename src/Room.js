export default class Room {
  static get ALL_LABEL() {
    return [
      'アリーナ',
      '立ち見1',
      '立ち見2',
      '立ち見3',
      '立ち見4',
      '立ち見5',
      '立ち見6',
      '立ち見7',
      '立ち見8',
      '立ち見9',
      '立ち見10',
    ];
  }

  static get ALL_SHORT_LABEL() {
    return ['ｱ', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
  }

  static getIndex(label) {
    if (/c[oh]\d+/.test(label)) return 0;
    if (/バックステージパス/.test(label)) return 0;
    if (/アリーナ/.test(label)) return 0;
    if (/立ち見(\d)/.test(label)) return Room.ALL_LABEL.findIndex(l => l === label);
    return null;
  }

  constructor(label) {
    this.label = label;
    this.index = Room.getIndex(label);
  }

  get shortLabel() {
    if (Number.isInteger(this.index)) return Room.ALL_SHORT_LABEL[this.index];
    return '';
  }

  next() {
    if (this.index > 10) return new Room('立ち見席');
    if (Number.isInteger(this.index)) return new Room(Room.ALL_LABEL[this.index + 1]);
    return new Room('立ち見席');
  }

  previous() {
    if (this.index === 0) return new Room('');
    if (Number.isInteger(this.index)) return new Room(Room.ALL_LABEL[this.index - 1]);
    return new Room('');
  }
}
