var express = require('express');                                                           // include express framework
var app = express();                                                                        // for init express framework.

app.use(express.static("/admin/assets/admin/css/lib/bootstrap"));
app.use(express.static("/admin/assets/admin/css/lib/font-awesome"));
app.use(express.static("/admin/assets/admin/css/separate/pages"));
app.use(express.static("/admin/assets/admin/js/lib/bootstrap"));
app.use(express.static("/admin/assets/admin/js/lib/jquery"));
app.use(express.static("/admin/assets/admin/js/lib/match-height"));
app.use(express.static("/admin/assets/admin/js/lib/tether"));





