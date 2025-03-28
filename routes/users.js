const express = require("express");
const {
  getUserHistory,
  updateUserHistory,
  deleteUserHistory,
  isAccountNameAvailable,
  updateAccountName,
  getUserReplies,
  getUserRetweets,
  getUserMentions,
  getUserFeed,
  updateUserDetails,
  createUser,
  getUserSettings,
  updateUserSettings,
  getUserBookmarks,
  getUserTweets,
  getUser,
  searchUsers,
  deleteUser,
  updateEmail,
  updatePassword,
  signin,
  signinAnonymously,
  getUserRecommendations,
} = require("../controllers/userController");
const { auth } = require("../middlewares/auth");

const router = express.Router();

router.get("/search", async function (req, res) {
  try {
    const { query, page, limit, deep_search } = req.query;
    const data = await searchUsers(query, page, limit, deep_search);

    res.send(data);
  } catch (err) {
    console.log(err);
    res.status(400).send(err.message);
  }
});

router.get("/settings", auth, async (req, res) => {
  try {
    const data = await getUserSettings(req.user);

    res.send(data);
  } catch (err) {
    console.log(err);
    res.status(400).send(err.message);
  }
});
router.put("/settings", auth, async (req, res) => {
  try {
    const data = await updateUserSettings(req.user, req.body);

    res.send(data);
  } catch (err) {
    console.log(err);
    res.status(400).send(err.message);
  }
});

router.get("/history", auth, async function (req, res) {
  try {
    const data = await getUserHistory(req.user);

    res.send(data);
  } catch (err) {
    console.log(err);
    res.status(400).send(err.message);
  }
});
router.post("/history", auth, async function (req, res) {
  try {
    const data = await updateUserHistory(req.user, req.body);

    res.send(data);
  } catch (err) {
    console.log(err);
    res.status(400).send(err.message);
  }
});
router.delete("/history", auth, async function (req, res) {
  try {
    const data = await deleteUserHistory(req.user, req.query.delete_all);

    res.send(data);
  } catch (err) {
    console.log(err);
    res.status(400).send(err.message);
  }
});

router.get("/", async function (req, res) {
  try {
    const { key, value, field, include } = req.query;
    const data = await getUser(key, value, field, include);

    res.send(data);
  } catch (err) {
    console.log(err);
    res.status(400).send(err.message);
  }
});

router.get("/isAccountNameAvailable", async function (req, res) {
  try {
    const data = await isAccountNameAvailable(req.query.account_name);

    res.send(data);
  } catch (err) {
    console.log(err);
    res.status(400).send(err.message);
  }
});

router.put("/updateAccountName", auth, async function (req, res) {
  try {
    const data = await updateAccountName(
      req.user,
      req.body.account_name,
      req.body.password
    );

    res.send(data);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

router.put("/updateEmail", auth, async function (req, res) {
  try {
    const data = await updateEmail(req.user, req.body.email, req.body.password);

    res.send(data);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

router.put("/updatePassword", auth, async function (req, res) {
  try {
    const data = await updatePassword(
      req.user,
      req.body.old_password,
      req.body.new_password
    );

    res.send(data);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

router.get("/bookmarks", auth, async function (req, res) {
  try {
    const data = await getUserBookmarks(req.user, req.query.page);

    res.send(data);
  } catch (err) {
    console.log(err);
    res.status(400).send(err.message);
  }
});

router.get("/:user_id/replies", async function (req, res) {
  try {
    const data = await getUserReplies(req.params.user_id, req.query.page);

    res.send(data);
  } catch (err) {
    console.log(err);
    res.status(400).send(err.message);
  }
});

router.get("/:user_id/retweets", async function (req, res) {
  try {
    const data = await getUserRetweets(req.params.user_id, req.query.page);

    res.send(data);
  } catch (err) {
    console.log(err);
    res.status(400).send(err.message);
  }
});

router.get("/:user_id/mentions", async function (req, res) {
  try {
    const data = await getUserMentions(req.params.user_id, req.query.page);

    res.send(data);
  } catch (err) {
    console.log(err);
    res.status(400).send(err.message);
  }
});

router.get("/:user_id/tweets", async function (req, res) {
  try {
    const data = await getUserTweets(req.params.user_id, req.query.page);

    res.send(data);
  } catch (err) {
    console.log(err);
    res.status(400).send(err.message);
  }
});

router.get("/feed", auth, async function (req, res) {
  try {
    const data = await getUserFeed(req.user, req.query.page);
    res.send(data);
  } catch (err) {
    console.log(err);
    res.status(400).send(err.message);
  }
});

router.post("/signinAnonymously", async function (req, res) {
  try {
    const token = signinAnonymously();
    res.send(token);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

router.post("/signin", async function (req, res) {
  try {
    const { user, token } = await signin(
      req.body.credential,
      req.body.password
    );

    res
      .header("x-auth-token", token)
      .header("access-control-expose-headers", "x-auth-token")
      .send(user);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

router.post("/", async function (req, res) {
  try {
    const isAccountNameValid = await isAccountNameAvailable(req.body.account_name);

    if (!isAccountNameValid) {
      throw new Error("Account name already taken");
    }

    const { token, user } = await createUser(req.body);

    res
      .header("x-auth-token", token)
      .header("access-control-expose-headers", "x-auth-token")
      .send(user);
  } catch (err) {
    console.log(err);
    res.status(400).send(err.message);
  }
});

router.put("/", auth, async function (req, res) {
  try {
    const data = await updateUserDetails(req.user, req.body);

    res.send(data);
  } catch (err) {
    console.log(err);
    res.status(400).send(err.message);
  }
});

router.delete("/", auth, async function (req, res) {
  try {
    const data = await deleteUser(req.user, req.body.password);

    res.send(data);
  } catch (err) {
    console.log(err);
    res.status(400).send(err.message);
  }
});

router.get("/recommendations", auth, async function (req, res) {
  try {
    const data = await getUserRecommendations(req.user, req.query.page);

    res.send(data);
  } catch (err) {
    console.log(err);
    res.status(400).send(err.message);
  }
});

module.exports = router;
