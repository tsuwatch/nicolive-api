export default class Community {
  static get COMMUNITY_LEVEL_STAND_ROOM_COUNT_TABLE() {
    return [
      [0, 49, 1], [50, 69, 2], [70, 104, 3], [105, 149, 4], [150, 189, 5], [190, 229, 6], [230, 255, 7], [256, 999, 9]
    ];
  }

  static createByCommunityData(htmlData) {
    return new this({
      title: htmlData.find('.communityData > .title').text().trim(),
      level: ~~htmlData.find('.communityScale > .content').first().text().trim(),
      thumbnailUrl: htmlData.find('.communityThumbnail').find('img').attr('src')
    });
  }

  static createByChannelData(htmlData) {
    return new this({
      title: htmlData.find('#head_cp_breadcrumb').find('h1 > a').text().trim(),
      thumbnailUrl: htmlData.find('#cp_symbol').find('img').attr('data-original')
    });
  }

  constructor({communityId, title, level, thumbnailUrl}) {
    this.communityId = communityId;
    this.title = title;
    this.level = level;
    this.thumbnailUrl = thumbnailUrl;
  }

  isChannel() {
    return /ch\d+/.test(this.communityId);
  }

  standRoomCount() {
    return Community.COMMUNITY_LEVEL_STAND_ROOM_COUNT_TABLE.find(el => el[0] <= this.level && el[1] >= this.level)[2];
  }
}
