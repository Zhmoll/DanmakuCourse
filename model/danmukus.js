const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const danmukuSchema = new Schema({
  content: { type: String },
  student: { type: Schema.type.ObjectId, index: true, ref: 'Student' },
  room: { type: Schema.type.ObjectId, index: true, ref: 'Room' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Danmuku', danmukuSchema);