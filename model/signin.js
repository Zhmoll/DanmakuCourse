const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const signinSchema = new Schema({
  createdAt: { type: Date, default: Date.now },
  room: { type: Schema.Types.ObjectId, ref: 'Room' },
  key: { type: String },
  containers: [{ type: String }] // 只存学号
});

module.exports = mongoose.model('Signin', signinSchema);