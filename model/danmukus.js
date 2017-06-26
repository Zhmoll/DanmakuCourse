const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const danmukuSchema = new Schema({
    content: { type: String },
    studentid: { type: Schema.type.ObjectId, index: true, ref: 'Student' },
    room: { type: Schema.type.ObjectId, index: true, ref: 'Room' }
});

module.exports = mongoose.model('Danmuku', danmukuSchema);