const mongoose = require("mongoose");

const { ObjectId } = mongoose.Schema.Types;

const Setting = mongoose.model(
  "Setting",
  new mongoose.Schema({
    canTag: {
      type: Boolean,
      default: true,
    },
    canMessage: {
      type: Boolean,
      default: true,
    },
    autoLoadImages: {
      type: Boolean,
      default: true,
    },
    followNotification: {
      type: Boolean,
      default: true,
    },
    replyNotification: {
      type: Boolean,
      default: true,
    },
    mentionNotification: {
      type: Boolean,
      default: true,
    },
    user_id: {
      type: ObjectId,
      ref: "User",
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
  })
);

exports.Setting = Setting;
