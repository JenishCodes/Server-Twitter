const mongoose = require("mongoose");
const { Notification } = require("./notification");
const { User } = require("./user");

const { ObjectId } = mongoose.Schema.Types;

const friendshipSchema = new mongoose.Schema({
  blocking: {
    type: Boolean,
    default: false,
  },
  friendship_id: {
    type: String,
    required: true,
  },
  followed_by: {
    type: ObjectId,
    ref: "User",
    required: true,
  },
  following: {
    type: ObjectId,
    ref: "User",
    required: true,
  },
});

friendshipSchema.post("save", async function (doc) {
  const { account_name } = await User.findById(doc.followed_by, "account_name");

  const notification = new Notification({
    message: account_name + " is now following you",
    user: doc.following,
    action: "/" + account_name,
  });

  await notification.save();

  await User.findByIdAndUpdate(doc.following, {
    $inc: { followers_count: 1 },
  });
  await User.findByIdAndUpdate(doc.followed_by, {
    $inc: { following_count: 1 },
  });
});

friendshipSchema.post("findOneAndRemove", async function (doc) {
  await User.findByIdAndUpdate(doc.following, {
    $inc: { followers_count: -1 },
  });
  await User.findByIdAndUpdate(doc.followed_by, {
    $inc: { following_count: -1 },
  });
});

const Friendship = mongoose.model("Friendship", friendshipSchema);

exports.Friendship = Friendship;
