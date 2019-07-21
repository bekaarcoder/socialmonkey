const functions = require("firebase-functions");
const express = require("express");
const app = express();

const firebaseAuth = require("./utils/fbauth");
const { getAllShouts, createNewShout } = require("./handlers/shouts");
const { signUpUser, loginUser, uploadImage } = require("./handlers/users");

// Get all the shouts
app.get("/shouts", getAllShouts);

// Create new shout
app.post("/createShout", firebaseAuth, createNewShout);

// signup route
app.post("/signup", signUpUser);

// login route
app.post("/login", loginUser);

// Image upload
app.post("/user/image", firebaseAuth, uploadImage);

exports.api = functions.https.onRequest(app);
