var mongoose = require('mongoose');

var partySchema = mongoose.Schema({
    parties: {
        title: String,
        description: String,
        backgroundImagePath: String,
        startdate: String,
        enddate: String,
        starttime: String,
        endtime: String,
        partylogopath: String,
        location: String
    },
});
module.exports = mongoose.model('Parties', partySchema);
