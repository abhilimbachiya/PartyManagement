var mongoose = require('mongoose');
var timestamps = require('mongoose-timestamp');

var chatSchema = mongoose.Schema({
    sender : { type: String, ref: 'users' },
    receiver : { type: String, ref: 'users' },
    reservation : { type: String, ref: 'reservations' },
    message: String,
});
chatSchema.plugin(timestamps);
module.exports = mongoose.model('chats', chatSchema);