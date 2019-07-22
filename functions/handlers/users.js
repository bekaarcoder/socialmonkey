const { db, admin } = require("../utils/admin");
const config = require("../utils/config");
const {
  validateSignUpData,
  validateSignInData,
  validateUserDetails
} = require("../utils/validators");

const BusBoy = require("busboy");
const path = require("path");
const os = require("os");
const fs = require("fs");
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

  const imageDefault = "user_img.png";

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
        imageUrl: `https://firebasestorage.googleapis.com/v0/b/${
          config.storageBucket
        }/o/${imageDefault}?alt=media`,
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

exports.addUserDetails = (req, res) => {
  const details = {
    bio: req.body.bio,
    website: req.body.website,
    location: req.body.location
  };

  const userDetails = validateUserDetails(details);

  db.collection("users")
    .doc(req.user.handle)
    .update(userDetails)
    .then(() => {
      return res.json({ message: "User details added successfully" });
    })
    .catch(error => {
      return res.status(500).json({ error: error.code });
    });
};

exports.uploadImage = (req, res) => {
  const busboy = new BusBoy({ headers: req.headers });

  let imageFileName;
  let imageToBeUploaded = {};

  busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
    if (mimetype !== "image/jpeg" && mimetype !== "image/png") {
      return res
        .status(400)
        .json({ error: "Please select a file type of correct format" });
    }
    const imageExtension = filename.split(".")[filename.split(".").length - 1];
    imageFileName = `${Math.round(
      Math.random() * 100000000000
    )}.${imageExtension}`;
    const filePath = path.join(os.tmpdir(), imageFileName);
    imageToBeUploaded = { filePath, mimetype };
    file.pipe(fs.createWriteStream(filePath));
  });

  busboy.on("finish", () => {
    admin
      .storage()
      .bucket()
      .upload(imageToBeUploaded.filePath, {
        resumable: false,
        metadata: {
          metadata: {
            contentType: imageToBeUploaded.mimetype
          }
        }
      })
      .then(() => {
        const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${
          config.storageBucket
        }/o/${imageFileName}?alt=media`;
        return db
          .collection("users")
          .doc(req.user.handle)
          .update({ imageUrl });
      })
      .then(() => {
        return res.json({ message: "Image uploaded successfully" });
      })
      .catch(error => {
        console.log(error);
        return res.status(500).json({ error: error.code });
      });
  });

  busboy.end(req.rawBody);
};
