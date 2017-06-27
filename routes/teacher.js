const express = require('express');
const router = express.Router();
const Teacher = require('../model/teachers');
const Room = require('../model/rooms');
const crypto = require('crypto');

// 教师登录，返回密钥、弹幕室名称和对应id
router.post('/login', (req, res, next) => {
  const { sid, password } = req.body;

  (async () => {
    const teacher = await Teacher.findOne({ sid });
    if (!teacher) {
      return res.json({
        code: 4001,
        message: '找不到该教师'
      });
    }

    const result = await teacher.validatePassword(password);
    if (!result) {
      return res.json({
        code: 4002,
        message: '教师工号密码不匹配'
      });
    }
    const rooms = await Room.find({ teacher: teacher.id, deleted: false }, '-deleted -teacher');
    const secret = genSecert();
    await teacher.update({ secret });
    return res.json({
      code: 2000,
      message: '登陆成功！',
      body: {
        teacherid: teacher.id,
        rooms, secret
      }
    });
  })();
});

// 创建弹幕室
router.post('/rooms', checkLogin, (req, res, next) => {
  let { containers, title } = req.body;
  if (!title)
    return res.json({
      code: 4003,
      message: '弹幕房间信息不完整'
    });
  containers = containers || [];
  Room.create({ title, containers, teacher: req.teacherid }, (err, room) => {
    if (err) return next(err);
    res.json({
      code: 2001,
      message: '创建成功！',
      body: {
        title: room.title,
        roomid: room.id,
        containers: room.containers
      }
    });
  });
});

// 修改弹幕室
router.put('/rooms', checkLogin, (req, res, next) => {
  const roomid = req.query.roomid;
  const { containers, title } = req.body;
  Room.findByIdAndUpdate(roomid, { title, containers }, (err, room) => {
    if (err) return next(err);
    res.json({
      code: 2002,
      message: '修改成功！',
      body: {
        title: room.title,
        roomid: room.id,
        containers: room.containers
      }
    });
  });
});

function checkLogin(req, res, next) {
  const { teacherid, secret } = req.body;
  Teacher.findOne({ id: teacherid, secret }, (err, teacher) => {
    if (err) return next(err);
    if (!teacher)
      return res.json({
        code: 4000,
        message: '认证信息错误'
      });
    req.teacherid = teacher.id;
    next();
  });
}

function genSecert() {
  return crypto.createHash('sha256').update(Date.now() + 'zhmoll').digest('hex');;
}

module.exports = router;