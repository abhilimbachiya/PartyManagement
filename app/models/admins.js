var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var adminSchema = mongoose.Schema({
    local: {
        email: String,
        password: String,                
        username: String,
        name: String,
        profileimage: String
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

adminSchema.methods.generateHash = function (password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

adminSchema.methods.validPassword = function (password) {
    return bcrypt.compareSync(password, this.local.password);
};

module.exports = mongoose.model('admins', adminSchema);