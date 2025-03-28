const { Notification } = require("../models/notification");
const { ObjectId } = require("mongoose").Types;

exports.createNotification = function (notificationData) {
  Notification.create(notificationData);

  return true;
};

exports.getUserNotifications = async function (user_id, page) {
  const data = await Notification.find({ user: ObjectId(user_id) })
    .sort({ createdAt: -1 })
    .skip(page)
    .limit(20);

  return { data, hasMore: data.length === 20 };
};

exports.markNotificationAsRead = async function (notification_id) {
  await Notification.findByIdAndUpdate(notification_id, {
    read: true,
  });

  return true;
};

exports.markAllNotificationsAsSeen = async function (user_id) {
  await Notification.updateMany(
    { user: ObjectId(user_id), seen: false },
    { $set: { seen: true } }
  );

  return true;
};

exports.getUnseenNotificationCount = async function (user_id) {
  const data = await Notification.countDocuments({
    user: ObjectId(user_id),
    seen: false,
  });

  return data;
};
