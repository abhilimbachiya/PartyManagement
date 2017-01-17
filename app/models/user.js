var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var userSchema = mongoose.Schema({
    scores : [{ type: String, ref: 'user_scores' }],
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
        avatar: {},
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
    if(this.local.avatar)
        return '/' + this.local.avatar.destination + '/' + this.local.avatar.filename;
    
    return '/assets/images/placeholders/user.jpg';
};

userSchema.methods.calulateScore = function calulateScore (scores)
{
    var total_score = 0;
    scores.forEach(function(record) {
        total_score += record.score;
    });
    return total_score;
};

module.exports = mongoose.model('users', userSchema);