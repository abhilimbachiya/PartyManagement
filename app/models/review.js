var mongoose = require('mongoose');

var reviewSchema = mongoose.Schema({
    user : { type: String, ref: 'users' },
    party_user : { type: String, ref: 'users' },
    title: String,
    content: String,
    rating: Number,
});
module.exports = mongoose.model('reviews', reviewSchema);