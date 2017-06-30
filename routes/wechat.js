const express = require('express');
const router = express.Router();
const wechat = require('wechat');
const config = require('config-lite')(__dirname).wechat;
const Student = require('../model/students');
const Signin = require('../model/signin');
const Danmuku = require('../model/danmukus');
const Room = require('../model/rooms');
const wsDanmuku = require('../lib/websocket');

const mw = wechat(config)
  .text((message, req, res, next) => {
    switch (message.Content.split('+')[0]) {
      case '绑定':
        return bind_helper(message, req, res);
      default:
        return danmuku_helper(message, req, res);
    }
  })
  .event((message, req, res, next) => {
    switch (message.Event) {
      case 'subscribe':
        return subscribe_helper(message, req, res);
      case 'scancode_waitmsg': {
        switch (message.EventKey) {
          case 'signin':
            return signin_helper(message, req, res);
        }
      }
      default:
        res.reply('不知道你想要干什么');
    }
  })
  .middlewarify();

router.use('/', (req, res, next) => {
  console.log(req.body);
  next();
}, mw);

// 绑定学生身份
function bind_helper(message, req, res) {
  (async () => {
    const openid = message.FromUserName;
    const [identity, uid, name] = message.Content.split('+');
    if (!uid || !name)
      return res.reply(`绑定格式错误！格式为绑定+学号+姓名，例如：'绑定+12345678+张三'`);
    const user = await Student.findOne({ uid });
    if (!user)
      return res.reply('该学生不存在，请确认学生信息并重新尝试');
    if (user.name != name)
      return res.reply('学号与姓名不匹配，请确认学生信息并重新尝试');

    await Student.update({ openid }, { $unset: ['openid'] });
    user.openid = openid;
    await user.save();
    req.wxsession.uid = user.uid;
    req.wxsession.userid = user.id;
    req.wxsession.name = user.name;
    res.reply(`绑定成功，${name}，欢迎加入弹幕课堂！`);
  })().catch(e => console.error(e));
}

// 发送弹幕
function danmuku_helper(message, req, res) {
  (async () => {
    // 确保登录 - start
    let student;
    if (!req.wxsession.uid) {
      student = await Student.findOne({ openid: message.FromUserName });
      if (!student) {
        res.reply(`你还未绑定账号！格式为绑定+学号+姓名，例如：'绑定+12345678+张三'`);
        return;
      }
      req.wxsession.userid = student.id;
      req.wxsession.uid = student.uid;
      req.wxsession.name = student.name;
    }
    // 确保登录 - end

    const uid = req.wxsession.uid;
    const name = req.wxsession.name;
    const content = message.Content;
    const roomid = req.wxsession.roomid;

    if (roomid && wsDanmuku[roomid]) {
      if (wsDanmuku[roomid].containers && wsDanmuku[roomid].containers.indexOf(uid) == -1) {
        res.reply('发送失败，请确认是否为该课堂成员！');
        return;
      }
      await Danmuku.create({ student: req.wxsession.userid, content: content, room: roomid });
      wsDanmuku[roomid].ws.send(JSON.stringify({ type: 'danmuku', body: { uid, name, content } }));
      res.reply('发送成功！');
    }
    else {
      delete req.wxsession.roomid;
      res.reply('目前暂未加入弹幕房间');
    }
  })().catch(e => console.error(e));
}

// 订阅公众号
function subscribe_helper(message, req, res) {
  (async () => {
    const openid = message.FromUserName;
    const user = await Student.findOne({ openid });
    if (user) {
      req.wxsession.uid = user.uid;
      req.wxsession.userid = user.id;
      req.wxsession.name = user.name;
      res.reply(`欢迎回来，${user.name}！`);
    }
    else {
      res.reply(`欢迎使用弹幕课堂！请绑定学生信息，格式为绑定+学号+姓名，例如：'绑定+12345678+张三'`);
    }
  })().catch(e => console.error(e));
}

// 签到
function signin_helper(message, req, res) {
  (async () => {
    // 确保登录 - start
    let student;
    if (!req.wxsession.uid) {
      student = await Student.findOne({ openid: message.FromUserName });
      if (!student) {
        res.reply(`你还未绑定账号！格式为绑定+学号+姓名，例如：'绑定+12345678+张三'`);
        return;
      }
      req.wxsession.userid = student.id;
      req.wxsession.uid = student.uid;
      req.wxsession.name = student.name;
    }
    // 确保登录 - end

    const uid = req.wxsession.uid;
    const key = message.ScanCodeInfo.ScanResult;

    const signin = await Signin.findOne({ key }).populate('room');
    if (!signin) {
      res.reply('签到失败，二维码不正确或已过期，请重试！');
      return;
    }
    const room = await Room.findOne({ _id: signin.room.id, deleted: false });
    if (!room) {
      res.reply('签到失败，弹幕房不存在！');
      return
    }
    if (room.containers.indexOf(uid) == -1) {
      res.reply(`签到失败，你不是该弹幕房成员！`);
      return;
    }
    if (signin.containers.indexOf(uid) != -1) {
      res.reply(`本次课[${signin.room.title}]你已经签过到啦！`);
      return;
    }
    signin.containers.push(uid);
    await signin.save();
    req.wxsession.roomid = signin.room.id;
    res.reply(`本次签到[${signin.room.title}]成功啦！`);
  })().catch((e) => console.error(e));
}

module.exports = router;