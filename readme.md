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
  "code": "2000",
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