const { Friendship } = require("../models/friendship");
const userController = require("../controllers/userController");
const { ObjectId } = require("mongoose").Types;

exports.getFollowers = async function (account_name, page) {
  const user = await userController.getUser(
    "account_name",
    account_name,
    "_id"
  );

  const data = await Friendship.find({ following: ObjectId(user._id) })
    .select("followed_by -_id")
    .skip(page)
    .limit(10)
    .populate(
      "followed_by",
      "name account_name profile_image_url description auth_id"
    )
    .transform((docs) => docs.map((doc) => doc._doc.followed_by));

  return { data, hasMore: data.length === 10 };
};

exports.getFollowings = async function (account_name, page) {
  const user = await userController.getUser(
    "account_name",
    account_name,
    "_id"
  );

  const data = await Friendship.find({ followed_by: ObjectId(user._id) })
    .select("followed -_id")
    .skip(page)
    .limit(10)
    .populate(
      "following",
      "name account_name profile_image_url description auth_id"
    )
    .transform((docs) => docs.map((doc) => doc._doc.following));

  return { data, hasMore: data.length === 10 };
};

exports.createFriendship = async function (friendshipData) {
  var friendship = await Friendship.findOne({
    followed_by: ObjectId(friendshipData.followed_by),
    followed: ObjectId(friendshipData.followed),
  });

  if (friendship) {
    return true;
  }

  friendship = new Friendship(friendshipData);

  await friendship.save();

  return true;
};

exports.getFriendship = async function (friendship_id) {
  const data = await Friendship.findOne({
    friendship_id,
  });

  return data;
};

exports.deleteFriendship = async function (source_id, target_id) {
  await Friendship.findOneAndRemove({
    followed_by: ObjectId(source_id),
    following: ObjectId(target_id),
  });

  return true;
};

exports.getRelationship = async function (user1, user2) {
  const relation1 = await Friendship.findOne({
    followed_by: ObjectId(user1),
    following: ObjectId(user2),
  });

  const relation2 = await Friendship.findOne({
    followed_by: ObjectId(user2),
    following: ObjectId(user1),
  });

  if (relation1 && relation2) {
    return { relation: "friends", action: "Following" };
  } else if (relation1) {
    return { relation: "follower", action: "Following" };
  } else if (relation2) {
    return { relation: "following", action: "Follow Back" };
  } else {
    return { relation: "strangers", action: "Follow" };
  }
};
