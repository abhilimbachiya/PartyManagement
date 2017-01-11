var mongoose = require('mongoose');

var partySchema = mongoose.Schema({
    user_id: String,
    category : { type: String, ref: 'categories' },
    reviews : [{ type: String, ref: 'reviews' }],
    title: String,
    description: String,
    location: String,
    latitude: String,
    longitude: String,
    contact_no: Number,
    email: String,
    website: String,
    video_url: String,
    facebook_url: String,
    twitter_url: String,
    youtube_url: String,
    pinterest_url: String,
    images: [{}],
    startdate: String,
    enddate: String,
    starttime: String,
    endtime: String,
    price: Number,
    duration: Number,
});

partySchema.methods.getImageUrl = function getImageUrl ()
{
    if(this.images.length)
        return '/' + this.images[0].destination + '/' + this.images[0].filename;

    return '/assets/images/placeholders/any.png';
};

module.exports = mongoose.model('parties', partySchema);
