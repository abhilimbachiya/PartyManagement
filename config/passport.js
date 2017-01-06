var LocalStrategy = require('passport-local').Strategy;
var Admin = require('../app/models/admins');

module.exports = function (passport) {
    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function (id, done) {
        Admin.findById(id, function (err, user) {
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
            Admin.findOne({ 'local.email': email }, function (err, user) {
                if (err)
                    return done(err);
                if (user != null) {
                    return done(null, false, req.flash('signupMessage', 'Email is already taken!'));
                }
                else {
                    var newUser = new Admin();
                    newUser.local.email = email;
                    newUser.local.password = newUser.generateHash(password);
                    newUser.local.username = req.body.username;
                    newUser.local.name = req.body.name;
                    newUser.local.profileimage = "";
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
        Admin.findOne({ 'local.email': email }, function (err, user) {
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