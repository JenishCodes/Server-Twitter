var mongoose = require("mongoose");
const { Message } = require("./message");

const conversationSchema = new mongoose.Schema(
  {
    conversationId: {
      type: String,
      required: true,
      unique: true,
    },
    lastMessage: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

conversationSchema.post("findOneAndRemove", async function (doc) {
  await Message.deleteMany({
    conversationId: doc.conversationId,
  });
});

const Conversation = mongoose.model("Conversation", conversationSchema);

exports.Conversation = Conversation;
