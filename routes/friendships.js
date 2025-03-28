const express = require("express");
const {
  getFollowers,
  getFollowings,
  createFriendship,
  deleteFriendship,
  getRelationship,
} = require("../controllers/friendshipController");
const { auth } = require("../middlewares/auth");

const router = express.Router();

router.get("/:account_name/followers", async function (req, res) {
  try {
    const data = await getFollowers(req.params.account_name, req.query.page);

    res.send(data);
  } catch (err) {
    console.log(err);
    res.status(400).send(err.message);
  }
});

router.get("/:account_name/following", async function (req, res) {
  try {
    const data = await getFollowings(req.params.account_name, req.query.page);

    res.send(data);
  } catch (err) {
    console.log(err);
    res.status(400).send(err.message);
  }
});

router.get("/", async function (req, res) {
  try {
    const data = await getRelationship(req.query.source, req.query.target);

    res.send(data);
  } catch (err) {
    console.log(err);
    res.status(400).send(err.message);
  }
});

router.post("/", auth, async function (req, res) {
  try {
    const data = await createFriendship(req.body);

    res.send(data);
  } catch (err) {
    console.log(err);
    res.status(400).send(err.message);
  }
});

router.delete("/", auth, async function (req, res) {
  try {
    const data = await deleteFriendship(
      req.query.source_id,
      req.query.target_id
    );

    res.send(data);
  } catch (err) {
    console.log(err);
    res.status(400).send(err.message);
  }
});

module.exports = router;
