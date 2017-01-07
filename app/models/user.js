var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var userSchema = mongoose.Schema({
    local: {
        email: String,
        password: String,
        usertype: String,
        status: String,
        username: String,
        firstname: String,
        lastname: String,
        contact: String,
        city: String,
        path: String,
        originalname: String,
        country: String
    },
    facebook: {
        id: String,
        name: String,
        token: String,
        email: String
    },  
    google: {
        id: String,
        token: String,
        email: String,
        name: String
    }
});

userSchema.methods.generateHash = function (password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

userSchema.methods.validPassword = function (password) {
    return bcrypt.compareSync(password, this.local.password);
};

module.exports = mongoose.model('users', userSchema);