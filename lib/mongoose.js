const mongoose = require('mongoose');
const config = require('config-lite')(__dirname).mongodb;
mongoose.Promise = Promise;

mongoose.connect(config.url);