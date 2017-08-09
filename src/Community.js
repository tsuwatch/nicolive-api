export default class Community {
  static get COMMUNITY_LEVEL_STAND_ROOM_COUNT_TABLE() {
    return [
      [0, 49, 1], [50, 69, 2], [70, 104, 3], [105, 149, 4], [150, 189, 5], [190, 229, 6], [230, 255, 7], [256, 999, 9]
    ];
  }

  constructor({global_id, name, description, level, thumbnail} = {}) {
    this.id = global_id;
    this.name = name;
    this.description = description;
    this.level = level;
    this.thumbnail = thumbnail;
  }

  isChannel() {
    return /ch\d+/.test(this.id);
  }

  standRoomCount() {
    return Community.COMMUNITY_LEVEL_STAND_ROOM_COUNT_TABLE.find(el => el[0] <= this.level && el[1] >= this.level)[2];
  }
}
