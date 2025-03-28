const { Message } = require("../models/message");
const conversationController = require("./conversationController");

exports.getConversationMessages = async function (conversation_id, page) {
  const data = await Message.find({ conversationId: conversation_id })
    .sort({
      createdAt: -1,
    })
    .skip(page)
    .limit(20);

  return { data: data.reverse(), hasMore: data.length === 20 };
};

exports.createMessage = async function (messageData) {
  const data = new Message(messageData);

  await data.save();

  await conversationController.updateConversationDetails(
    { conversationId: messageData.conversationId },
    { lastMessage: messageData.text }
  );

  return data;
};

exports.deleteMessage = async function (message_id) {
  const { conversationId, createdAt } = await Message.findById(message_id);

  const after = await Message.findOne({
    conversationId,
    createdAt: { $gt: createdAt },
  })
    .sort({ createdAt: 1 })
    .limit(1);

  if (!after) {
    const before = await Message.findOne({
      conversationId,
      createdAt: { $lt: createdAt },
    })
      .sort({ createdAt: -1 })
      .limit(1);

    await conversationController.updateConversationDetails(
      { conversationId },
      {
        lastMessage: before ? before.text : null,
      }
    );
  }

  await Message.findByIdAndDelete(message_id);

  return true;
};

exports.destroyMessages = async function (conversation_id) {
  await Message.deleteMany({ conversationId: conversation_id });
  return true;
};
