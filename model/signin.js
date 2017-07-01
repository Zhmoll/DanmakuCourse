const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const signinSchema = new Schema({
  createdAt: { type: Date, default: Date.now },
  room: { type: Schema.Types.ObjectId, ref: 'Room' },
  containers: [{ type: String }], // 只存学号
  finished: { type: Boolean, default: false }
});

module.exports = mongoose.model('Signin', signinSchema);