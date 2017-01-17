var mongoose = require('mongoose');

var reservationSchema = mongoose.Schema({
    user : { type: String, ref: 'users' },
    party_admin : { type: String, ref: 'users' },
    party : { type: String, ref: 'parties' },
    transaction_reference: String,
    price: Number
});
module.exports = mongoose.model('reservations', reservationSchema);