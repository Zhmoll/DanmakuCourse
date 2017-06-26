const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const teacherSchema = new Schema({
  sid: { type: String, index: true },
  password: { type: String },
  secert: { type: String },
  rooms: [{ type: Schema.Types.ObjectId, ref: 'Room' }]
});

teacherSchema.methods.validatePassword = (password) => {
  return password == this.password;
};

module.exports = mongoose.model('Teacher', teacherSchema);