var mongoose = require('mongoose');

var CategoriesSchema = mongoose.Schema({
    categoryname: String,   
});
module.exports = mongoose.model('Categories', CategoriesSchema);