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
                    return done(null, false, req.flash('alert', 'Email is already taken!'));
                }
                else {
                    var newUser = new User();
                    newUser.local.email = email;
                    newUser.local.password = newUser.generateHash(password);
                    newUser.local.name = req.body.name;
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
        req.checkBody('email', 'Please check your email').notEmpty().isEmail();
        req.checkBody('password', 'Please enter your password').notEmpty();

        req.getValidationResult().then(function(result){
            if (!result.isEmpty()) {
                req.flash('errors', result.array());
                res.redirect('signin');
            }

            User.findOne({ 'local.email': email }, function (err, user) {
                if (err)
                    return done(err);
                if (!user || !user.validPassword(password))
                    return done(null, false, req.flash('alert', 'Invalid email or password'));

                return done(null, user);
            });
        });
    }));

};