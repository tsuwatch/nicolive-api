# nicolive-api
[![npm version](https://badge.fury.io/js/nicolive-api.svg)](https://badge.fury.io/js/nicolive-api)
[![Build Status](https://travis-ci.org/tsuwatch/nicolive-api.svg?branch=master)](https://travis-ci.org/tsuwatch/nicolive-api)

a comments viewer wrapper for live.nicovideo.jp

## Installation

`npm install --save nicolive-api`

## Usage

```javascript
import nicolive from 'nicolive-api'

nicolive.login('foo@bar.com', 'xxx').then(client => {
  client.connectLive('lvxxxx').then(viewer => {
    viewer.connection.on('handshaked', () => {
      viewer.comment('wakotsu');
    });

    viewer.connection.on('comment', (comment => {
      console.log(comment.text);
    }));
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
