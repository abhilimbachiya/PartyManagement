var mongoose = require('mongoose');

var CategorySchema = mongoose.Schema({
    name: String,
    parties : [{ type: String, ref: 'parties' }]
});
module.exports = mongoose.model('categories', CategorySchema);