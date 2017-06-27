const wechat = require('wechat');
const express = require('express');
const config = require('config-lite')(__dirname).wechat;
const Student = require('../model/students');
const Signin = require('../model/signin');
const wsDanmuku = require('../lib/websocket');

const middleware = wechat(config, wechat.text(function (message, req, res, next) {
  // message为文本内容
}).image(function (message, req, res, next) {
  // message为图片内容
}).voice(function (message, req, res, next) {
  // message为音频内容
}).video(function (message, req, res, next) {
  // message为视频内容
}).shortvideo(function (message, req, res, next) {
  // message为短视频内容
}).location(function (message, req, res, next) {
  // message为位置内容
}).link(function (message, req, res, next) {
  // message为链接内容
}).event(function (message, req, res, next) {
  // message为事件内容
  switch (message.Event) {
    case 'subscribe': subscribe_helper(message, req, res); break;
    case 'scancode_waitmsg': scancode_helper(message, req, res); break;
  }
}).device_text(function (message, req, res, next) {
  // message为设备文本消息内容
}).device_event(function (message, req, res, next) {
  // message为设备事件内容
}));

function subscribe_helper(message, req, res) {
  const openid = message.FromUserName;
  (async () => {
    const user = await Student.findOne({ openid });
    if (user) {
      res.reply(`欢迎回来，${user.name}！`);
    }
    else {
      res.reply(`请绑定学生信息，格式为绑定+学号+姓名，例如：'绑定+12345678+张三'`);
    }
  })();
}

function bind_helper(message, req, res) {
  const openid = message.FromUserName;
  const [identity, uid, name] = message.Content.split('+');
  if (identity != '绑定')
    return;
  if (!uid || !name)
    return res.reply('绑定格式错误！');

  (async () => {
    const user = await Student.findOne({ uid });
    if (!user)
      return res.reply('该学生不存在');
    if (user.name != name)
      return res.reply('学号与姓名不匹配');

    await Student.update({ openid }, { $unset: 'openid' });
    user.openid = openid;
    await user.save();
    req.wxsession.uid = user.uid;
    req.wxsession.userid = user.id;
    res.reply(`绑定成功，${name}，欢迎加入弹幕课堂！`);
  })();
}

function scancode_helper(message, req, res) {
  switch (message.EventKey) {
    case 'signin': signin_helper(message, req, res); break;
  }
}

function signin_helper(message, req, res) {
  const openid = message.FromUserName;
  const uid = req.wxsession.uid;
  const userid = req.wxsession.userid;
  const key = message.ScanCodeInfo;

  (async () => {
    const signin = await Signin.findOne({ key }).populate('room');
    if(!signin){
      res.reply('签到失败（二维码已过期），请重试！');
      return;
    }
    for (let i = 0; i < signin.containers.length; i++) {
      if (signin.containers[i] == uid) {
        res.reply(`本次课(${signin.room.title})你已经签过到啦！`);
        return;
      }
    }
    signin.containers.push(uid);
    await signin.save();
    res.reply(`本次签到(${signin.room.title})成功啦！`)
  })();
}

function danmuku_send(uid, name, content) {
  // 查询该用户是否被房间允许发送弹幕
  wsDanmuku[roomid].send({ type: 'danmuku', uid, name, content });
}

module.exports = (app) => {
  app.use('/wechat', (req, res, next) => {
    console.log(req.body);
    next();
  }, middleware);
}
