const WebSocket = require('ws');
const Teacher = require('../model/teachers');
const wss = new WebSocket.Server({
  port: 8080,
  verifyClient: handShake_helper
});

const rooms = [];

wss.on('connection', (ws, req) => {
  // 每一个连接都是教师的客户端连接
  console.log(req);
  console.log(req.body.teacherid, '建立连接');



  ws.on('message', (message) => {

  });

  ws.send('连接成功！');
  rooms.push(ws);
});

function handShake_helper(info, cb) {
  console.log(info.req);
  const teacherid = '123123';
  const roomid = '123123123123';
  const secret = '123123';
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

module.exports = (app) => {

};