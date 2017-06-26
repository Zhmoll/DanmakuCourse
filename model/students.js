const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const studentSchema = new Schema({
    uid: { type: String, index: true },
    openid: { type: String, index: true },
    name: String
});

module.exports = mongoose.model('Student', studentSchema);