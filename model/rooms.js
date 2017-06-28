const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const roomSchema = new Schema({
  title: { type: String },
  teacher: { type: Schema.Types.ObjectId, ref: 'Teacher' },
  containers: [{ type: String }],
  deleted: { type: Boolean, default: false }
});

module.exports = mongoose.model('Room', roomSchema);