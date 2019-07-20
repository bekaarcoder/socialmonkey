const functions = require("firebase-functions");
const { getAllShouts, createNewShout } = require("./handlers/shouts");
const { signUpUser, loginUser } = require("./handlers/users");
const firebaseAuth = require("./utils/fbauth");
const express = require("express");

const app = express();

// Get all the shouts
app.get("/shouts", getAllShouts);

// Create new shout
app.post("/createShout", firebaseAuth, createNewShout);

// signup route
app.post("/signup", signUpUser);

// login route
app.post("/login", loginUser);

exports.api = functions.https.onRequest(app);
