const WebSocket = require('ws');
const Teacher = require('../model/teachers');
const Room = require('../model/rooms');
const Signin = require('../model/signin');
const url = require('url');
const crypto = require('crypto');
const wss = new WebSocket.Server({
  port: 8080,
  verifyClient: handShake_helper
});

const rooms = {};

wss.on('connection', (ws, req) => {
  const { teacherid, roomid } = url.parse(req.url, true);
  // 加入弹幕房间
  Room.findById(roomid).exec((err, room) => {
    if (err || !room) {
      ws.send({ type: 'info', body: { message: '错误的房间，连接中断' } });
      ws.close();
    }
    ws.roomid = room.id;
    rooms[roomid] = {
      containers: room.containers,
      ws: ws
    };
  });
  ws.send('连接成功！');
  ws.on('message', message_handler(ws));
  // 离开弹幕房间
  ws.on('close', (code, reason) => {
    delete rooms[roomid];
    console.log(`断开连接：${code} - ${reason}`);
  });
});

// 握手
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

// 消息分发
function message_handler(ws) {
  return (data) => {
    if (typeof data == 'string') {
      try {
        const obj = JSON.parse(data);
      }
      catch (e) {
        console.error(e);
        return;
      }
      switch (obj.type) {
        case 'signin': signin(obj, ws); break; // 签到
        case 'signin_end': signin_end(obj, ws); break;
      }
    }
  }
}

// 发起签到
function signin(obj, ws) {
  Signin.create({ room: ws.roomid }, (err, signin) => {
    if (err) return console.error(err);
    const signinid = signin.id;
    ws.signin_timer = setInterval((signinid) => {
      Signin.findById(signinid, (err, signin) => {
        if (err) return console.error(err);
        signin.key = crypto.createHash('sha256').update(Date.now() + 'zhmoll').digest('hex');
        signin.save((err, signin) => {
          if (err) return console.error(err);
          ws.send({ type: 'signin_code', body: { key: signin.key, count: signin.containers.length } });
        });
      });
    }, 5000, signinid);
  });
}

// 签到结束
function signin_end(obj, ws) {
  if (ws.signin_timer) {
    clearInterval(ws.signin_timer);
    delete ws.signin_timer;
  }
}

module.exports = rooms;