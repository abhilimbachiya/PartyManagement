var User = require('../app/models/user');
var Party = require('../app/models/party');
var Review = require('../app/models/review');
var Reservation = require('../app/models/reservation');
var Chat = require('../app/models/chat');
var Admin = require('../app/models/admins');
var Category = require("../app/models/category")
var multer = require('multer');
var braintree = require('braintree');
var gateway = require('../lib/gateway');
var mongoose = require('mongoose');
var express = require('express');
var path = require('path'); 
var crypto = require('crypto');
var mime = require('mime');

module.exports = function (app, passport) {

    app.use(function(req, res, next) {
        res.locals.user = req.user;
        next();
    });

    function isLoggedIn(req, res, next) {
        if (req.isAuthenticated())
            return next();

        res.redirect('/signin');
    }

    //for home page
    app.get("/", function (req, res) {
        Category.find({}, function (err, categories) {
            res.render('frontend/index', {
                categories: categories
            });
        });
    });

    app.get("/api/parties", function (req, res) {
        Party.find({}, function (err, parties) {
            res.json(parties);
        });
    });

    app.get("/api/parties/:id", function (req, res) {
        Party.findOne({ _id: req.params.id}).populate('category').exec(function (err, party) {
            res.render('frontend/parties/api_party', {
                party: party
            });
        });
    });

    app.post("/api/parties/search/id", function (req, res) {
        var query = Party.find().where('_id').in(req.body.markers).populate('category').exec(function (err, parties) {
            res.render('frontend/parties/api_parties', {
                parties: parties
            });
        });
    });

    app.post("/api/parties", function (req, res) {
        var conditions = {};
        if( req.body.keyword !== "" ) {
            var titleRegex = new RegExp(req.body.keyword, 'i');
            conditions["title"] = titleRegex;
        }

        if( req.body.category && req.body.category != 0 ) {
            conditions["category"] = req.body.category
        }

        if( req.body.price && req.body.price != 0 ) {
            conditions["price"] = { $lte: req.body.price }
        }

        Party.find(conditions).populate('category').exec(function (err, parties) {
            res.json(parties);
        });
    });

    app.get("/api/parties", function (req, res) {
        var conditions = {};
        if( req.body.keyword !== "" ) {
            var titleRegex = new RegExp(req.body.keyword, 'i');
            conditions["title"] = titleRegex;
        }

        if( req.body.category ) {
            conditions["category"] = req.body.category
        }

        // if( req.body.price ) {
        //     conditions["price"] = { $lt: req.body.price }
        // }

        Party.find(conditions).populate('category').exec(function (err, parties) {
            res.json(parties);
        });
    });

    app.get("/signin", function (req, res) {
        res.render('frontend/signin');
    });

    app.post('/signin', passport.authenticate('local-login', {
        successRedirect: '/',
        failureRedirect: '/signin',
        failureFlash: true
    }));

    app.get("/signup", function (req, res) {
        res.render('frontend/signup', { message: req.flash('signupMessage') });
    });

    app.get("/signout", function (req, res) {
        req.logout();
        res.redirect('/');
    });

    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/',
        failureRedirect: '/signup',
        failureFlash: true
    }));

    app.get("/forgot_password", function (req, res) {
        res.render("forgot_password", { message: "" });
    })
    app.post("/forgot_password", function (req, res) {
        var MailHtml = "";
        User.findOne({ 'local.email': req.body.email }, function (err, _user_response) {
            if (_user_response != null) {
                MailHtml += "<html>";
                MailHtml += "<head>";
                MailHtml += "<title></title>";
                MailHtml += "</head>";
                MailHtml += "<body>";
                MailHtml += "<p>Hello " + _user_response.local.email + "</p>";
                MailHtml += "</br>";
                MailHtml += "<p>Please, click on following link to reset the password : </p>";
                MailHtml += "</br>";
                MailHtml += "<a href='http://localhost:1337/admin/ResetPassword/" + _user_response._id + "' target='_blank'>http://localhost:1337/admin/ResetPassword/" + _user_response._id + "</a>";
                MailHtml += "</br>";
                MailHtml += "<p>Thank you.</p>";
                MailHtml += "</body>";
                MailHtml += "</html>";

                var mailoptions = {
                    from: 'jaymin.webbleu@gmail.com',
                    to: _user_response.local.email,
                    subject: 'Reset Password',
                    html: MailHtml
                }
                var transporter = nodemailer.createTransport({
                    service: 'Gmail',
                    auth: {
                        user: 'jaymin.webbleu@gmail.com',
                        pass: 'jaymin.123'
                    }
                });
                transporter.sendMail(mailoptions, function (err, Info) {
                    if (err) {
                        res.render("forgot_password", { message: "Sorry, your mail does not sent!" });
                    } else {
                        res.render("forgot_password", { message: "Email sent successfully. Please check your inbox!" });
                    }
                })
            } else {
                res.render("forgot_password", { message: "Email does not exist" });
            }
        });
    });

    app.get("/reset_password/:id", function (req, res) {
        User.findOne({ _id: req.params.id }, function (err, _user_response) {
            res.render("admin/ResetPassword", {
                _user: _user_response,
                message: ""
            });
        })
    })

    app.post("/reset_password", function (req, res) {
        if (req.body.confirm_password != req.body.password) {
            User.findOne({ _id: req.body.user_id }, function (err, _user_response) {
                res.render("admin/ResetPassword", {
                    _user: _user_response,
                    message: "Password does not match!"
                });
            })
        } else {
            User.findOne({ _id: req.body.user_id }, function (err, _user_response) {
                if (_user_response != null) {
                    var userSchema = new User();
                    _user_response.local.password = userSchema.generateHash(req.body.password);
                    _user_response.save();
                    res.render("admin/ResetPassword", {
                        _user: _user_response,
                        message: "Your password changed successfully!"
                    });
                }
            })
        }
    })

    var userAvatarStorage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, './public/uploads/users/avatars/')
        },
        filename: function (req, file, cb) {
            crypto.pseudoRandomBytes(16, function (err, raw) {
              cb(null, raw.toString('hex') + Date.now() + '.' + mime.extension(file.mimetype));
          });
        }
    });

    var userAvatarUpload = multer({ storage: userAvatarStorage })

    app.get("/settings", isLoggedIn, function (req, res) {
        res.render('frontend/settings');
    });

    app.post("/settings", isLoggedIn, userAvatarUpload.any(), function (req, res) {
        User.findOne({ _id: req.user.id }, function (err, user) {
            user.local.name = req.body.name;

            if(req.files[0])
                user.local.avatar = req.files[0];
            
            user.local.phone = req.body.phone;
            user.local.about = req.body.about;
            user.local.email = req.body.email;
            user.local.facebook_url = req.body.facebook_url;
            user.local.twitter_url = req.body.twitter_url;
            user.local.pinterest_url = req.body.pinterest_url;
            user.local.youtube_url = req.body.youtube_url;
            user.save();
            res.redirect('/settings');
        });
    });

    app.get("/parties/create", isLoggedIn, function (req, res) {
        Category.find({}, function (err, categories) {
            res.render('frontend/parties/create', {
                party: {},
                categories: categories
            });
        });
    });

    var partyImagesStorage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, './public/uploads/parties/images/')
        },
        filename: function (req, file, cb) {
            crypto.pseudoRandomBytes(16, function (err, raw) {
              cb(null, raw.toString('hex') + Date.now() + '.' + mime.extension(file.mimetype));
          });
        }
    });

    var partyImagesUpload = multer({ storage: partyImagesStorage })

    app.post("/parties/create", isLoggedIn, partyImagesUpload.any(), function (req, res) {
        var party = new Party();
        party.user_id = req.user.id;
        party.category = req.body.category;
        party.title = req.body.title;
        party.description = req.body.description;
        party.price = req.body.price;
        party.duration = req.body.duration;
        party.location = req.body.location;
        party.latitude = req.body.latitude;
        party.longitude = req.body.longitude;
        party.images = req.files;
        party.contact_no = req.body.contact_no;
        party.email = req.body.email;
        party.website = req.body.website;
        party.video_url = req.body.video_url;
        party.facebook_url = req.body.facebook_url;
        party.twitter_url = req.body.twitter_url;
        party.youtube_url = req.body.youtube_url;
        party.pinterest_url = req.body.pinterest_url;
        party.save(function (err) {
            if (!err)
                res.redirect('/parties');
            else
                throw err;
        });
    })

    app.get("/parties", isLoggedIn, function (req, res) {
        Party.find({user_id: req.user.id}).populate('category').exec(function (err, parties) {
            res.render('frontend/parties/index', {
                parties: parties
            });
        });
    });

    app.get("/parties/:id/edit", isLoggedIn, function (req, res) {
        Category.find({}, function (err, categories) {
            Party.findOne({user_id: req.user.id, _id: req.params.id}).populate('category').exec(function (err, party) {
                res.render('frontend/parties/edit', {
                    party: party,
                    categories: categories
                });
            });
        });
    })

    app.post("/parties/:id/edit", isLoggedIn, partyImagesUpload.any(), function (req, res) {
        Party.findOne({ user_id: req.user.id, _id: req.params.id }, function (err, party) {
            party.user_id = req.user.id;
            party.category = req.body.category;
            party.title = req.body.title;
            party.description = req.body.description;
            party.price = req.body.price;
            party.duration = req.body.duration;
            party.location = req.body.location;
            party.latitude = req.body.latitude;
            party.longitude = req.body.longitude;

            if(req.files.length > 0){
                if(party.images){
                    party.images = party.images.concat(req.files);
                }
                else{
                    party.images = req.files;
                }
            }

            party.contact_no = req.body.contact_no;
            party.email = req.body.email;
            party.website = req.body.website;
            party.video_url = req.body.video_url;
            party.facebook_url = req.body.facebook_url;
            party.twitter_url = req.body.twitter_url;
            party.youtube_url = req.body.youtube_url;
            party.pinterest_url = req.body.pinterest_url;
            party.save();
            res.redirect('/parties');               
        });
    })

    app.get("/parties/:id/delete", isLoggedIn, function (req, res) {
        Party.findOne({ user_id: req.user.id, _id: req.params.id }, function (err, _party) {
            if (_party != null) {
                Party.remove({ _id: req.params.id }, function (err, done) {
                    res.redirect('/parties');
                });
            }
        });
    })

    app.post("/parties/:id/reviews", isLoggedIn, function (req, res) {
        Party.findOne({ _id: req.params.id }, function (err, party) {
            var review = new Review();
            review.user = req.user.id;
            review.party = party.id;
            review.title = req.body.title;
            review.content = req.body.content;
            review.rating = req.body.score_rating;
            review.save();
            res.redirect('/parties/' + party.id);               
        });
    });

    app.get("/parties/:id", function (req, res) {
        Party.findOne({ _id: req.params.id }).populate('category').exec(function (err, party) {
            Review.find({ party: req.params.id }).populate('user').exec(function (err, reviews) {
                res.render('frontend/parties/show', {
                    party: party,
                    reviews: reviews
                });
            });
        });
    })

    //PAYMENT

    var TRANSACTION_SUCCESS_STATUSES = [
    braintree.Transaction.Status.Authorizing,
    braintree.Transaction.Status.Authorized,
    braintree.Transaction.Status.Settled,
    braintree.Transaction.Status.Settling,
    braintree.Transaction.Status.SettlementConfirmed,
    braintree.Transaction.Status.SettlementPending,
    braintree.Transaction.Status.SubmittedForSettlement
    ];

    function formatErrors(errors) {
      var formattedErrors = '';

      for (var i in errors) { // eslint-disable-line no-inner-declarations, vars-on-top
        if (errors.hasOwnProperty(i)) {
          formattedErrors += 'Error: ' + errors[i].code + ': ' + errors[i].message + '\n';
      }
  }
  return formattedErrors;
}

function createResultObject(transaction) {
  var result;
  var status = transaction.status;

  if (TRANSACTION_SUCCESS_STATUSES.indexOf(status) !== -1) {
    result = {
      header: 'Sweet Success!',
      icon: 'success',
      message: 'Your test transaction has been successfully processed. See the Braintree API response and try again.'
  };
} else {
    result = {
      header: 'Transaction Failed',
      icon: 'fail',
      message: 'Your test transaction has a status of ' + status + '. See the Braintree API response and try again.'
  };
}

return result;
}

app.get('/parties/:id/checkout', isLoggedIn, function (req, res) {
    Party.findOne({ _id: req.params.id }).exec(function (err, party) {
      gateway.clientToken.generate({}, function (err, response) {
        res.render('frontend/parties/checkouts/new', {party: party, clientToken: response.clientToken, messages: req.flash('error')});
    });
  });
});

app.get('/parties/:id/checkouts/:id', isLoggedIn, function (req, res) {
    Party.findOne({ _id: req.params.id }).exec(function (err, party) {
      var result;
      var transactionId = req.params.id;

      gateway.transaction.find(transactionId, function (err, transaction) {
        result = createResultObject(transaction);
        res.render('frontend/parties/checkouts/show', {party: party, transaction: transaction, result: result});
    });
  });
});

app.post('/parties/:id/checkout', isLoggedIn, function (req, res) {
    Party.findOne({ _id: req.params.id }).exec(function (err, party) {
      var transactionErrors;
          var amount = party.price; // In production you should not take amounts directly from clients
          var nonce = req.body.payment_method_nonce;

          gateway.transaction.sale({
            amount: amount,
            paymentMethodNonce: nonce,
            options: {
              submitForSettlement: true
          }
      }, function (err, result) {
        if (result.success || result.transaction) {
            var partyReservation = new Reservation();
            partyReservation.user = req.user.id;
            partyReservation.party = party.id;
            partyReservation.transaction_reference = result.transaction.id;
            partyReservation.price = party.price;
            partyReservation.save();

            res.redirect('/reservations');
        } else {
          transactionErrors = result.errors.deepErrors();
          req.flash('error', {msg: formatErrors(transactionErrors)});
          res.redirect('/parties/' + party.id + '/checkout');
      }
  });
      });
});

    //END PAYMENT

    app.get("/reservations", isLoggedIn , function (req, res) {
        Reservation.find({  }).populate({ 
           path: 'party',
            populate: {
                path: 'category',
                model: 'categories'
            } 
         }).exec(function (err, reservations) {
            res.render('frontend/reservations/index', {
                reservations: reservations
            });
        });
     })

    app.get('/reservations/:id/chat', isLoggedIn, function(req, res){
        Reservation.findOne({_id: req.params.id}).populate('user').populate({ 
               path: 'party',
                populate: {
                    path: 'user_id',
                    model: 'users'
                } 
             }).exec(function (err, reservation) {
        
            if(req.user.id == reservation.user.id){
                var other_user = reservation.party.user_id;
            }
            else{
                var other_user = reservation.user;
            }
            Chat.find({ $or:[ {'sender':req.user.id}, {'receiver':req.user.id} ]}).populate('sender').populate('receiver').exec(function (err, chats) {
                res.render('frontend/reservations/chat', {
                    reservation: reservation,
                    chats: chats,
                    other_user: other_user,
                    id: req.params.id
                });
            });
        });
     });

     //ADMIN

     app.addImage = function (image, callback) {
        Party.create(image, callback);
    }

    var _storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, './public/uploads/parties/images/');
        },
        filename: function (req, file, cb) {
            cb(null, file.originalname);
        }
    })

    app.use(function (req, res, next) {
        res.locals.user = req.user;
        next();
    });

    var upload = multer({
        storage: _storage
    })

    app.get("/admin/", function (req, res) {
        res.render('admin/login.ejs', { message: req.flash('loginMessage') });
    });

    app.get("/admin/login", function (req, res) {
        res.render('admin/login.ejs', { message: req.flash('loginMessage') });
    });

    app.get("/admin/ManageParties", function (req, res) {
        Party.find({})
        .populate('category')
        .populate('reviews')
        .exec(function (err, parties) {
            res.render('admin/ManageParties', {
                _p: parties,
            });
        })
    });

    app.get("/admin/editPartyInfo/:id", function (req, res) {
        Category.find({}, function (err, categories) {
            Party.findOne({ _id: req.params.id }, function (err, party) {
                res.render('admin/EditParties', {
                    _p: party,
                    categories: categories
                });
            });
        });
    })

    app.get("/admin/deletePartyInfo/:id", function (req, res) {
        Party.findOne({ _id: req.params.id }, function (err, _parties) {
            if (_parties != null) {
                Party.remove({ _id: req.params.id }, function (err, done) {
                    res.redirect('/admin/ManageParties');
                });
            }
        });
    })

    app.post("/admin/EditPartyEvent", upload.any(), function (req, res) {
        Party.findOne({ _id: req.body.id }, function (err, _parties) {
            _parties.title = req.body.title;
            _parties.user_id = req.user.id;
            _parties.location = req.body.location;
            _parties.category = req.body.category;
            //_parties.endtime = req.body.endtime;
            //_parties.starttime = req.body.starttime;
            _parties.duration = req.body.duration;
            _parties.enddate = req.body.enddate;
            _parties.startdate = req.body.startdate;
            _parties.description = req.body.description;
            _parties.contact_no = req.body.contact_no;
            _parties.email = req.body.email;
            _parties.website = req.body.website;
            _parties.video_url = req.body.video_url;
            _parties.facebook_url = req.body.facebook_url;
            _parties.twitter_url = req.body.twitter_url;
            _parties.youtube_url = req.body.youtube_url;
            _parties.pinterest_url = req.body.pinterest_url;
            if (req.files.length > 0) {
                _parties.images = req.files;
            } else {
                _parties.images = _parties.images;
            }
            _parties.latitude = req.body.latitude;
            _parties.longitude = req.body.longitude;
            _parties.price = req.body.price;
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
        var partySchema = new Party();
        partySchema.title = req.body.title
        partySchema.description = req.body.description;
        partySchema.backgroundImagePath = backgroundImagePaths;
        partySchema.startdate = req.body.startdate;
        partySchema.enddate = req.body.enddate;
        partySchema.starttime = req.body.starttime;
        partySchema.endtime = req.body.endtime;
        partySchema.partylogopath = partylogopaths;
        partySchema.location = req.body.location;
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

    //app.get("/admin/userhome", isLoggedIn, function (req, res) {
    //    res.render('admin/userhome.ejs', {
    //        user: req.user
    //    });
    //});

    app.get("/admin/logout", function (req, res) {
        req.logout();
        res.redirect('/admin/');
    });

    function isAdminLoggedIn(req, res, next) {
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
    
    //---------------------------------------------------------------------------------------------------User routes--------------------------------------------------------------
    app.get("/admin/ManageUsers", function (req, res) {
        User.find({}, function (err, _ausers) {
            res.render('admin/ManageUsers', {
                _u: _ausers
            });
        })
    });

    app.get("/admin/AddNewUser", function (req, res) {
        res.render('admin/AddNewUser.ejs');
    });

    app.post("/admin/addNewuser", upload.any(), function (req, res, done) {
        var profileimage = "";
        if (req.files.length > 0 && req.files[0].path != null) {
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
    });

    app.get("/admin/EditUserInfo/:id", function (req, res) {
        User.findOne({ _id: req.params.id }, function (err, _ausers) {
            res.render('admin/EditUsers', {
                _au: _ausers
            });
        });
    });

    app.get("/admin/DeleteUserInfo/:id", function (req, res) {
        User.findOne({ _id: req.params.id }, function (err, _ausers) {
            if (_ausers != null) {
                User.remove({ _id: req.params.id }, function (err, done) {
                    res.redirect('/admin/ManageUsers');
                });
            }
        });
    });

    app.post("/admin/EditUserDetails", upload.any(), function (req, res) {
        User.findOne({ _id: req.body.id }, function (err, _ausers) {
            if (req.files.length > 0) {
                var profileimage = req.files[0].path;
            }
            if (_ausers != null) {
                if (_ausers.local.profileimage == null) {
                    _ausers.local.profileimage = "";
                } else {
                    _ausers.local.profileimage = profileimage;
                }
            }
            _ausers.local.name = req.body.name;
            _ausers.local.username = req.body.username;
            _ausers.save();
            res.redirect('/admin/ManageUsers');
        });
    });

    //--------------------------------------------------------------------------------Manage Admin Users----------------------------------------------------------------
    //ManageAdminUsers
    app.get("/admin/ManageAdminUsers", function (req, res) {
        Admin.find({}, function (err, _admin_ausers) {
            res.render('admin/ManageAdminUsers', {
                _au: _admin_ausers
            });
        })
    });

    app.get("/admin/AddNewAdmin", function (req, res) {
        res.render('admin/AddAdminUsers.ejs');
    });

    app.get("/admin/EditAdminUserInfo/:id", function (req, res) {
        Admin.findOne({ _id: req.params.id }, function (err, _admin_ausers) {
            res.render('admin/EditAdminUsers', {
                _au: _admin_ausers
            });
        });
    });

    app.get("/admin/DeleteAdminUserInfo/:id", function (req, res) {
        Admin.findOne({ _id: req.params.id }, function (err, _admin_ausers) {
            if (_admin_ausers != null) {
                Admin.remove({ _id: req.params.id }, function (err, done) {
                    res.redirect('/admin/ManageAdminUsers');
                });
            }
        });
    });

    app.post("/admin/addNewAdminuser", upload.any(), function (req, res, done) {
        var profileimage = "";
        if (req.files.length > 0 && req.files[0].path != null) {
            profileimage = req.files[0].path;
        } else {
            profileimage = "";
        }
        Admin.findOne({ 'local.email': req.body.email }, function (err, admin_auser) {
            if (err)
                return done(err);
            if (admin_auser != null) {
                return done(null, false, req.flash('EmailMessage', 'Email is already taken!'));
            }
            else {
                var adminSchema = new Admin();
                adminSchema.local.name = req.body.name;
                adminSchema.local.username = req.body.username;
                adminSchema.local.password = adminSchema.generateHash(req.body.password);
                adminSchema.local.profileimage = profileimage;
                adminSchema.local.email = req.body.email;
                adminSchema.save(function (err) {
                    if (!err)
                        res.redirect('/admin/ManageAdminUsers');
                    else
                        throw err;
                });
            }
        });
    });

    app.post("/admin/EditAdminUserDetails", upload.any(), function (req, res) {
        Admin.findOne({ _id: req.body.id }, function (err, _admin_ausers) {
            if (req.files.length > 0) {
                var profileimage = req.files[0].path;
            }
            if (_admin_ausers != null) {
                if (_admin_ausers.local.profileimage == null) {
                    _admin_ausers.local.profileimage = "";
                } else {
                    _admin_ausers.local.profileimage = profileimage;
                }
            }
            _admin_ausers.local.name = req.body.name;
            _admin_ausers.local.username = req.body.username;
            _admin_ausers.save();
            res.redirect('/admin/ManageAdminUsers');
        });
    });
    //----------------------------------------User profile----------------------------------------------------------
    app.get("/admin/EditProfileDetails", function (req, res) {
        User.findOne({ _id: req.user._id }, function (err, _admin_ausers) {
            res.render('admin/EditProfile', {
                _au: _admin_ausers
            });
        });
    });
    app.post("/admin/EditProfileInfo", upload.any(), function (req, res) {
        User.findOne({ _id: req.body.id }, function (err, _admin_ausers) {
            if (req.files.length > 0) {
                var profileimage = req.files[0].path;
            }
            if (_admin_ausers != null) {
                if (_admin_ausers.local.profileimage == null) {
                    _admin_ausers.local.profileimage = "";
                } else {
                    _admin_ausers.local.profileimage = profileimage;
                }
            }
            _admin_ausers.local.name = req.body.name;
            _admin_ausers.local.username = req.body.username;
            _admin_ausers.save();
            res.redirect('/admin/userhome');
        });
    });
    //-------------------------------------Change password---------------------------------------------------------
    app.get("/admin/ChangePasswordLayout", function (req, res) {
        res.render('admin/ChangePassword.ejs');
    });
    app.post("/admin/ChangePasswordInfo", upload.any(), function (req, res) {
        var adminSchema = new User();
        User.findOne({ _id: req.user._id }, function (err, _admin_ausers) {
            _admin_ausers.local.password = adminSchema.generateHash(req.body.password);
            _admin_ausers.save();
            res.redirect('/admin/userhome');
        });
    });   

    //----------------------------Categories Routes--------------------------------------------------------------

    app.get("/admin/CategoriesLayout", function (req, res) {
        Category.find({}, function (err, _categories) {
            res.render('admin/ManageCategories', {
                _c: _categories
            });
        })
    });

    app.get("/admin/AddNewCategory", function (req, res) {
        res.render('admin/AddNewCategory.ejs');
    });

    app.post("/admin/addnewcategory", upload.any(), function (req, res) {
        var CategorySchema = new Category();
        CategorySchema.name = req.body.name;
        CategorySchema.save(function (err) {
            if (!err)
                res.redirect('/admin/CategoriesLayout');
            else
                throw err;
        });
    });

    app.get("/admin/EditCategoryInfo/:id", function (req, res) {
        Category.findOne({ _id: req.params.id }, function (err, _category) {
            res.render('admin/EditCategories', {
                _c: _category
            });
        });
    })

    app.get("/admin/DeleteCategoryInfo/:id", function (req, res) {
        Category.findOne({ _id: req.params.id }, function (err, _category) {
            if (_category != null) {
                Category.remove({ _id: req.params.id }, function (err, done) {
                    res.redirect('/admin/CategoriesLayout');
                });
            }
        });
    });

    app.post("/admin/EditCategories", upload.any(), function (req, res) {
        Category.findOne({ _id: req.body.id }, function (err, _category) {
            _category.name = req.body.name;
            _category.save();
            res.redirect('/admin/CategoriesLayout');
        });
    });

    //-------------------------------------------------------------------------Manage Reviews------------------------------------------------------------
    app.get("/admin/ManageReviews/:id", isAdminLoggedIn, function (req, res) {
        Party.findOne({ _id: req.params.id }, function (err, party) {
            Review.find({ party: req.params.id }).populate('user').exec(function (err, reviews) {
                res.render('admin/ManageReviews', {
                    reviews: reviews
                });
            });
        });
    });
    app.get("/admin/DeleteReviewById/:id", isAdminLoggedIn, function (req, res) {
        Review.findOne({ _id: req.params.id }, function (err, _reviews) {
            if (_reviews != null) {
                Review.remove({ _id: req.params.id }, function (err, done) {
                    res.redirect('/admin/ManageParties');
                });
            }
        });
    });
    //-------------------------------------------------------------------------Manage Dashboard------------------------------------------------------------
    app.get("/admin/userhome", isAdminLoggedIn, function (req, res) {
        User.find({}, function (err, _users_count) {
            Admin.find({}, function (err, _admins_count) {
                Party.find({}, function (err, _parties_count) {
                    Review.find({}, function (err, _reviews_count) {
                        Reservation.find({}, function (err, _reservation_count) {
                            Reservation.aggregate([
                            {
                                $group:
                                {
                                    _id: "",
                                    totalAmount: {
                                        $sum: { $multiply: ["$price"] }
                                    }
                                }
                            }], function (err, sum) {
                                res.render('admin/userhome', {
                                    _total_no_of_admins: _admins_count.length,
                                    _total_no_of_users: _users_count.length,
                                    _total_no_of_reviews: _reviews_count.length,
                                    _total_no_of_parties: _parties_count.length,
                                    _total_no_of_reservation: _reservation_count,
                                    _total_reservation_amount: sum[0].totalAmount
                                })
                            });
                        })
                    })
                })
            })
        })

    })
    //------------------------------------------------------------Manage Reservations-----------------------------------------------------------------------

    app.get("/admin/ListAllReservations", isAdminLoggedIn, function (req, res) {
        Reservation.find({})
        .populate('user')
        .populate('party')
        .exec(function (err, reservation) {                
            res.render('admin/ManageReservations', {
                reservations: reservation
            });
        });
    })

    //----------------------------------------------------------Forgot password-------------------------------------------
    app.get("/admin/ForgetPassword", function (req, res) {
        res.render("admin/ForgetPassword", { message: "" });
    })
    app.post("/admin/GetPassword", function (req, res) {
        var MailHtml = "";
        User.findOne({ 'local.email': req.body.email }, function (err, _user_response) {
            if (_user_response != null) {
                MailHtml += "<html>";
                MailHtml += "<head>";
                MailHtml += "<title></title>";
                MailHtml += "</head>";
                MailHtml += "<body>";
                MailHtml += "<p>Hello " + _user_response.local.email + "</p>";
                MailHtml += "</br>";
                MailHtml += "<p>Please, click on following link to reset the password : </p>";
                MailHtml += "</br>";
                MailHtml += "<a href='http://localhost:1337/admin/ResetPassword/" + _user_response._id + "' target='_blank'>http://localhost:1337/admin/ResetPassword/" + _user_response._id + "</a>";
                MailHtml += "</br>";
                MailHtml += "<p>Thank you.</p>";
                MailHtml += "</body>";
                MailHtml += "</html>";

                var mailoptions = {
                    from: 'jaymin.webbleu@gmail.com',
                    to: _user_response.local.email,
                    subject: 'Reset Password',
                    html: MailHtml
                }
                var transporter = nodemailer.createTransport({
                    service: 'Gmail',
                    auth: {
                        user: 'jaymin.webbleu@gmail.com',
                        pass: 'jaymin.123'
                    }
                });
                transporter.sendMail(mailoptions, function (err, Info) {
                    if (err) {
                        res.render("admin/ForgetPassword", { message: "Sorry, your mail does not sent!" });
                    } else {
                        res.render("admin/ForgetPassword", { message: "Email sent successfully. Please check your inbox!" });
                    }
                })
            } else {
                res.render("admin/ForgetPassword", { message: "Email does not exist" });
            }
        });
    });

    app.get("/admin/ResetPassword/:id", function (req, res) {
        User.findOne({ _id: req.params.id }, function (err, _user_response) {
            res.render("admin/ResetPassword", {
                _user: _user_response,
                message: ""
            });
        })
    })

    app.post("/admin/Change_or_reset_password", function (req, res) {
        if (req.body.confirm_password != req.body.password) {
            User.findOne({ _id: req.body.user_id }, function (err, _user_response) {
                res.render("admin/ResetPassword", {
                    _user: _user_response,
                    message: "Password does not match!"
                });
            })
        } else {
            User.findOne({ _id: req.body.user_id }, function (err, _user_response) {
                if (_user_response != null) {
                    var userSchema = new User();
                    _user_response.local.password = userSchema.generateHash(req.body.password);
                    _user_response.save();
                    res.render("admin/ResetPassword", {
                        _user: _user_response,
                        message: "Your password changed successfully!"
                    });
                }
            })
        }
    })

    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('frontend/error', {
            error: err
        });
    });

}
