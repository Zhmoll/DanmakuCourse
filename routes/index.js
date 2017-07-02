module.exports = (app) => {
  app.use('/wechat', require('./wechat'));
  app.use('/', (req, res, next) => {
    console.log(req.body);
    next();
  });
  app.use('/teachers', require('./teacher'));
};