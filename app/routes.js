var Admin = require('../app/models/admins');
var User = require('../app/models/Users');
var Parties = require('../app/models/party');

var bodyparser = require('body-parser');
var multer = require('multer');
var mongoose = require('mongoose');
var path = require('path');

module.exports = function (app, passport) {
    app.addImage = function (image, callback) {
        Parties.create(image, callback);
    }

    var _storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, 'Uploads/admin/Party/background/');
        },
        filename: function (req, file, cb) {
            cb(null, file.originalname);
        }
    })

    var _logo_storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, 'Uploads/admin/Party/logo/');
        },
        logofilename: function (req, file, cb) {
            cb(null, file.originalname);
        }
    })

    var upload = multer({
        storage: _storage
    })

    var logoupload = multer({
        storage: _logo_storage
    })

    app.get("/admin/", function (req, res) {
        res.render('admin/login.ejs', { message: req.flash('loginMessage') });
    });

    app.get("/admin/login", function (req, res) {
        res.render('admin/login.ejs', { message: req.flash('loginMessage') });
    });

    app.get("/admin/ManageParties", function (req, res) {
        Parties.find({}, function (err, _parties) {
            res.render('admin/ManageParties', {
                _p: _parties
            });
        })

    });

    app.get("/admin/editPartyInfo/:id", function (req, res) {
        Parties.findOne({ _id: req.params.id }, function (err, _parties) {
            res.render('admin/EditParties', {
                _p: _parties
            });
        });
    })

    app.get("/admin/deletePartyInfo/:id", function (req, res) {
        Parties.findOne({ _id: req.params.id }, function (err, _parties) {
            if (_parties != null) {
                Parties.remove({ _id: req.params.id }, function (err, done) {
                    res.redirect('/admin/ManageParties');
                });
            }
        });
    })

    app.post("/admin/EditPartyEvent", upload.any(), function (req, res) {        
        Parties.findOne({ _id: req.body.id }, function (err, _parties) {
            //if (req.files != null) {
            //    var backgroundImagePaths = req.files[0].path;
            //    var partylogopaths = req.files[1].path
            //}            
            //if (_parties != null) {
            //    if (_parties.parties.backgroundImagePath == null) {
            //        _parties.parties.backgroundImagePath = "";
            //    } else {
            //        _parties.parties.backgroundImagePath = backgroundImagePaths;
            //    }
            //    if (_parties.parties.partylogopath == null) {
            //        _parties.parties.partylogopath = "";
            //    } else {
            //        _parties.parties.partylogopath = partylogopaths;
            //    }
            //}
            _parties.parties.location = req.body.location;
            _parties.parties.endtime = req.body.endtime;
            _parties.parties.starttime = req.body.starttime;
            _parties.parties.enddate = req.body.enddate;
            _parties.parties.startdate = req.body.startdate;
            _parties.parties.description = req.body.description;
            _parties.parties.title = req.body.title;
            _parties.save();
            res.redirect('/admin/ManageParties');               
        });
    })

    app.get("/admin/AddNewParty", function (req, res) {
        res.render('admin/AddNewParty.ejs');
    });

    app.post("/admin/addNewEvent", upload.any(), function (req, res) {
        var backgroundImagePaths = req.files[0].path;
        var partylogopaths = req.files[1].path
        var partySchema = new Parties();
        partySchema.parties.title = req.body.title
        partySchema.parties.description = req.body.description;
        partySchema.parties.backgroundImagePath = backgroundImagePaths;
        partySchema.parties.startdate = req.body.startdate;
        partySchema.parties.enddate = req.body.enddate;
        partySchema.parties.starttime = req.body.starttime;
        partySchema.parties.endtime = req.body.endtime;
        partySchema.parties.partylogopath = partylogopaths;
        partySchema.parties.location = req.body.location;
        partySchema.save(function (err) {
            if (!err)
                res.redirect('/admin/ManageParties');
            else
                throw err;
        });
    })

    app.get("/admin/signup", function (req, res) {
        res.render('admin/signup.ejs', { message: req.flash('signupMessage') });
    });

    app.get("/admin/profile", isLoggedIn, function (req, res) {
        res.render('admin/profile.ejs', {
            user: req.user
        });
    });

    app.get("/admin/userhome", isLoggedIn, function (req, res) {
        res.render('admin/userhome.ejs', {
            user: req.user
        });
    });

    app.get("/admin/logout", function (req, res) {
        req.logout();
        res.redirect('/admin/');
    });

    function isLoggedIn(req, res, next) {
        if (req.isAuthenticated())
            return next();
        res.redirect('/admin/');
    }

    app.post('/admin/signup', passport.authenticate('local-signup', {
        successRedirect: 'userhome',
        failureRedirect: 'signup',
        failureFlash: true
    }));

    //for login
    app.post('/admin/login', passport.authenticate('local-login', {
        successRedirect: 'userhome',
        failureRedirect: 'login',
        failureFlash: true,
    }));
    
    //User routes
    app.get("/admin/ManageUsers", function (req, res) {
        User.find({}, function (err, _Users) {
            res.render('admin/ManageUsers', {
                _u: _Users
            });
        })
    });

    app.get("/admin/AddNewUser", function (req, res) {
        res.render('admin/AddNewUser.ejs');
    });

    app.post("/admin/addNewuser", upload.any(), function (req, res, done) {
        var profileimage = "";
        if (req.files[0].path != null) {
            profileimage = req.files[0].path;
        } else {
            profileimage = "";
        }
        User.findOne({ 'local.email': req.body.email }, function (err, user) {
            if (err)
                return done(err);
            if (user != null) {
                return done(null, false, req.flash('EmailMessage', 'Email is already taken!'));
            }
            else {
                var userSchema = new User();
                userSchema.local.name = req.body.name
                userSchema.local.username = req.body.username;
                userSchema.local.password = userSchema.generateHash(req.body.password);
                userSchema.local.profileimage = profileimage;
                userSchema.local.email = req.body.email;
                userSchema.save(function (err) {
                    if (!err)
                        res.redirect('/admin/ManageUsers');
                    else
                        throw err;
                });
            }
        });
    })

    app.get("/admin/editAdminInfo/:id", function (req, res) {
        User.findOne({ _id: req.params.id }, function (err, _Users) {
            res.render('admin/EditUsers', {
                _u: _Users
            });
        });
    })

    app.get("/admin/deleteAdminInfo/:id", function (req, res) {
        User.findOne({ _id: req.params.id }, function (err, _Users) {
            if (_Users != null) {
                User.remove({ _id: req.params.id }, function (err, done) {
                    res.redirect('/admin/ManageUsers');
                });
            }
        });
    })
}
