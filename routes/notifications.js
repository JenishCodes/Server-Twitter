const express = require("express");
const {
  markAllNotificationsAsSeen,
  markNotificationAsRead,
  getUnseenNotificationCount,
  getUserNotifications,
} = require("../controllers/notificationController");
const { auth } = require("../middlewares/auth");

const router = express.Router();

router.get("/", auth, async function (req, res) {
  try {
    const data = await getUserNotifications(req.user, req.query.page);

    res.send(data);
  } catch (err) {
    console.log(err);
    res.status(400).send(err.message);
  }
});

router.get("/unseen", auth, async function (req, res) {
  try {
    const data = await getUnseenNotificationCount(req.user);

    res.send({ count: data });
  } catch (err) {
    console.log(err);
    res.status(400).send(err.message);
  }
});

router.put("/:notificationId/read", async function (req, res) {
  try {
    const data = await markNotificationAsRead(req.params.notificationId);

    res.send(data);
  } catch (err) {
    console.log(err);
    res.status(400).send(err.message);
  }
});

router.put("/seen", auth, async function (req, res) {
  try {
    const data = await markAllNotificationsAsSeen(req.user);

    res.send(data);
  } catch (err) {
    console.log(err);
    res.status(400).send(err.message);
  }
});

module.exports = router;
