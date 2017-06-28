var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var bodyParser = require('body-parser');
var session = require('express-session');
var config = require('config-lite')(__dirname);
const  MongoStore  =  require('connect-mongo')(session);

var app = express();
// app.use(express.query());
// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
  secret: config.session.secret,
  resave: config.session.resave,
  saveUninitialized: config.session.saveUninitialized,
  cookie: config.session.cookie,
  store: new  MongoStore({ url:  config.session.database })
}));
// app.use(express.static(path.join(__dirname, 'public')));

require('./routes')(app);
require('./routes/wechat')(app);
require('./lib/websocket');

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.json({
    code: err.status,
    message: err.message
  });
});

module.exports = app;
