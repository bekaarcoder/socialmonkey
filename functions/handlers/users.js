const { db } = require("../utils/admin");
const config = require("../utils/config");
const {
  validateSignUpData,
  validateSignInData
} = require("../utils/validators");

const firebase = require("firebase");

firebase.initializeApp(config);

exports.signUpUser = (req, res) => {
  let newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPass: req.body.confirmPass,
    handle: req.body.handle
  };

  const { errors, valid } = validateSignUpData(newUser);

  if (!valid) {
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
};

exports.loginUser = (req, res) => {
  let userData = {
    email: req.body.email,
    password: req.body.password
  };

  const { valid, errors } = validateSignInData(userData);

  if (!valid) {
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
};
