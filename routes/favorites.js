const express = require("express");
const {
  isFavorite,
  getFavoriters,
  getFavorites,
  createFavorite,
  deleteFavorite,
} = require("../controllers/favoriteController");
const { auth } = require("../middlewares/auth");

const router = express.Router();

router.get("/isFavoriter", auth, async function (req, res) {
  try {
    const data = await isFavorite(req.query.tweet_id, req.user);

    res.send(data);
  } catch (err) {
    console.log(err);
    res.status(400);
    res.send(err.message);
  }
});

router.get("/:tweet_id/favoriters", async function (req, res) {
  try {
    const data = await getFavoriters(req.params.tweet_id, req.query.page);
    res.send(data);
  } catch (err) {
    console.log(err);
    res.status(400);
    res.send(err.message);
  }
});

router.get("/:user_id/favorites", auth, async function (req, res) {
  try {
    const data = await getFavorites(req.user, req.query.page);
    res.send(data);
  } catch (err) {
    console.log(err);
    res.status(400);
    res.send(err.message);
  }
});

router.post("/", auth, async function (req, res) {
  try {
    const data = await createFavorite({
      author: req.user,
      tweet: req.body.tweet,
    });
    res.send(data);
  } catch (err) {
    console.log(err);
    res.status(400).send(err.message);
  }
});

router.delete("/", auth, async function (req, res) {
  try {
    const data = await deleteFavorite(req.query.tweet_id, req.user);

    res.send(data);
  } catch (err) {
    console.log(err);
    res.status(400).send(err.message);
  }
});

module.exports = router;
