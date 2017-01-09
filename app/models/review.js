var mongoose = require('mongoose');

var reviewSchema = mongoose.Schema({
    user : { type: String, ref: 'users' },
    party : { type: String, ref: 'parties' },
    title: String,
    content: String
});
module.exports = mongoose.model('reviews', reviewSchema);