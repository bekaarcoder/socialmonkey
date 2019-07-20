const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const firebase = require("firebase");

const app = express();

let serviceAccount = require("./key/socialmonkey-dde1c-308df9fec904.json");
const firebaseConfig = {
  apiKey: "AIzaSyDu9DPJIaj7mOU6gd5J2QsA4UWawoBT8hs",
  authDomain: "socialmonkey-dde1c.firebaseapp.com",
  databaseURL: "https://socialmonkey-dde1c.firebaseio.com",
  projectId: "socialmonkey-dde1c",
  storageBucket: "socialmonkey-dde1c.appspot.com",
  messagingSenderId: "29074716068",
  appId: "1:29074716068:web:32a5314491463129"
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

firebase.initializeApp(firebaseConfig);

let db = admin.firestore();

// helpers functions
const isEmpty = field => {
  if (field.trim() === "") return true;
  else return false;
};

const isEmail = email => {
  const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (email.match(regEx)) return true;
  else return false;
};

// Get all the shouts
app.get("/shouts", (req, res) => {
  db.collection("shouts")
    .orderBy("createdAt", "desc")
    .get()
    .then(data => {
      let shouts = [];
      data.forEach(doc => {
        shouts.push({
          shoutId: doc.id,
          user: doc.data().userHandle,
          shout: doc.data().shout,
          createdAt: doc.data().createdAt
        });
      });
      return res.json(shouts);
    })
    .catch(error => {
      res.json({ error: "Error Happended!" });
      console.log(error);
    });
});

const firebaseAuth = (req, res, next) => {
  let idToken;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    idToken = req.headers.authorization.split("Bearer ")[1];
  } else {
    console.error("No token found");
    return res.status(403).json({ error: "Not Authorized" });
  }

  admin
    .auth()
    .verifyIdToken(idToken)
    .then(decodedToken => {
      req.user = decodedToken;
      console.log(decodedToken);
      return db
        .collection("users")
        .where("userId", "==", req.user.uid)
        .limit(1)
        .get();
    })
    .then(data => {
      req.user.handle = data.docs[0].data().handle;
      return next();
    })
    .catch(error => {
      console.log(error);
      return res.status(403).json(error);
    });
};

// Create new shout
app.post("/createShout", firebaseAuth, (req, res) => {
  let newShout = {
    userHandle: req.user.handle,
    shout: req.body.shout,
    createdAt: new Date().toISOString()
  };

  let errors = {};

  if (isEmpty(newShout.shout)) {
    errors.shout =
      "Shout body must not be empty. Please enter something to shout.";
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json(errors);
  }

  db.collection("shouts")
    .add(newShout)
    .then(doc => {
      res.send(`New shout with ${doc.id} is created successfully`);
    })
    .catch(error => {
      res.status(500).json({ error: "Something went bad" });
    });
});

// signup route
app.post("/signup", (req, res) => {
  let newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPass: req.body.confirmPass,
    handle: req.body.handle
  };

  let errors = {};

  if (isEmpty(newUser.email)) {
    errors.email = "Email must not be empty";
  } else if (!isEmail(newUser.email)) {
    errors.email = "Email must be valid";
  }

  if (isEmpty(newUser.password)) {
    errors.password = "Password must not be empty";
  }

  if (isEmpty(newUser.confirmPass)) {
    errors.confirmPass = "Confirm Password must not be empty";
  } else if (newUser.password !== newUser.confirmPass) {
    errors.confirmPass = "Password must be same";
  }

  if (isEmpty(newUser.handle)) {
    errors.handle = "Handle must not be empty";
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json(errors);
  }

  let idToken, userId;

  db.collection("users")
    .doc(`${newUser.handle}`)
    .get()
    .then(doc => {
      if (doc.exists) {
        return res.status(400).json({ handle: "This handle is already taken" });
      } else {
        return firebase
          .auth()
          .createUserWithEmailAndPassword(newUser.email, newUser.password);
      }
    })
    .then(data => {
      userId = data.user.uid;
      return data.user.getIdToken();
    })
    .then(token => {
      idToken = token;
      const newUserData = {
        handle: newUser.handle,
        email: newUser.email,
        userId,
        createdAt: new Date().toISOString()
      };
      return db
        .collection("users")
        .doc(`${newUser.handle}`)
        .set(newUserData);
    })
    .then(() => {
      return res.status(201).json({ idToken });
    })
    .catch(error => {
      if (error.code === "auth/email-already-in-use") {
        return res.status(400).json({ email: error.message });
      } else {
        return res.status(500).json({ error: error.code });
      }
    });
});

// login route
app.post("/login", (req, res) => {
  let userData = {
    email: req.body.email,
    password: req.body.password
  };

  let errors = {};

  if (isEmpty(userData.email)) {
    errors.email = "Email must not be empty";
  } else if (!isEmail(userData.email)) {
    errors.email = "Email address must be valid";
  }

  if (isEmpty(userData.password)) {
    errors.password = "Password must not be empty";
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json(errors);
  }

  firebase
    .auth()
    .signInWithEmailAndPassword(userData.email, userData.password)
    .then(data => {
      return data.user.getIdToken();
    })
    .then(token => {
      return res.json({ token });
    })
    .catch(error => {
      if (error.code === "auth/wrong-password") {
        return res.status(500).json({ login: error.message });
      }
      return res.status(500).json({ error: error.code });
    });
});

exports.api = functions.https.onRequest(app);
