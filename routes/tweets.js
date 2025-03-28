const express = require("express");
const {
  searchTweets,
  updateTweetDetails,
  deleteTweet,
  createTweet,
  getTweetReplies,
  getTweetReferences,
  getTweetRetweeters,
  isRetweeter,
  getTweet,
} = require("../controllers/tweetController");
const { auth, optionalAuth } = require("../middlewares/auth");

const router = express.Router();

router.get("/search", async function (req, res) {
  try {
    const data = await searchTweets(req.query.query, req.query.page);

    res.send(data);
  } catch (err) {
    console.log(err);
    res.status(400).send(err.message);
  }
});

router.get("/:tweet_id", async function (req, res) {
  try {
    const data = await getTweet(req.params.tweet_id, "", req.query.include);

    res.send(data);
  } catch (err) {
    console.log(err);
    res.status(400).send(err.message);
  }
});

router.delete("/:tweet_id", auth, async function (req, res) {
  try {
    const data = await deleteTweet(
      req.params.tweet_id,
      req.query.isRetweet === "true" ? req.user : null
    );

    res.send(data);
  } catch (err) {
    console.log(err);
    res.status(400).send(err.message);
  }
});

router.post("/create", async function (req, res) {
  try {
    const data = await createTweet(req.body);

    res.send(data);
  } catch (err) {
    console.log(err);
    res.status(400);
    res.send(err);
  }
});

router.put("/:tweet_id", async function (req, res) {
  try {
    const data = await updateTweetDetails(req.params.tweet_id, req.body);

    res.send(data);
  } catch (err) {
    console.log(err);
    res.status(400);
    res.send(err);
  }
});

router.get("/:tweet_id/replies", optionalAuth, async function (req, res) {
  try {
    const data = await getTweetReplies(
      req.params.tweet_id,
      req.user,
      req.query.page
    );

    res.send(data);
  } catch (err) {
    console.log(err);
    res.status(400).send(err.message);
  }
});

router.get("/:tweet_id/references", async function (req, res) {
  try {
    const data = await getTweetReferences(req.params.tweet_id);

    res.send(data);
  } catch (err) {
    console.log(err);
    res.status(400).send(err.message);
  }
});

router.get("/:tweet_id/isRetweeter", auth, async function (req, res) {
  try {
    const data = await isRetweeter(req.params.tweet_id, req.user);

    res.send(data);
  } catch (err) {
    console.log(err);
    res.status(400).send(err.message);
  }
});

router.get("/:tweet_id/retweeters", async function (req, res) {
  try {
    const data = await getTweetRetweeters(req.params.tweet_id, req.query.page);

    res.send(data);
  } catch (err) {
    console.log(err);
    res.status(400).send(err.message);
  }
});

module.exports = router;
