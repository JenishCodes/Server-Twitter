const express = require("express");
const {
  getUserConversations,
  deleteConversation,
  getConversation,
} = require("../controllers/conversationController");
const { auth } = require("../middlewares/auth");

const router = express.Router();

router.get("/user", auth, async (req, res) => {
  try {
    const data = await getUserConversations(req.user);

    res.send(data);
  } catch (err) {
    console.log(err);
    res.status(400).send(err.messages);
  }
});

router.get("/:conversationId", auth, async (req, res) => {
  try {
    const data = await getConversation(req.params.conversationId, req.user);

    res.send(data);
  } catch (err) {
    console.log(err);
    res.status(400).send(err.messages);
  }
});

router.delete("/:conversationId", async (req, res) => {
  try {
    await deleteConversation(req.params.conversationId);

    res.send({ data: true });
  } catch (err) {
    console.log(err);
    res.status(400).send(err.messages);
  }
});

module.exports = router;
