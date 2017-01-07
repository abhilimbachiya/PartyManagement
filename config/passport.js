var LocalStrategy = require('passport-local').Strategy;
var User = require('../app/models/user');

module.exports = function (passport) {
    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function (id, done) {
        User.findById(id, function (err, user) {
            done(err, user);
        });
    });        

    //For local sign up
    passport.use('local-signup', new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true
    }, function (req, email, password, done) {
        process.nextTick(function () {
            User.findOne({ 'local.email': email }, function (err, user) {
                if (err)
                    return done(err);
                if (user != null) {
                    return done(null, false, req.flash('signupMessage', 'Email is already taken!'));
                }
                else {
                    var newUser = new User();
                    newUser.local.email = email;
                    newUser.local.password = newUser.generateHash(password);
                    newUser.local.usertype = req.body.usertype;
                    newUser.local.status = req.body.status;
                    newUser.local.username = req.body.username;
                    newUser.local.firstname = req.body.firstname;
                    newUser.local.lastname = req.body.lastname;
                    newUser.local.contact = req.body.contact;
                    newUser.local.city = req.body.city;
                    newUser.local.country = req.body.country;
                    newUser.local.path = "";
                    newUser.local.originalname = "";
                    newUser.save(function (err) {
                        if (err)
                            throw err;
                        return done(null, newUser);
                    });
                }
            });
        });
    }));

    //For local login
    passport.use('local-login', new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true
    }, function (req, email, password, done) {
        User.findOne({ 'local.email': email }, function (err, user) {
            if (err)
                return done(err);
            if (!user) {
                return done(null, false, req.flash('loginMessage', 'No user found.'));
            }
            if (!user.validPassword(password))
                return done(null, false, req.flash('loginMessage', 'Invalid credentials!'));
            return done(null, user);
        });
    }));

};