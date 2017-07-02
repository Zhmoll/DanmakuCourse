const express = require('express');
const router = express.Router();
const wechat = require('wechat');
const config = require('config-lite')(__dirname).wechat;
const Student = require('../model/students');
const Signin = require('../model/signin');
const Danmaku = require('../model/danmakus');
const Room = require('../model/rooms');
const wsDanmaku = require('../lib/websocket');
const moment = require('moment');
const redis = require('../lib/redis');

const mw = wechat(config)
  .text((message, req, res, next) => {
    switch (message.Content.split('+')[0]) {
      case '绑定':
        return bind_helper(message, req, res);
      default:
        return danmaku_helper(message, req, res);
    }
  })
  .event((message, req, res, next) => {
    switch (message.Event) {
      case 'CLICK': {
        switch (message.EventKey) {
          case 'danmaku_histroy':
            return danmaku_histroy(message, req, res);
          case 'signin_histroy':
            return signin_histroy(message, req, res);
          case 'tech':
            return res.reply('技术实现：\n\n'
            +'服务端：\n使用Node.js作为运行环境，使用WebSocket协议实时与客户端通信。\n\n'
            +'客户端：\n使用C#开发，使用JSON作为通信协议的格式，使用WebSocket完成通信。');
          case 'helper':
            return res.reply('使用帮助：\n\n'
              + '学生：\n1、在微信公众号上绑定个人信息（“绑定+学号+密码”）；\n2、扫描课堂上教室给出的签到二维码；\n'
              + '3、签到成功后发送弹幕即可让弹幕进入课堂。\n\n教师：\n1、打开客户端，登录账号，若没有账号请先注册；\n'
              + '2、选择弹幕房间建立连接，若没有事先创建好的弹幕房间，请先创建；\n3、建立连接后，选择签到功能，签到完成的同学即可发送弹幕进入课堂。');
          case 'aboutus':
            return res.reply('杭州电子科技大学\n弹幕课堂\n作者：\n张效伟,郑鹏达,陈钧博');
        }
        break;
      }
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

router.use('/', mw);

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
function danmaku_helper(message, req, res) {
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

    if (roomid && wsDanmaku[roomid]) {
      // if (wsDanmaku[roomid].containers && wsDanmaku[roomid].containers.indexOf(uid) == -1) {
      //   res.reply('发送失败，请确认是否为该课堂成员！');
      //   return;
      // }
      if (content.length > 50) {
        res.reply('发送失败，请缩短篇幅！');
        return;
      }
      const blocked = false;
      await Danmaku.create({ student: req.wxsession.userid, content, room: roomid, blocked });
      wsDanmaku[roomid].ws.send(JSON.stringify({ type: 'danmaku', body: { uid, name, content, blocked } }), console.error);
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

// 弹幕历史
function danmaku_histroy(message, req, res) {
  (async () => {
    // 确保登录 - start
    if (!req.wxsession.uid) {
      const student = await Student.findOne({ openid: message.FromUserName });
      if (!student) {
        res.reply(`你还未绑定账号！格式为绑定+学号+姓名，例如：'绑定+12345678+张三'`);
        return;
      }
      req.wxsession.userid = student.id;
      req.wxsession.uid = student.uid;
      req.wxsession.name = student.name;
    }
    // 确保登录 - end

    const danmakus = await Danmaku
      .find({ student: req.wxsession.userid }, '-_id content createdAt room', { limit: 7 })
      .sort('-createdAt')
      .populate({ path: 'room', select: 'title' });
    const result = [{ title: '弹幕课堂 - 最近七条用户弹幕记录' }];
    danmakus.forEach((danmaku) => {
      result.push({
        title: `内容：${danmaku.content}\n课堂：${danmaku.room.title}\n时间：${moment(danmaku.createdAt).utcOffset(8).format('YYYY-MM-DD HH:mm:ss')}`
      });
    });
    res.reply(result);
  })().catch(e => console.error(e));
}

// 签到历史
function signin_histroy(message, req, res) {
  (async () => {
    // 确保登录 - start
    if (!req.wxsession.uid) {
      const student = await Student.findOne({ openid: message.FromUserName });
      if (!student) {
        res.reply(`你还未绑定账号！格式为绑定+学号+姓名，例如：'绑定+12345678+张三'`);
        return;
      }
      req.wxsession.userid = student.id;
      req.wxsession.uid = student.uid;
      req.wxsession.name = student.name;
    }
    // 确保登录 - end
    const signins = await Signin
      .find({ containers: { $in: [req.wxsession.uid] } }, 'room createdAt', { limit: 7 })
      .sort('-createdAt')
      .populate({ path: 'room', select: 'title' });

    const result = [{ title: '弹幕课堂 - 最近七条用户签到记录' }];
    signins.forEach((signin) => {
      result.push({
        title: `课堂：${signin.room.title}\n时间：${moment(signin.createdAt).utcOffset(8).format('YYYY-MM-DD HH:mm:ss')}`
      });
    });
    res.reply(result);
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

    const signinid = await redis.getSigninByKey(key);
    if (!signinid) {
      res.reply('签到失败，二维码不正确或已过期，请重试！');
      return;
    }
    const signin = await Signin.findOne({ _id: signinid }).populate('room');
    if (!signin || signin.finished) {
      res.reply('签到失败，签到不存在或已结束！');
      return;
    }
    if (signin.containers.indexOf(uid) != -1) {
      res.reply(`本次课[${signin.room.title}]你已经签过到啦！`);
      return;
    }
    const room = signin.room;
    if (room.containers.indexOf(uid) == -1) {
      res.reply(`签到失败，你不是该弹幕房成员！`);
      return;
    }

    // const signin = await Signin.findOne({ key }).populate('room');
    // if (!signin) {
    //   res.reply('签到失败，二维码不正确或已过期，请重试！');
    //   return;
    // }
    // const room = await Room.findOne({ _id: signin.room.id, deleted: false });
    // if (!room) {
    //   res.reply('签到失败，弹幕房不存在！');
    //   return
    // }
    // if (room.containers.indexOf(uid) == -1) {
    //   res.reply(`签到失败，你不是该弹幕房成员！`);
    //   return;
    // }
    // if (signin.containers.indexOf(uid) != -1) {
    //   res.reply(`本次课[${signin.room.title}]你已经签过到啦！`);
    //   return;
    // }

    signin.containers.push(uid);
    await signin.save();
    req.wxsession.roomid = room.id;
    res.reply(`本次签到[${room.title}]成功啦！`);
  })().catch((e) => console.error(e));
}

module.exports = router;