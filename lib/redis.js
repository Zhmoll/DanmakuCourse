const Redis = require('ioredis');
const redis = new Redis(6379);

redis.setSignin = function (key, signinid) {
  return redis.set(key, signinid, 'EX', 20000);
};

redis.getSigninByKey = function (key) {
  return redis.get(key);
};

module.exports = redis;