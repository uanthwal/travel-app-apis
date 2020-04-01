var express = require("express");
var ejs = require("ejs");
let p1 = "group";
let p2 = "14";
var path = require("path");
var app = express();
let ip1 = "54";
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
let ip2 = "152";
var session = require("express-session");
let u = "developer";
var MongoStore = require("connect-mongo")(session);
var cors = require("cors");
let p3 = "developer";
let p_no = "27017";
var mngdb = "Tourism_DB";

(f = require("util").format), (fs = require("fs"));
app.use(cors());
let c_str =
  "mongodb://" +
  p3 +
  ":" +
  p1 +
  "" +
  p2 +
  "" +
  u +
  "@" +
  ip1 +
  "." +
  ip2 +
  ".237.11:" +
  p_no +
  "/" +
  mngdb;
mongoose.connect(c_str);

var db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function() {});

app.use(
  session({
    secret: "cloud-project",
    resave: true,
    saveUninitialized: false,
    store: new MongoStore({
      mongooseConnection: db
    })
  })
);

// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'ejs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// app.use(express.static(__dirname + '/views'));
app.all("/api/*", function(req, res, next) {
  console.log("Accessing the secret section ...");
  // let session_id = req.get("session_id");
  // UserSession.findOne({ session_id: session_id }, function(err, data) {
  //   if (err) {
  //     console.log("get_user_data_by_session err1: ", err);
  //     res.send({code:403, message: "Not Authorized to access this resource."});
  //   } else {
  //     console.log("Session: ", data);
  //     next() // pass control to the next handler
  //   }
  // });
  next();
});

var index = require("./routes/index");
app.use("/", index);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error("File Not Found");
  err.status = 404;
  next(err);
});

// error handler
// define as the last app.use callback
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.send(err.message);
});

// listen on port 3001
app.listen(3001, function() {
  console.log("Express app listening on port 3001");
});
