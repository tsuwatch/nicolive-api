# nicolive-api
[![npm version](https://badge.fury.io/js/nicolive-api.svg)](https://badge.fury.io/js/nicolive-api)
[![Build Status](https://travis-ci.org/tsuwatch/nicolive-api.svg?branch=master)](https://travis-ci.org/tsuwatch/nicolive-api)

ニコニコ生放送のコメントビューア用に開発したコメントサーバなどに接続するためのライブラリです。以下のAPIなども利用することが可能です。

- ユーザー情報
- コミュニティ、チャンネル情報
- ニコ生アラート

## Installation

`npm install --save nicolive-api`

## Usage

```javascript
import nicolive from 'nicolive-api'

nicolive.login('foo@bar.com', 'xxx').then(client => {
  client.connectLive('lvxxxx').then(manager => {
    manager.viewer.connection.on('comment', (comment => {
      console.log(comment.text);
    }));
    manager.viewer.connection.on('ejected', () => {
      console.log('追い出されました');
      manager.disconnect();
    });
  });

  client.connectAlert().then(viewer => {
    viewer.connection.on('handshaked', () => {
      console.log('handshaked');
    });
    viewer.connection.on('notify', (info => {
      console.log(info.contentId);
    }));
  });
});
```
