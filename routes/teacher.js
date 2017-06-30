const express = require('express');
const router = express.Router();
const Teacher = require('../model/teachers');
const Room = require('../model/rooms');
const crypto = require('crypto');

router.get('/', (req, res, next) => {
  res.send('hello!');
});

// 教师注册
router.post('/reg', (req, res, next) => {
  const { sid, password } = req.body;
  const processedPassword = processPassword(password);
  Teacher.create({ sid, password: processedPassword }, (err, teacher) => {
    if (err) return next(err);
    res.json({
      code: 2004,
      message: '注册成功'
    });
  });
});

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

// 教师获取所有房间
router.get('/rooms', checkLogin, (req, res, next) => {
  const { teacherid } = req.query;
  Room.find({ teacher, deleted: false }, (err, rooms) => {
    if (err) return next(err);
    const body = [];
    rooms.forEach((room) => {
      body.push({ title: room.title, containers: room.containers });
    });
    res.json({
      code: 2003,
      message: '获取教师所拥有房间成功',
      body: {
        rooms: body
      }
    });
  });
});

// 创建弹幕室
router.post('/rooms', checkLogin, (req, res, next) => {
  const teacherid = req.query.teacherid;
  let { containers, title } = req.body;
  if (!title)
    return res.json({
      code: 4003,
      message: '弹幕房间信息不完整'
    });
  containers = containers || [];
  Room.create({ title, containers, teacher: teacherid }, (err, room) => {
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
router.put('/rooms', checkLogin, checkPossessRoom, (req, res, next) => {
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
  const { teacherid, secret } = req.query;
  if (!teacherid || !secret) {
    return res.json({
      code: 4001,
      message: '需要授权访问'
    });
  }
  Teacher.findOne({ id: teacherid, secret }, (err, teacher) => {
    if (err) return next(err);
    if (!teacher)
      return res.json({
        code: 4000,
        message: '认证信息错误'
      });
    req.teacher = teacher;
    next();
  });
}

function checkPossessRoom(req, res, next) {
  const { teacherid, roomid } = req.query;
  const teacher = req.teacher;
  if (!roomid) {
    return res.json({
      code: 4004,
      message: "缺少房间id信息"
    });
  }
  let isFound = false;
  for (let room in teacher.rooms) {
    if (room == roomid)
      isFound = true;
    break;
  }
  if (!isFound) {
    return res.json({
      code: 4005,
      message: "没有对该房间访问的权限"
    });
  }
  next();
}

function genSecert() {
  return crypto.createHash('sha256').update(Date.now() + 'zhmoll').digest('hex');
}

function processPassword(password) {
  return password;
}

module.exports = router;