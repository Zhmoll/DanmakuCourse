module.exports = (app) => {
  app.use('/wechat', require('./wechat'));
  app.use('/teachers', require('./teacher'));
};