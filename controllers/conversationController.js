const { Conversation } = require("../models/conversation");
const userController = require("./userController");

exports.getUserConversations = async function (user_id) {
  const conversations = await Conversation.find({
    conversationId: { $regex: new RegExp(user_id) },
  }).sort({
    updatedAt: -1,
  });

  const data = await Promise.all(
    conversations.map(async (conversation) => {
      const user = await userController.getUser(
        "id",
        conversation.conversationId.replace(user_id, "").replace("~", ""),
        "name account_name profile_image_url auth_id"
      );
      return {
        ...conversation._doc,
        user,
      };
    })
  );

  return data;
};

exports.getConversation = async function (conversation_id, user_id) {
  const conversation = await Conversation.findOne({
    conversationId: conversation_id,
  });

  const user = await userController.getUser(
    "id",
    conversation_id.replace(user_id, "").replace("~", ""),
    "name account_name profile_image_url auth_id description"
  );

  return {
    ...conversation ? conversation._doc : null,
    user,
  };
};

exports.updateConversationDetails = async function (condition, data) {
  await Conversation.findOneAndUpdate(
    condition,
    { ...data, condition },
    {
      upsert: true,
    }
  );
  return true;
};

exports.deleteConversation = async function (conversation_id) {
  await Conversation.findOneAndRemove({
    conversationId: conversation_id,
  });

  return true;
};
