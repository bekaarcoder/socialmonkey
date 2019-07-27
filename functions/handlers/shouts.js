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
    userImage: req.user.imageUrl,
    likeCount: 0,
    commentCount: 0,
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
      const resShout = newShout;
      resShout.shoutId = doc.id;
      res.json(resShout);
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

exports.likeShout = (req, res) => {
  const likeDocument = db
    .collection("likes")
    .where("userHandle", "==", req.user.handle)
    .where("shoutId", "==", req.params.shoutId)
    .limit(1);

  const shoutDocument = db.collection("shouts").doc(req.params.shoutId);

  let shoutData;

  shoutDocument
    .get()
    .then(doc => {
      if (doc.exists) {
        shoutData = doc.data();
        shoutData.shoutId = doc.id;
        return likeDocument.get();
      } else {
        return res.status(404).json({ error: "Shout not found" });
      }
    })
    .then(data => {
      console.log(data.empty);
      if (data.empty) {
        return db
          .collection("likes")
          .add({
            shoutId: req.params.shoutId,
            userHandle: req.user.handle
          })
          .then(() => {
            shoutData.likeCount++;
            return shoutDocument.update({ likeCount: shoutData.likeCount });
          })
          .then(() => {
            res.json(shoutData);
          });
      } else {
        // console.log(data.docs[0].id);
        return db
          .collection("likes")
          .doc(data.docs[0].id)
          .delete()
          .then(() => {
            shoutData.likeCount--;
            if (shoutData.likeCount < 0) {
              shoutData.likeCount = 0;
            }
            return shoutDocument.update({ likeCount: shoutData.likeCount });
          })
          .then(() => {
            res.json(shoutData);
          });
        //return res.status(400).json({ error: "Shout already liked" });
      }
    })
    .catch(error => {
      res.status(500).json({ error: "Error" });
    });
};
