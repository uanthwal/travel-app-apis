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

router.post("/api/search", function(req, res, next) {
  var search_text = req.body.search_text;
  var s_id = req.body.session_id;
  var resp_data = [];

  Places.find({ $text: { $search: search_text } }, function(err, data) {
    console.log(data);
    resp_data = data;
    console.log("after query", data);
    UserSession.findOne({ session_id: s_id }, function(err, data) {
      if (data) {
        var newSearchHit = new SearchHit({
          email: data.email,
          search_text: search_text
        });
        newSearchHit.save(function(err, Person) {
          if (err) console.log(err);
          else console.log("Search hit saved");
        });
      }
    });
    res.send({
      code: 200,
      message: resp_data.length + " Result(s) Found",
      data: resp_data
    });
  });
});

router.post("/api/user-search-history", function(req, res, next) {
  var s_id = req.body.session_id;
  UserSession.findOne({ session_id: s_id }, function(err, data) {
    var resp_data = [];
    if (data) {
      SearchHit.find({ email: data.email }, function(err, s_data) {
        resp_data = s_data;
        res.send({
          code: 200,
          message: resp_data.length + " Result(s) Found",
          data: resp_data
        });
      });
    } else {
      res.send({
        code: 200,
        message: "No active session for user.",
        data: resp_data
      });
    }
  });
});

router.post("/get-hotspots", function(req, res, next) {
  Booking_History.aggregate(
    [
      { $group: { _id: "$dest", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ],
    function(err, grpbydata) {
      console.log(grpbydata);
      let res_data = [];
      for (let i = 0; i < 6; i++) {
        Places.findOne({ place_id: grpbydata[i]["_id"] }, function(err, data) {
          if (err) {
            console.log("err: ", err);
            return null;
          } else {
            console.log(data);
            res_data.push(data);
            if (i == 5) {
              res.send({
                code: 200,
                data: res_data,
                message: "Trending places"
              });
            }
          }
        });
      }
    }
  );
});

module.exports = router;
