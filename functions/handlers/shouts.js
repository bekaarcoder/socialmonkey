const { db } = require("../utils/admin");
const { isEmpty } = require("../helpers/helpers");

exports.getAllShouts = (req, res) => {
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
};

exports.createNewShout = (req, res) => {
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
};

exports.getShout = (req, res) => {
  let shoutData = {};
  db.collection("shouts")
    .doc(req.params.shoutId)
    .get()
    .then(doc => {
      if (!doc.exists) {
        return res.status(500).json({ error: "Shout does not exist" });
      }
      shoutData = doc.data();
      shoutData.shoutId = doc.id;
      return db
        .collection("comments")
        .orderBy("createdAt", "desc")
        .where("shoutId", "==", req.params.shoutId)
        .get();
    })
    .then(data => {
      shoutData.comments = [];
      data.forEach(doc => {
        shoutData.comments.push(doc.data());
      });
      return res.json(shoutData);
    })
    .catch(error => {
      return res.status(400).json(error);
    });
};

exports.postComment = (req, res) => {
  const newComment = {
    commentBody: req.body.commentBody,
    createdAt: new Date().toISOString(),
    userHandle: req.user.handle,
    shoutId: req.params.shoutId
  };
  db.collection("shouts")
    .doc(req.params.shoutId)
    .get()
    .then(doc => {
      if (!doc.exists) {
        return res.status(404).json({ error: "Shout not found" });
      }
      return db.collection("comments").add(newComment);
    })
    .then(() => {
      res.json(newComment);
    })
    .catch(error => {
      return res.status(500).json(error);
    });
};
