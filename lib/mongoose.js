const mongoose = require('mongoose');
const config = require('config-lite')(__dirname).mongodb;

mongoose.connect(config.url);