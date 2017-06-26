const WebSocket = require('ws');
const Teacher = require('../model/teachers');
const Room = require('../model/rooms');
const url = require('url');
const wss = new WebSocket.Server({
  port: 8080,
  verifyClient: handShake_helper
});

const rooms = {};

wss.on('connection', (ws, req) => {
  const { teacherid, roomid } = url.parse(req.url, true);
  Room.findById(roomid).exec((err, room) => {
    if (err || !room) {
      ws.send('错误的房间号');
      ws.close();
    }
    rooms[roomid] = ws;
  });
  ws.send('连接成功！');
  ws.on('message', message_handler);
  ws.on('close', (code, reason) => {
    delete rooms[roomid];
    console.log(`断开连接：${code} - ${reason}`);
  });
});

function handShake_helper(info, cb) {
  const { teacherid, secret } = url.parse(info.req.url, true);

  Teacher.findById(teacherid, (err, teacher) => {
    if (err)
      return cb(false, 403, err.message);
    if (!teacher)
      return cb(false, 404, '找不到该教师');
    if (teacher.secret != secret)
      return cb(false, 401, '密钥不匹配');
    cb(true);
  });
}

function message_handler(data) {
  if (typeof data == 'string') {
    try {
      const obj = JSON.parse(data);
    }
    catch (e) {
      console.error(e);
      return;
    }
    switch (obj.type) {
      case 'signin': break;
    }
  }
}

module.exports = (app) => {

};