const express = require("express");
const {
  getConversationMessages,
  deleteMessage,
  createMessage,
} = require("../controllers/messageController");
const { auth } = require("../middlewares/auth");

const router = express.Router();

router.get("/:conversationId", auth, async (req, res) => {
  try {
    const data = await getConversationMessages(
      req.params.conversationId,
      req.query.page
    );

    res.send(data);
  } catch (err) {
    console.log(err);
    res.status(400).send(err.messages);
  }
});

router.post("/", auth, async (req, res) => {
  try {
    const data = await createMessage(req.body);

    res.send(data);
  } catch (err) {
    console.log(err);
    res.status(400).send(err.messages);
  }
});

router.delete("/:message_id", auth, async (req, res) => {
  try {
    const data = await deleteMessage(req.params.message_id);

    res.send(data);
  } catch (err) {
    console.log(err);
    res.status(400).send(err.messages);
  }
});

module.exports = router;
