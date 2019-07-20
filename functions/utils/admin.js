const admin = require("firebase-admin");

let serviceAccount = require("../key/socialmonkey-dde1c-308df9fec904.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

let db = admin.firestore();

module.exports = { admin, db };
