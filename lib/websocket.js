const WebSocket = require('ws');
const Teacher = require('../model/teachers');
const Room = require('../model/rooms');
const Signin = require('../model/signin');
const url = require('url');
const crypto = require('crypto');
const util = require('util');
const redis = require('./redis');
const wss = new WebSocket.Server({
  port: 8080,
  verifyClient: handShake_helper
});

const rooms = {};

wss.on('connection', (ws, req) => {
  const { teacherid, roomid } = url.parse(req.url, true).query;
  // 加入弹幕房间
  ws.roomid = roomid;
  if (rooms[roomid]) {
    ws.send(JSON.stringify({ type: 'info', body: { message: '已在其他地方登录！' }, time: Date.now() }), ack);
    rooms[roomid].ws.close();
    delete rooms[roomid];
  }
  rooms[roomid] = {
    containers: req.room.containers,
    ws: ws
  };
  ws.send(JSON.stringify({ type: 'info', body: { message: '连接成功！' }, time: Date.now() }));
  ws.on('message', message_handler(ws));
  ws.on('close', (code, reason) => {
    clearInterval(ws.signin_timer);
    delete rooms[roomid];
    // if (reason)
    //   console.log(`断开连接：${code} - ${reason}`);
    // else
    //   console.log(`断开连接：${code}`);
  });
  ws.on('error', (err) => console.error(err), ack);
});

// 握手
function handShake_helper(info, cb) {
  const { teacherid, secret, roomid } = url.parse(info.req.url, true).query;
  Teacher.findById(teacherid, (err, teacher) => {
    if (err)
      return cb(false, 403, err.message);
    if (!teacher)
      return cb(false, 404, '找不到该教师');
    if (teacher.secret != secret.toString())
      return cb(false, 401, '密钥不匹配');
    Room.findOne({ _id: roomid, deleted: false }, (err, room) => {
      if (err)
        return cb(false, 501, err.message);
      if (!room)
        return cb(false, 404, '找不到该房间或该房间已被删除');
      info.req.room = room;
      cb(true);
    });
  });
}

// 消息分发
function message_handler(ws) {
  return (data) => {
    if (typeof data == 'string') {
      try {
        const obj = JSON.parse(data);
        switch (obj.type) {
          case 'signin': signin(obj, ws); break; // 签到
          case 'signin_end': signin_end(obj, ws); break;
          case undefined:
            ws.send(JSON.stringify({ type: 'info', body: { message: `错误的协议信息格式 - 缺少命令类型` }, time: Date.now() }), ack);
            break;
          default:
            ws.send(JSON.stringify({ type: 'info', body: { message: `未知的命令 - 命令类型：'${obj.type}'` }, time: Date.now() }), ack);
        }
      }
      catch (e) {
        ws.send(JSON.stringify({ type: 'info', body: { message: `错误的协议信息格式` }, time: Date.now() }), ack);
        return console.error(e.message);
      }
    }
  }
}

// 发起签到
function signin(obj, ws) {
  if (ws.signin_timer)
    return;

  Signin.create({ room: ws.roomid }, (err, signin) => {
    if (err) return console.error(err);
    console.log(`${ws.roomid} 签到开始`);
    ws.signin = signin;
    setImmediate(signin_helper, ws);
    ws.signin_timer = setInterval(signin_helper, 3333, ws);
  });
}

function signin_helper(ws) {
  const key = crypto.createHash('sha256').update(`${Date.now()}${ws.roomid}zhmoll`).digest('hex');
  Promise.all([
    Signin.findById(ws.signin.id),
    redis.setSignin(key, ws.signin.id)])
    .then((result) => {
      const signin = ws.signin = result[0];
      ws.send(JSON.stringify({
        type: 'signin_code', body: {
          key: key,
          count: signin.containers.length,
          containers: signin.containers
        }
      }), ack);
    })
    .catch(e => console.error(e));

  // signin.key = crypto.createHash('sha256').update(`${Date.now()}${ws.roomid}zhmoll`).digest('hex');
  // signin.save((err, signin) => {
  //   if (err) return console.error(err);
  //   ws.send(JSON.stringify({ type: 'signin_code', body: { key: signin.key, count: signin.containers.length } }), ack);
  // });
}

// 签到结束
function signin_end(obj, ws) {
  if (!ws.signin_timer) {
    ws.send(JSON.stringify({ type: 'info', body: { message: '尚无正在进行的签到' }, time: Date.now() }), ack);
    return;
  }
  console.log(`${ws.roomid} 签到结束`);
  clearInterval(ws.signin_timer);
  ws.signin.finished = true;
  ws.signin.save();
  delete ws.signin_timer;
  delete ws.signin;
  ws.send(JSON.stringify({ type: 'info', body: { message: '签到结束' }, time: Date.now() }), ack);
}

function ack(err) {
  if (err) return console.error(err);
}

module.exports = rooms;