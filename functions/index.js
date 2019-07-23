const functions = require("firebase-functions");
const express = require("express");
const app = express();

const firebaseAuth = require("./utils/fbauth");
const {
  getAllShouts,
  createNewShout,
  getShout,
  postComment
} = require("./handlers/shouts");
const {
  signUpUser,
  loginUser,
  uploadImage,
  addUserDetails,
  getAuthenticatedUser
} = require("./handlers/users");

// Get all the shouts
app.get("/shouts", getAllShouts);

// Create new shout
app.post("/createShout", firebaseAuth, createNewShout);

// Get shout
app.get("/shout/:shoutId", getShout);

// Delete Shout
// Like a shout
// Unlike a shout
// Comment on a shout
app.post("/shout/:shoutId/comment", firebaseAuth, postComment);

// signup route
app.post("/signup", signUpUser);

// login route
app.post("/login", loginUser);

// Image upload
app.post("/user/image", firebaseAuth, uploadImage);

// Add User Details route
app.post("/user", firebaseAuth, addUserDetails);

// Get User Details route
app.get("/user", firebaseAuth, getAuthenticatedUser);

exports.api = functions.https.onRequest(app);
