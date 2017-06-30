module.exports = {
    wechat: {
        token: 'danmukucourse',
        appid: 'wxb54a4c0517a8584e',
        appsecret: '40c9a95eac50c41f4df617563cbb08ea',
        // encodingAESKey: 'encodinAESKey',
        checkSignature: false
        // 可选，默认为true。由于微信公众平台接口调试工具在明文模式下不发送签名，所以如要使用该测试工具，请将其设置为false
    },
    mongodb: {
        url: 'mongodb://localhost/DanmukuCourse'
    },
    session: {
        name: 'sid',
        secret: 'zhmolldanmuku!!!',
        resave: false,
        saveUninitialized: false,
        cookie: { maxAge: 3 * 24 * 3600 },
        database: 'mongodb://localhost/DanmukuCourse'
    }
}