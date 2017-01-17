var mongoose = require('mongoose');

var userScoreSchema = mongoose.Schema({
    user : { type: String, ref: 'users' },
    type: String,
    score: Number,
});

userScoreSchema.methods.getFormattedType = function getFormattedType ()
{
    if(this.type == 'party_create')
        return 'You hosted a party';

    if(this.type == 'reservation_create')
        return 'You joined a party';

    if(this.type == 'review_create')
        return 'You reviewed a party';
};

module.exports = mongoose.model('user_scores', userScoreSchema);