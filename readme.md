# DanmakuCourse Serverside 说明

----------

# 一、Http协议

## 0、代码表

| code | message         | 备注                     |
| ---- | --------------- | ---------------------- |
| 2000 | 登陆成功！           |                        |
| 2001 | 创建成功！           | 弹幕房间创建成功               |
| 2002 | 修改成功！           | 弹幕房间修改成功               |
| 2003 | 获取教师所拥有房间成功     |                        |
| 2004 | 注册成功！           |                        |
| 2005 | 删除成功！           | 弹幕房间删除成功               |
| 2006 | 获取该弹幕房所有签到记录成功！ |                        |
| 2007 | 获取弹幕房间所有弹幕成功    |                        |
| 2008 | 修改密码成功！         |                        |
| 4000 | 认证信息错误          | 给予了错误的teacherid和secret |
| 4001 | 找不到该教师          | 登录使用的sid没有被注册过         |
| 4002 | 教师工号密码不匹配       |                        |
| 4003 | 弹幕房间信息不完整       | 缺少title或containers     |
| 4004 | 缺少房间id信息        | 缺少roomid               |
| 4005 | 没有对该房间访问的权限     | 给予的room和teacher没有所属关系  |
| 4006 | 房间已被删除          |                        |
| 4007 | 需要授权访问          | teacherid和secret信息不完整  |
|      | 相同工号用户已注册       |                        |

## 1、教师登录

`post` `/teachers/login`

发送

```json
{
  "sid": "10000",
  "password": "94165b0be8a06b797a6da9274afb827fc7b3eee83d45f10f17c81309992090ea"
}
```

注，密码在客户端发送之前使用`sha-256`算法进行摘要处理。测试用的密码的明文是`zhmoll`。

返回

```json
{
  "code": 2000,
  "message": "登陆成功！",
  "body": {
    "teacherid": "这里是教师的数据库id",
    "rooms": [{
      "id": "弹幕房间id",
  	  "title": "弹幕房间名",
      "containers": ["14051534","14051533","14051532"]
    }],
    "secret": "操作密钥"
  }
}
```

## 2、创建弹幕房间

`post` `/teachers/rooms??teacherid={teacherid}&secret={secret}`

路由中，教师id和密钥需要正确填写

发送

```json
{
  "title": "2018年春季数据结构课堂",
  "containers": ["14051534","14051309","14051238"]
}
```

返回

```json
{
  "code": 2001,
  "message": "创建成功！",
  "body": {
    "title": "2018年春季数据结构课堂",
    "roomid": "123123123",
    "containers": ["14051534","14051309","14051238"]
  }
}
```

## 3、修改弹幕房间

`put` `/teachers/rooms?teacherid={teacherid}&secret={secret}&roomid={roomid}`

路由中，roomid填写选择要修改的房间的id，教师id和密钥需要正确填写

发送

```json
{
  "title": "2018年春季数据结构课堂",
  "containers": ["14051534","14051533","14051532"]
}
```

返回

```json
{
  "code": 2002,
  "message": "修改成功！",
  "body": {
    "title": "2018年春季数据结构课堂",
    "roomid": "123123123",
    "containers": ["14051534","14051533","14051532"]
  }
}
```

## 4、获取所有弹幕房间

`get` `/teachers/rooms?teacherid={teacherid}&secret={secret}`

返回

```json
{
    "code": 2003,
    "message": "获取教师所拥有房间成功",
    "body": {
        "rooms": [
            {
                "roomid": "5955db7223738d22f8778093",
                "title": "2018年春季数据结构课堂",
                "containers": [
                    "14051534",
                    "14051309",
                    "14051238"
                ]
            }
        ]
    }
}
```

## 5、教师注册

`post` `/teachers/reg`

发送

```json
{
  "sid": "工号",
  "password": "94165b0be8a06b797a6da9274afb827fc7b3eee83d45f10f17c81309992090ea"
}
```

返回

```json
{
  "code": 2004,
  "message": "注册成功",
  "body":{}
}
```

## 6、教师获得签到表

`get` `/teachers/rooms/signins?teacherid={teacherid}&secret={secret}&roomid={roomid}`

返回

```json
{
    "code": 2006,
    "message": "获取该弹幕房所有签到记录成功！",
    "body": {
        "table": [
            [
                "学号",
                "2017-06-30 14:41:13",
                "2017-06-30 15:56:54"
            ],
            [
                "14051238",
                "×",
                "×"
            ],
            [
                "14051309",
                "×",
                "×"
            ],
            [
                "14051534",
                "√",
                "√"
            ]
        ]
    }
}
```

在table中，除第一行每一行都是一个学生在所有次签到的记录。具体是什么样子可以访问下一个接口预览。

## 7、教师下载签到表

`get` `/teachers/rooms/signins/download?teacherid={teacherid}&secret={secret}&roomid={roomid}`

浏览器访问，弹出下载文件。

## 8、删除弹幕房间

`delete` `/teachers/rooms?teacherid={teacherid}&secret={secret}&roomid={roomid}`

返回

```json
{
  "code": 2005,
  "message": "删除成功！",
  "body":{}
}
```

## 9、 获取房间弹幕历史

`get` `/teachers/rooms/danmakus?teacherid={teacherid}&secret={secret}&roomid={roomid}`

返回

```json
{
    "code": 2007,
    "message": "获取弹幕房间所有弹幕成功",
    "body": {
        "danmaku": [
            {
                "_id": "5955f01284a72838b001290d",
                "student": {
                    "_id": "59535d971df92707286c9f9b",
                    "uid": "14051534",
                    "name": "张效伟"
                },
                "content": "3453453453",
                "createdAt": "2017-06-30T06:30:42.019Z"
            },
            {
                "_id": "5955f2064adc88406c3ebbfd",
                "student": {
                    "_id": "59535d971df92707286c9f9b",
                    "uid": "14051534",
                    "name": "张效伟"
                },
                "content": "测试弹幕",
                "createdAt": "2017-06-30T06:39:02.492Z"
            },
            {
                "_id": "5955f20a4adc88406c3ebbfe",
                "student": {
                    "_id": "59535d971df92707286c9f9b",
                    "uid": "14051534",
                    "name": "张效伟"
                },
                "content": "啦啦啦",
                "createdAt": "2017-06-30T06:39:06.291Z"
            },
            {
                "_id": "5955f2ac19800d11e42af06f",
                "student": {
                    "_id": "59535d971df92707286c9f9b",
                    "uid": "14051534",
                    "name": "张效伟"
                },
                "content": "试试看",
                "createdAt": "2017-06-30T06:41:48.910Z"
            }
        ]
    }
}
```

## 10、下载房间弹幕历史

`get` `/teachers/rooms/danmakus/download?teacherid={teacherid}&secret={secret}&roomid={roomid}`

返回浏览器下载文件

## 11、修改教师密码

`put` `/teachers/changePassword?teacherid={teacherid}&secret={secret}`

```json
{
  "password": "94165b0be8a06b797a6da9274afb827fc7b3eee83d45f10f17c81309992090ea",
  "oldpassword": "94165b0be8a06b797a6da9274afb827fc7b3eee83d45f10f17c81309992090eb"
}
```

其中旧密码是oldpassword，新密码是password。

# 二、WebSocket协议

## 1、建立ws连接

请求 `ws://domain/danmaku?teacherid={teacherid}&secret={secret}&roomid={roomid}`

其中上面的三个参数均由前一个接口登录后获得。

## 2、ws连接通信协议统一格式

```json
{
  "type": "消息类型",
  "body": {},
  "time": "1498917848281"
}
```

`time`为消息发送的时间，为Unix时间戳格式。服务器会携带此信息，而客户端不需要发送此信息。

## 3、签到

客户端发送，发起签到命令

```json
{
  "type": "signin",
  "body": {}
}
```

客户端发送，结束签到命令

```json
{
  "type": "signin_end",
  "body": {}
}
```

服务器发送，签到心跳包，需由客户端处理

```json
{
  "type": "signin_code",
  "body": {
    "key": "ddbbb1e9bc1f78b590c4200f67718c7b06f0c620266ee4d272fcba6cbd4506a4",
    "count": 1,
    "containers": ["14051534"]
  },
  "time": "1498917848281"
}
```

需要将`key`转化为二维码显示，而`count`则为成功签到人数，`containers`为签到成功的同学的学号。

## 4、服务端通知消息

```json
{
  "type": "info",
  "body": {
     "message": "来自服务器的信息"
  },
  "time": "1498917848281"
}
```

## 5、弹幕消息

服务端转发送的学生弹幕信息

```json
{
  "type": "danmaku",
  "body": {
     "uid": "学号",
     "name": "姓名",
     "content": "内容",
     "blocked": false
  },
  "time": "1498917848281"
}
```

`blocked`为弹幕消息是否不文明，不文明即为`true` 。