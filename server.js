//Include required packages
var http = require('http');                                                                 // for http requests
var express = require('express');                                                           // include express framework
var app = express();                                                                        // for init express framework
var mongoos = require('mongoose');                                                          // for mongodb query processing and schema
var passport = require('passport');                                                         // for passport authentication
var flash = require('connect-flash');                                                       // for flash messages
var morgan = require('morgan');                                                             // for logger
var cookieparser = require('cookie-parser');                                                // for store user data in cookie
var bodyparser = require('body-parser');                                                    // for form data
var session = require('express-session');                                                   // for session
var path = require('path');                                                                 // for file upload global path
var multer = require('multer');                                                             //for disk storage management

var configDb = require('./config/database.js');                                             // include db file connection
var port = process.env.PORT || 5959;                                                        //Initialize port for currently running application
mongoos.connect(configDb.url);                                                              // connect mongo db using mongoose
app.set('view engine', 'ejs');                                                              // Set view engine for view layout using express framework
app.use(morgan('dev'));                                                                     // Make in use morgan for logger
app.use(cookieparser());                                                                    // To save user data in cookie
app.use(bodyparser.json());                                                                 //To get form data using body parser
app.use(bodyparser.urlencoded({ extended: true }));                                         // to encode content of form body

app.use(express.static('public'));
app.use('/public', express.static('public'));

app.use(session({                                                                           // Use the session for user data
    secret: "welcometopartymanagementsystembynodejs",                                       //Secreat of user key
    name: "PartyManagementSystem",                                                          //name of session
    resave: true,                                                                           // to resave session data
    proxy: true,                                                                            // for proxy
    saveUninitialized: true                                                                 // for minimal save session
}));
app.use(passport.initialize());                                                             // use passport authentication for sign up and login
app.use(passport.session());                                                                // use passport session 
app.use(flash());

require('./config/passport')(passport);                                                     // Initialize passport for use authentication and sign up
require('./app/routes.js')(app, passport);                                                  //initialize routing for api
var io = require('socket.io').listen(app.listen(port));										// Initialize application to declared port
require('./app/socket.js')(io);