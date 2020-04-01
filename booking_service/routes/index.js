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


function generate_mode_number() {
  const upperCaseAlp = [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "U",
    "V",
    "W",
    "X",
    "Y",
    "Z"
  ];
  const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  let number =
    upperCaseAlp[Math.floor(Math.random() * (upperCaseAlp.length - 0) + 0)] +
    "" +
    upperCaseAlp[Math.floor(Math.random() * (upperCaseAlp.length - 0) + 0)] +
    "" +
    upperCaseAlp[Math.floor(Math.random() * (upperCaseAlp.length - 0) + 0)] +
    "-" +
    numbers[Math.floor(Math.random() * (numbers.length - 0) + 0)] +
    "" +
    numbers[Math.floor(Math.random() * (numbers.length - 0) + 0)] +
    "" +
    numbers[Math.floor(Math.random() * (numbers.length - 0) + 0)];
  return number;
}

function get_company(mode) {
  let flight_companies = [
    "Emirates",
    "Air Canada",
    "United Airles",
    "Air India"
  ];
  let bus_companies = [
    "Greyhound Canada",
    "Autobus Maheux Service",
    "Coach Canada",
    "DRL Coachlines Service"
  ];
  if (mode == "Bus") {
    return bus_companies[
      Math.floor(Math.random() * (bus_companies.length - 0) + 0)
    ];
  } else {
    return flight_companies[
      Math.floor(Math.random() * (flight_companies.length - 0) + 0)
    ];
  }
}

router.post("/api/modes", function(req, res, next) {
  var source = req.body.src;
  var destination = req.body.dest;
  if (!source || !destination) {
    res.send({
      code: "400",
      data: [],
      message: "Bad Request"
    });
  } else {
    t = 355;

    let bus_options = Math.floor(Math.random() * (4 - 1) + 1);
    let modes_data = [];
    if (source == destination) {
      for (var i = 1; i <= bus_options; i++) {
        // Bus fare ranging from 50$ to 100$
        let bus_fare = Math.floor(Math.random() * (100 - 50) + 50);
        modes_data.push({
          mode_number: generate_mode_number(),
          mode: "Bus",
          mode_company: get_company("Bus"),
          currency: "$",
          mode_fare: bus_fare + ".00",
          mode_id: "bus_" + i
        });
      }
      res.send({
        code: "200",
        message: "Travel options",
        data: modes_data
      });
    } else if (source != destination) {
      let flight_options = Math.floor(Math.random() * (4 - 1) + 1);
      for (var i = 1; i <= bus_options; i++) {
        // Bus fare ranging from 50$ to 100$
        let bus_fare = Math.floor(Math.random() * (100 - 50) + 50);
        modes_data.push({
          mode_number: generate_mode_number(),
          mode: "Bus",
          mode_company: get_company("Bus"),
          currency: "$",
          mode_fare: bus_fare + ".00",
          mode_id: "bus_" + i
        });
      }
      for (var i = 1; i <= flight_options; i++) {
        let bus_fare = Math.floor(Math.random() * (100 - 50) + 50);
        bus_fare = Math.floor(bus_fare * 2.5);
        modes_data.push({
          mode_number: generate_mode_number(),
          mode: "Flight",
          mode_company: get_company("Flight"),
          currency: "$",
          mode_fare: bus_fare + ".00",
          mode_id: "flight_" + i
        });
      }
      res.send({
        code: "200",
        message: "Travel options",
        data: modes_data
      });
    } else {
      res.send({
        code: "400",
        data: [],
        message: "Bad Request; Issue with source or destination"
      });
    }
  }
});

router.post("/api/get-all-provinces", function(req, res, next) {
  Provinces.find({}, { _id: 0 }, function(err, data) {
    if (data) {
      res.send({
        code: 200,
        data: data,
        message: "All the provinces in Canada"
      });
    } else if (err) {
      console.log("Error while fetching the data: " + err);
    }
  });
});

router.post("/api/get-province-by-id", function(req, res, next) {
  Provinces.findOne({ p_id: id }, function(err, data) {
    if (err) {
      return null;
    } else {
      console.log(data);
      res.send({
        code: 200,
        data: data,
        message: "Province data fetched successfully!"
      });
    }
  });
});

router.post("/api/get-place-by-id", function(req, res, next) {
  Places.findOne({ place_id: id }, function(err, data) {
    if (err) {
      console.log("err: ", err);
      return null;
    } else {
      console.log(data);
      res.send({
        code: 200,
        data: data,
        message: "Place data fetched successfully!"
      });
    }
  });
});

router.post("/api/book-ticket", function(req, res, next) {
  let booking_info = new Booking_History({
    username: req.body.username,
    src: req.body.src,
    dest: req.body.dest,
    mode: req.body.mode,
    mode_company: req.body.mode_company,
    mode_fare: req.body.mode_fare,
    mode_number: req.body.mode_number,
    mode_id: req.body.mode_id,
    date_of_travel: "" + req.body.date_of_travel
  });
  booking_info.save(function(err, data) {
    if (err) throw err;
    else {
      console.log(data);
      res.send({
        code: 200,
        booking_id: data["_id"],
        message: "Booking done for request"
      });
    }
  });
});

router.post("/api/get-booking-by-id", function(req, res, next) {
  var ObjectId = require("mongodb").ObjectId;
  let booking_id = new ObjectId(req.body.booking_id);
  Booking_History.find({ _id: booking_id }, function(err, data) {
    if (err) throw err;
    res.send({
      code: 200,
      data: data,
      message: "Booking done for request"
    });
  });
});

router.post("/api/ticket_generation", function(req, res, next) {
  console.log("Reached");

  var ref = "123456789";
  var mode = "Flight";
  var p_name = "Piyush";
  var src = "NB";
  var dest = "KTCHN";
  var j_date = "March 31, 2020";
  var fare = "$180.0";
  var flight_name = "West Jet";
  var flight_number = "(ROX - 218)";

  var doc = new PDFDocument();
  doc.pipe(fs.createWriteStream("ticket.pdf"));
  doc
    .fontSize(14)
    .text("Your Booking Is Confirmed", 200, 90)
    .text("Your booking reference number is: " + ref, 130, 120);

  doc
    .fontSize(9)
    .text("Passenger Name: " + p_name, 220, 240)
    .text("Source: " + src, 220, 260)
    .text("Destination: " + dest, 220, 280)
    .text("Journey Date: " + j_date, 220, 300)
    .text("Mode: " + mode, 220, 320)
    .text("Fare: " + fare, 220, 340);

  doc
    .fontSize(9)
    .text(flight_name, 155, 295)
    .text(flight_number, 150, 305);

  doc.image(
    "../images/confirmed.png",
    210,
    150,
    { width: 170, height: 70 }
    // fit: [100, 100],
  );

  if (mode == "Flight") {
    doc.image("../images/flight.png", 150, 240, { width: 50, height: 50 });
    // fit: [10, 10]
  } else if (mode == "Bus") {
    doc.image("../images/bus.png", 150, 240, { width: 50, height: 50 });
    // fit: [100, 100]
  } else {
    console.log("No valid mode!");
  }

  doc.end();
  res.send("OK");
});

module.exports = router;
