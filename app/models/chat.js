var mongoose = require('mongoose');

var chatSchema = mongoose.Schema({
    user : { type: String, ref: 'users' },
    receiver : { type: String, ref: 'users' },
    message: String,
});
module.exports = mongoose.model('chats', chatSchema);