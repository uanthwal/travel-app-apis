var express = require("express");
var router = express.Router();
var User = require("../models/user");
var TwoFactorAuth = require("../models/twofactor");
var UserSession = require("../models/usersession");
var SearchHit = require("../models/search");
var Places = require("../models/places");
var Provinces = require("../models/provinces");
var Booking_History = require("../models/booking_history");
var nodemailer = require("nodemailer");
const fetch = require("node-fetch");
const uuidv1 = require("uuid/v1");
const PDFDocument = require("pdfkit");
const fs = require("fs");

router.get("/", function(req, res, next) {
  res.send({
    code: "200",
    message: "User service"
  });
});

router.post("/register", function(req, res, next) {
  console.log(req.body);
  var userInfo = req.body;

  if (
    !userInfo.email ||
    !userInfo.username ||
    !userInfo.password ||
    !userInfo.mobile
  ) {
    res.send({ code: "400", message: "Bad Request" });
  } else {
    User.findOne({ email: userInfo.email }, function(err, data) {
      if (!data) {
        var c;
        User.findOne({}, function(err, data) {
          if (data) {
            console.log("if");
            c = data.unique_id + 1;
          } else {
            c = 1;
          }

          var newUser = new User({
            unique_id: c,
            email: userInfo.email,
            username: userInfo.username,
            password: userInfo.password,
            mobile: userInfo.mobile
          });

          newUser.save(function(err, Person) {
            if (err) console.log(err);
            else console.log("Success");
          });
        })
          .sort({ _id: -1 })
          .limit(1);
        res.send({ code: "200", message: "User registered successfully." });
      } else {
        res.send({
          code: "201",
          message: "User already registered with this email"
        });
      }
    });
  }
});

router.post("/verify-otp", function(req, res, next) {
  var req_data = req.body;
  console.log(
    "OTP Verification for user " + req_data.email + " OTP: " + req_data.otp
  );
  TwoFactorAuth.findOne({ email: req_data.email }, function(err, mainTfData) {
    console.log("Data for user " + req_data.email + " in 2FA:", mainTfData);
    if (mainTfData) {
      console.log(parseInt(mainTfData.otp));
      console.log(parseInt(req_data.otp));
      console.log(parseInt(mainTfData.otp) === parseInt(req_data.otp));
      if (parseInt(mainTfData.otp) === parseInt(req_data.otp)) {
        console.log(
          "OTP Matched, removing all OTP(s) for email: ",
          req_data.email
        );
        TwoFactorAuth.deleteMany({ email: req_data.email }, function(
          err,
          tfdata
        ) {
          if (err) console.log(err);
          else console.log("OTP removed for user: " + req_data.email);
        });
        var session_id = uuidv1();
        console.log(session_id);
        var userSession = new UserSession({
          email: req_data.email,
          session_id: session_id
        });
        UserSession.find({ email: req_data.email }, function(err, usdata) {
          if (usdata) {
            console.log("Session found for user: " + req_data.email);
            UserSession.deleteMany({ email: req_data.email }, function(
              err,
              usddata
            ) {
              if (err) console.log(err);
              else {
                console.log("OTP removed for user: " + req_data.email);
                userSession.save(function(err, Person) {
                  if (err) console.log(err);
                  else {
                    console.log("New Session Created: " + req_data.email);
                    res.send({
                      code: "200",
                      message: "OTP verified successfully.",
                      session_id: session_id
                    });
                  }
                });
              }
            });
          } else {
            userSession.save(function(err, Person) {
              if (err) console.log(err);
              else {
                console.log("Session Created: " + req_data.email);
                res.send({
                  code: "200",
                  message: "OTP verified successfully.",
                  session_id: session_id
                });
              }
            });
          }
        });
      } else {
        res.send({
          code: "204",
          message: "Incorrect OTP."
        });
      }
    } else {
      res.send({
        code: "205",
        message: "No entry for OTP in records."
      });
    }
  });
});

router.post("/send-otp", function(req, res, next) {
  var req_data = req.body;
  var transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "travelcanadacc@gmail.com",
      pass: "CloudGroup14"
    }
  });
  var mailOptions = {
    from: "noreply@travelcanadacc.com",
    to: req_data.email,
    subject: "travel app alert : One Time Password",
    text: "Your One Time Password to access the Travel App is : " + req_data.otp
  };
  transporter.sendMail(mailOptions, function(error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
      TwoFactorAuth.find({ email: req_data.email }, function(err, finddata) {
        if (finddata) {
          console.log("OTPs exists for user: ", req_data.email);
          TwoFactorAuth.deleteMany({ email: req_data.email }, function(
            err,
            deletedata
          ) {
            if (err) console.log(err);
            else {
              console.log("OTP removed for user: " + req_data.email);
              var twoFactAuth = new TwoFactorAuth({
                email: req_data.email,
                otp: req_data.otp
              });
              twoFactAuth.save(function(err, Person) {
                if (err) console.log(err);
                else {
                  console.log("New OTP saved for user: " + req_data.email);
                  res.send({
                    code: "200",
                    message:
                      "OTP has been successfully sent to the registered email."
                  });
                }
              });
            }
          });
        } else {
          console.log("No OTPs for user: ", data.email);
          var twoFactAuth = new TwoFactorAuth({
            email: data.email,
            otp: data.otp
          });
          twoFactAuth.save(function(err, Person) {
            if (err) console.log(err);
            else {
              console.log("OTP saved for user:" + data.email);
              res.send({
                code: "200",
                message:
                  "OTP has been successfully sent to the registered email."
              });
            }
          });
        }
      });
    }
  });
});

router.post("/login", function(req, res, next) {
  console.log(req.body.email);
  console.log(req.body.password);
  User.findOne({ email: req.body.email }, function(err, data) {
    if (data) {
      if (data.password == req.body.password) {
        var req_object = {
          email: req.body.email,
          otp: Math.floor(100000 + Math.random() * 900000)
        };
        url = "https://cloud-5409.herokuapp.com/send-otp";
        var headers = {
          "Content-Type": "application/json"
        };
        fetch(url, {
          mode: "cors",
          method: "POST",
          headers: headers,
          body: JSON.stringify(req_object)
        })
          .then(res => {
            console.log(res.json());
          })
          .then(json => {});
        res.send({
          code: "200",
          message: "OTP has been successfully sent to the registered email."
        });
      } else {
        res.send({ code: "202", message: "Invalid Credentials." });
      }
    } else {
      console.log(err);
      res.send({ code: "203", message: "User not found" });
    }
  });
});

router.post("/api/logout", function(req, res, next) {
  var s_id = req.body.session_id;
  UserSession.findOne({ session_id: s_id }, function(err, data) {
    if (data) {
      UserSession.deleteOne({ email: data.email }, function(err, del_data) {
        if (err) console.log(err);
        else console.log("Session destroyed: " + data.email);
      });
      res.send({
        code: 200,
        message: "Session destroyed. Logout Successful."
      });
    } else {
      res.send({
        code: 200,
        message: "No active session for user."
      });
    }
  });
});

router.post("/api/get-user-info-by-session", function(req, res, next) {
  UserSession.findOne({ session_id: req.body.session_id }, function(err, data) {
    if (err) {
      console.log("get_user_data_by_session err1: ", err);
      return null;
    } else {
      console.log("Session: ", data);
      User.findOne({ email: data.email }, function(err, user_data) {
        if (err) {
          console.log("get_user_data_by_mail err1: ", err);
          return null;
        } else {
          let user_info = JSON.parse(JSON.stringify(user_data));
          delete user_info["password"];
          console.log("User data in session:", user_info);
          res.send({
            code: 200,
            data: user_info,
            message: "User data from session fetched successfully!"
          });
        }
      });
    }
  });
});

module.exports = router;
