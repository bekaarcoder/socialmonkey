const functions = require("firebase-functions");
const express = require("express");
const app = express();
const { db } = require("./utils/admin");

const firebaseAuth = require("./utils/fbauth");
const {
  getAllShouts,
  createNewShout,
  getShout,
  postComment,
  likeShout,
  deleteShout
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
app.delete("/shout/:shoutId", firebaseAuth, deleteShout);

// Like and unlike a shout
app.get("/shout/:shoutId/like", firebaseAuth, likeShout);

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

exports.createLikeNotification = functions.firestore
  .document("likes/{id}")
  .onCreate(snapshot => {
    db.collection("shouts")
      .doc(snapshot.data().shoutId)
      .get()
      .then(doc => {
        if (doc.exists) {
          return db
            .collection("notifications")
            .doc(snapshot.id)
            .set({
              createdAt: new Date().toISOString(),
              recipient: doc.data().userHandle,
              sender: snapshot.data().userHandle,
              type: "like",
              read: false,
              shoutId: doc.id
            });
        }
      })
      .then(() => {
        return;
      })
      .catch(error => {
        console.log(error);
        return;
      });
  });

exports.createCommentNotification = functions.firestore
  .document("comments/{id}")
  .onCreate(snapshot => {
    db.collection("shouts")
      .doc(snapshot.data().shoutId)
      .get()
      .then(doc => {
        if (doc.exists) {
          return db
            .collection("notifications")
            .doc(snapshot.id)
            .set({
              createdAt: new Date().toISOString(),
              recipient: doc.data().userHandle,
              sender: snapshot.data().userHandle,
              type: "comment",
              read: false,
              shoutId: doc.id
            });
        }
      })
      .then(() => {
        return;
      })
      .catch(error => {
        console.log(error);
        return;
      });
  });

exports.createUnlikeNotification = functions.firestore
  .document("likes/{id}")
  .onDelete(snapshot => {
    db.collection("notifications")
      .doc(snapshot.id)
      .delete()
      .then(() => {
        return;
      })
      .catch(error => {
        console.log(error);
        return;
      });
  });
