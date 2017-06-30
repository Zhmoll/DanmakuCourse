const express = require('express');
const router = express.Router();
const Teacher = require('../model/teachers');
const Room = require('../model/rooms');
const Signin = require('../model/signin');
const crypto = require('crypto');
const _ = require('lodash');

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

    if (teacher.password != password) {
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
  const teacher = req.teacher;
  let { containers, title } = req.body;
  if (!title)
    return res.json({
      code: 4003,
      message: '弹幕房间信息不完整'
    });
  if (!containers || !Array.isArray(containers))
    containers = [];
  Room.create({ title, containers, teacher: teacherid }, (err, room) => {
    if (err) return next(err);
    teacher.rooms.push(room.id);
    teacher.save((err, teacher) => {
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
});

// 修改弹幕室
router.put('/rooms', checkLogin, checkPossessRoom, (req, res, next) => {
  const room = req.room;
  let { containers, title } = req.body;
  if (!containers || !Array.isArray(containers))
    containers = [];

  room.title = title;
  room.containers = containers;
  room.markModified('containers');
  room.save((err, room) => {
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

// 删除弹幕室
router.delete('/rooms', checkLogin, checkPossessRoom, (req, res, next) => {
  const room = req.room;
  room.deleted = true;
  room.save((err, room) => {
    if (err) return next(err);
    res.json({
      code: 2005,
      message: '删除成功！'
    });
  });
});

// 获取所有签到信息
router.get('/rooms/signin', checkLogin, checkPossessRoom, (req, res, next) => {

});

function checkLogin(req, res, next) {
  const { teacherid, secret } = req.query;
  if (!teacherid || !secret) {
    return res.json({
      code: 4001,
      message: '需要授权访问'
    });
  }
  Teacher.findOne({ _id: teacherid, secret }, (err, teacher) => {
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
  if (teacher.rooms.indexOf(roomid) == -1) {
    return res.json({
      code: 4005,
      message: "没有对该房间访问的权限"
    });
  }
  Room.findOne({ _id: roomid, deleted: false }, (err, room) => {
    if (err) return next(err);
    if (!room) {
      return res.json({
        code: 4006,
        message: "房间已被删除"
      });
    }
    req.room = room;
    next();
  });
}

function genSecert(text) {
  text = text || '';
  return crypto.createHash('sha256').update(`${Date.now()}${text}zhmoll`).digest('hex');
}

function processPassword(password) {
  return password;
}

module.exports = router;