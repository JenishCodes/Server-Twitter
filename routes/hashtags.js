const express = require("express");
const {
  searchHashtag,
  createHashtag,
  getHashtagTweets,
  addTweetToHashtag,
} = require("../controllers/hashtagController");

const router = express.Router();

router.get("/search", async function (req, res) {
  try {
    const { query, page, limit } = req.query;
    const data = await searchHashtag(query, page, limit);

    res.send(data);
  } catch (err) {
    console.log(err);
    res.status(400).send(err.message);
  }
});

router.get("/:tag", async function (req, res) {
  try {
    const data = await getHashtagTweets(req.params.tag, req.query.page);

    res.send(data);
  } catch (err) {
    console.log(err);
    res.status(400).send(err.message);
  }
});

router.post("/", async function (req, res) {
  try {
    const data = await createHashtag(req.body);

    res.send(data);
  } catch (err) {
    console.log(err);
    res.status(400).send(err.message);
  }
});

router.put("/", async function (req, res) {
  try {
    const data = await addTweetToHashtag(req.params.tag, req.body.tweet);

    res.send(data);
  } catch (err) {
    console.log(err);
    res.status(400).send(err.message);
  }
});

module.exports = router;
