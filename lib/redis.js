const Redis = require('ioredis');
const redis = new Redis(6379);

// 若redis使用的多，可以考虑如下抽象实现更多的函数

redis.setSignin = function (key, signinid) {
  return redis.set(key, signinid, 'EX', 6);
};

redis.getSigninByKey = function (key) {
  return redis.get(key);
};

module.exports = redis;