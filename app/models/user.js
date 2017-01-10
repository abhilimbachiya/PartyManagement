var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var userSchema = mongoose.Schema({
    local: {
        email: String,
        password: String,
        usertype: String,
        name: String,
        phone: Number,
        about: String,
        facebook_url: String,
        twitter_url: String,
        pinterest_url: String,
        youtube_url: String,
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

userSchema.methods.getAvatarUrl = function getImageUrl ()
{
    if(this.avatar.length)
        return '/uploads/users/avatars/' + this.avatar;

    return '/assets/images/placeholders/user.jpeg';
};

module.exports = mongoose.model('users', userSchema);