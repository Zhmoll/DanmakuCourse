const express = require('express');
const router = express.Router();
const Teacher = require('../model/teachers');
const Room = require('../model/rooms');

// 教师登录，返回密钥、弹幕室名称和对应id
router.post('/login', (req, res, next) => {
  const { sid, password } = req.body;

  (async () => {
    const teacher = await Teacher.findOne({ sid });
    if (!teacher) {
      return res.json({
        code: '4001',
        message: '找不到该教师'
      });
    }

    const result = await teacher.validatePassword(password);
    if (!result) {
      return res.json({
        code: '4002',
        message: '教师工号密码不匹配'
      });
    }
    const rooms = await Room.find({ teacher: teacher.id, deleted: false }, '-deleted -teacher -containers');
    const secret = genSecert();
    await teacher.update({ secret });
    return res.json({
      code: '2000',
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

});

// 修改弹幕室
router.put('/rooms', checkLogin, (req, res, next) => {

});

function checkLogin(req, res, next) {
  const { teacherid, secret } = req.body;
  Teacher.findOne({ id: teacherid, secret }, (err, teachers) => {
    if (err) return next(err);
    if (!teachers)
      return res.json({
        code: '4000',
        message: '认证信息错误'
      });
    next();
  });
}

function genSecert() {
  return '123123';
}

module.exports = router;