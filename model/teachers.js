const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const teacherSchema = new Schema({
  sid: { type: String, index: true },
  password: { type: String },
  secret: { type: String },
  rooms: [{ type: Schema.Types.ObjectId, ref: 'Room' }]
});

module.exports = mongoose.model('Teacher', teacherSchema);