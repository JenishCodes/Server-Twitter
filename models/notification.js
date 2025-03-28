const mongoose = require("mongoose");
const { Setting } = require("./setting");

const { ObjectId } = mongoose.Schema.Types;

const notificationSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: true,
    },
    user: {
      type: ObjectId,
      ref: "User",
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    seen: {
      type: Boolean,
      default: false,
    },
    action: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.pre("validate", async function (next) {
  var userSettings;

  if (mongoose.isValidObjectId(this.user)) {
    userSettings = await Setting.findOne({ user_id: this.user });
  } else {
    userSettings = await Setting.findOne({ username: this.user });
  }

  this.user = userSettings.user_id;

  if (
    userSettings.followNotification &&
    this.message.includes("following you")
  ) {
    next();
  } else if (
    userSettings.replyNotification &&
    this.message.includes("replied to your")
  ) {
    next();
  } else if (
    userSettings.mentionNotification &&
    this.message.includes("mentioned you in")
  ) {
    next();
  } else {
    next(new Error("Notification not allowed"));
  }
});

const Notification = mongoose.model("Notification", notificationSchema);

exports.Notification = Notification;
