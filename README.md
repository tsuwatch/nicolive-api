# nicolive-api
[![npm version](https://badge.fury.io/js/nicolive-api.svg)](https://badge.fury.io/js/nicolive-api)
[![Build Status](https://travis-ci.org/tsuwatch/nicolive-api.svg?branch=master)](https://travis-ci.org/tsuwatch/nicolive-api)

an api client for live.nicovideo.jp

## Installation

`npm install --save nicolive-api`

## Usage

```javascript
import nicolive from 'nicolive-api'

nicolive.login('foo@bar.com', 'xxx').then(client => {
  client.connect('lvxxxx').then(connection => {
    connection.on('handshaked', ((attrs, status) => {
      client.comment('wakotsu');
    }));

    connection.on('comment', (comment => {
      console.log(comment.text);
    }));
  });
})
```
