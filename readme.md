DanmukuCourse Serverside 说明

----------

# 教师登录

post /teachers/login

发送

```json
{
  "sid": "10000",
  "password": "94165b0be8a06b797a6da9274afb827fc7b3eee83d45f10f17c81309992090ea"
}
```

注，密码在客户端发送之前使用`sha-256`算法进行摘要处理。

返回

```json
{
  "code": 2000,
  "message": "登陆成功！",
  "body": {
    "teacherid": "这里是教师的数据库id",
    "rooms": [{
      "id": "弹幕房间id",
  	  "title": "弹幕房间名"
    }],
    "secret": "操作密钥"
  }
}
```

# 建立ws连接

请求 ws://domain/danmuku?teacherid=123123&secret=123123&roomid=123123

其中上面的三个参数均由前一个接口登录后获得。

# ws连接通信协议

格式

```json
{
  "type": "消息类型",
  "body": {}
}
```

客户端需发送的消息

发起签到

```json
{
  "type": "signin",
  "body": {}
}
```

结束签到

```json
{
  "type": "signin_end",
  "body": {}
}
```

客户端需处理的消息

```json
{
  "type": "signin_code",
  "body": {
     "key": "ddbbb1e9bc1f78b590c4200f67718c7b06f0c620266ee4d272fcba6cbd4506a4",
     "count": 25,
  }
}
```

需要将`key`转化为二维码显示，而`count`则为成功签到人数。

```json
{
  "type": "info",
  "body": {
     "message": "来自服务器的信息"
  }
}
```

服务端发送过来的消息

```json
{
  "type": "danmuku",
  "body": {
     "uid": "学号",
     "name": "姓名",
     "content": "内容"
  }
}
```

学生发送的弹幕