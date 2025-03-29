const { Favorite } = require("../models/favorite");
const { Friendship } = require("../models/friendship");
const { History } = require("../models/history");
const { Setting } = require("../models/setting");
const { Tweet } = require("../models/tweet");
const { User } = require("../models/user");
const tweetController = require("./tweetController");
const { ObjectId } = require("mongoose").Types;

exports.updateUserDetails = async function (user_id, newData) {
  return await User.findByIdAndUpdate(user_id, newData);
};

exports.signinAnonymously = function () {
  return User.generateAnonymousAuthToken();
};

exports.signin = async function (credential, password) {
  var user = await User.findOne({ account_name: credential }).select(
    "+password"
  );
  if (!user) {
    user = await User.findOne({ email: credential }).select("+password");

    if (!user) {
      throw new Error("Invalid credentials");
    }
  }

  const isPasswordValid = await user.verifyPassword(password);
  if (!isPasswordValid) {
    throw new Error("Invalid credentials");
  }

  const settings = await Setting.findOne({ user_id: user._id });

  const token = user.generateAuthToken();
  return { user: { ...user._doc, settings, password: null }, token };
};

exports.getUser = async function (key, value, fields, include = null) {
  if (key === "id") {
    const data = await User.findById(value, fields).populate(include);
    return data;
  } else {
    const data = await User.findOne({ [key]: value }, fields).populate(include);
    return data;
  }
};

exports.getUsers = async function (condition) {
  const data = await User.find(condition);

  return data;
};

exports.searchUsers = async function (query, page, limit, deep_search) {
  query = query.replace("@", "");

  const data = await User.find(
    {
      $or: [
        { account_name: { $regex: new RegExp("^" + query + ".*") } },
        { name: { $regex: new RegExp(query, "i") } },
        {
          description: {
            $regex: new RegExp(deep_search === "true" ? query : "@@", "i"),
          },
        },
      ],
    },
    "name auth_id account_name profile_image_url description"
  )
    .skip(parseInt(page))
    .limit(limit);

  return { data, hasMore: data.length === limit };
};

exports.getUserSettings = async function (user_id) {
  const data = await Setting.findOne({ user_id: ObjectId(user_id) });

  return data;
};

exports.updateUserSettings = async function (user_id, newSettings) {
  await Setting.findOneAndUpdate(
    { user_id: ObjectId(user_id) },
    { $set: newSettings }
  );

  return true;
};

exports.getUserHistory = async function (user_id) {
  const data = await History.find({ user_id: ObjectId(user_id) }).sort({
    updatedAt: -1,
  });

  return data;
};

exports.updateUserHistory = async function (user_id, newHistoryData) {
  var data = await History.findOne({
    user_id: ObjectId(user_id),
    title: newHistoryData.title,
  });

  if (data) {
    data.updatedAt = Date.now();
  } else {
    data = new History(newHistoryData);
  }
  data.save();

  return data;
};

exports.deleteUserHistory = async function (user_id, delete_all) {
  if (delete_all === "true") {
    await History.deleteMany({ user_id: ObjectId(user_id) });
  } else {
    await History.findByIdAndDelete(user_id);
  }
  return true;
};

exports.isAccountNameAvailable = async function (account_name) {
  const data = await User.findOne({ account_name });

  return !data;
};

exports.updateAccountName = async function (user_id, account_name, password) {
  var user = await User.findOne({ account_name });
  if (user) {
    throw new Error("Account name already taken");
  }

  user = await User.findById(user_id).select("+password");

  const isPasswordValid = await user.verifyPassword(password);
  if (!isPasswordValid) {
    throw new Error("Invalid password");
  }

  user.account_name = account_name;
  await user.save();

  await Setting.findByIdAndUpdate(user_id, { username: account_name });

  return true;
};

exports.updateEmail = async function (user_id, email, password) {
  const mailFormat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  if (!email.match(mailFormat)) {
    throw new Error("Email is not valid");
  }

  var user = await User.findOne({ email });
  if (user) {
    throw new Error("Email is already in use");
  }

  user = await User.findById(user_id).select("+password");

  const isPasswordValid = await user.verifyPassword(password);
  if (!isPasswordValid) {
    throw new Error("Invalid password");
  }

  user.email = email;
  await user.save();

  return true;
};

exports.updatePassword = async function (user_id, oldPassword, newPassword) {
  var user = await User.findById(user_id).select("+password");

  const isPasswordValid = await user.verifyPassword(oldPassword);
  if (!isPasswordValid) {
    throw new Error("Invalid password");
  }

  user.password = newPassword;
  await user.save();

  return true;
};

exports.getUserTweets = async function (user_id, page) {
  var pinned_tweet;
  if (page == 0) {
    const user = await User.findById(user_id)
      .populate("pinned_tweet name account_name profile_image_url _id")
      .select("pinned_tweet");

    if (user.pinned_tweet) {
      pinned_tweet = {
        ...user.pinned_tweet._doc,
        author: { ...user._doc, pinned_tweet: null },
      };
    }
  }

  const data = await tweetController.getTweets(
    {
      _id: { $ne: ObjectId(pinned_tweet ? pinned_tweet._id : null) },
      author: ObjectId(user_id),
      referenced_tweet: { $size: 0 },
    },
    page,
    "name account_name profile_image_url auth_id"
  );

  if (pinned_tweet) {
    return { data: [pinned_tweet, ...data], hasMore: data.length === 10 };
  }

  return { data, hasMore: data.length === 10 };
};

exports.getUserReplies = async function (user_id, page) {
  const data = await tweetController.getTweets(
    { author: ObjectId(user_id), "referenced_tweet.type": "replied_to" },
    page,
    "name account_name profile_image_url auth_id"
  );

  return { data, hasMore: data.length === 10 };
};

exports.getUserRetweets = async function (user_id, page) {
  const data = await tweetController.getTweets(
    { author: ObjectId(user_id), "referenced_tweet.type": "retweet_of" },
    page,
    "name account_name profile_image_url auth_id"
  );

  return { data, hasMore: data.length === 10 };
};

exports.getUserMentions = async function (user_id, page) {
  const { account_name } = await User.findById(user_id, "account_name");

  const data = await tweetController.getTweets(
    {
      "entities.mentions.account_name": account_name,
      referenced_tweet: { $size: 0 },
    },
    page,
    "name account_name profile_image_url auth_id"
  );

  return { data, hasMore: data.length === 10 };
};

exports.getUserBookmarks = async function (user_id, page) {
  const user = await User.findById(user_id, "bookmarks");

  const data = await tweetController.getTweets(
    {
      _id: { $in: user.bookmarks },
    },
    page,
    "name account_name profile_image_url auth_id"
  );

  return { data, hasMore: data.length === 10 };
};

exports.createUser = async function (userData) {
  const user = new User(userData);
  await user.save();

  const settings = new Setting({
    user_id: user._id,
    username: user.account_name,
  });

  await settings.save();

  const token = user.generateAuthToken();

  return { user: { ...user._doc, settings }, token };
};

exports.getUserFeed = async function (user_id, page) {
  const { account_name } = await User.findById(user_id, "account_name");

  const followings = await Friendship.find({
    followed_by: ObjectId(user_id),
  })
    .select({ following: 1, _id: 0 })
    .populate("following")
    .transform(function (docs) {
      return docs.map((doc) => {
        return {
          _id: doc.following._id,
          account_name: doc.following.account_name,
        };
      });
    });

  const accountNames = [
    account_name,
    ...followings.map((following) => following.account_name),
  ];
  const following_ids = [
    user_id,
    ...followings.map((following) => following._id),
  ];

  const tweets = await Tweet.find(
    {
      author: { $in: following_ids },
      referenced_tweet: { $size: 0 },
    },
    "createdAt"
  ).transform(function (docs) {
    return docs.map((doc) => {
      return { ...doc._doc, message: "" };
    });
  });

  const retweets = await Tweet.find(
    {
      author: { $in: following_ids },
      "referenced_tweet.type": "retweet_of",
    },
    "createdAt referenced_tweet author -_id"
  ).transform(function (docs) {
    return docs.map((doc) => {
      const { referenced_tweet, author, ...restDoc } = doc._doc;
      const ref = referenced_tweet[referenced_tweet.length - 1];

      return {
        _id: ref.id,
        ...restDoc,
        message:
          author === user_id
            ? ""
            : accountNames[
                following_ids.findIndex(
                  (id) => id.toString() === author.toString()
                )
              ] + " Retweeted",
      };
    });
  });

  const replies = await Tweet.find(
    {
      author: { $in: following_ids },
      "referenced_tweet.type": "replied_to",
    },
    "createdAt referenced_tweet author"
  ).transform(function (docs) {
    return docs.map((doc) => {
      const { referenced_tweet, ...restDoc } = doc._doc;
      const refIds = referenced_tweet.map((ref) => ref.id);
      return {
        _id: restDoc._id,
        ref_tweet_ids: refIds,
        createdAt: restDoc.createdAt,
        message: "",
      };
    });
  });

  const liked_tweets = await Favorite.find(
    {
      author: { $in: following_ids },
    },
    "tweet author createdAt -_id"
  ).transform(function (docs) {
    return docs.map((doc) => {
      const { tweet, author, ...restDoc } = doc._doc;

      return {
        _id: tweet,
        ...restDoc,
        message:
          author === user_id
            ? ""
            : accountNames[
                following_ids.findIndex(
                  (id) => id.toString() === author.toString()
                )
              ] + " Liked",
      };
    });
  });

  const mentioned_tweets = await Tweet.find(
    {
      "entities.mentions.account_name": { $in: accountNames },
    },
    "createdAt entities"
  ).transform(function (docs) {
    return docs.map((doc) => {
      const { entities, ...restDoc } = doc._doc;
      return {
        ...restDoc,
        message: entities.mentions.find(
          (mention) => mention.account_name === account_name
        )
          ? "You are mentioned"
          : entities.mentions[0].account_name + " is mentioned",
      };
    });
  });

  const all_tweets = [
    ...tweets,
    ...retweets,
    ...replies,
    ...liked_tweets,
    ...mentioned_tweets,
  ];

  all_tweets.sort((a, b) => {
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const unique_tweets = [];

  all_tweets.forEach((tweet, index, self) => {
    var ind = true;
    for (var i = 0; i < self.length; i++) {
      if (i !== index) {
        if (self[i]._id.toString() === tweet._id.toString()) {
          if (self[i].ref_tweet_ids) {
            ind = false;
            break;
          } else if (tweet.ref_tweet_ids) {
            continue;
          } else if (index > i) {
            continue;
          } else {
            ind = false;
            break;
          }
        } else if (self[i].ref_tweet_ids) {
          if (
            self[i].ref_tweet_ids.find(
              (ref_tweet_id) => ref_tweet_id.toString() === tweet._id.toString()
            )
          ) {
            ind = false;
            break;
          }
        }
      }
    }

    if (ind) {
      unique_tweets.push(tweet);
    }
  });

  const pagedTweets = unique_tweets.slice(parseInt(page), parseInt(page) + 10);

  const ids = pagedTweets.map((tweet) => tweet._id);
  const ref_ids = [];

  pagedTweets.forEach((obj) => {
    if (obj.ref_tweet_ids) ref_ids.push(...obj.ref_tweet_ids);
  });

  var ref_tweets = await Tweet.find({ _id: { $in: ref_ids } }).populate(
    "author",
    "name account_name auth_id profile_image_url"
  );

  var final_tweets = await Tweet.find({ _id: { $in: ids } }).populate(
    "author",
    "name account_name auth_id profile_image_url"
  );

  var data = pagedTweets.map((obj) => {
    var tweet = final_tweets.find(
      (t) => t._id.toString() === obj._id.toString()
    );

    var ref_tweet = [];
    if (obj.ref_tweet_ids) {
      ref_tweet = obj.ref_tweet_ids.map((id) =>
        ref_tweets.find((t) => t._id.toString() === id.toString())
      );
    }

    return { ...tweet._doc, referenced_tweet: ref_tweet, message: obj.message };
  });

  return { data, hasMore: data.length === 10 };
};

exports.deleteUser = async function (user_id, password) {
  const user = await User.findById(user_id).select("+password");

  const isPasswordValid = await user.verifyPassword(password);
  if (!isPasswordValid) {
    throw new Error("Invalid password");
  }

  await user.remove();

  const tweeets = await Tweet.find({ author: ObjectId(user_id) });
  await Promise.all(
    tweeets.map(async (tweet) => {
      await tweetController.deleteTweet(tweet._id);
    })
  );

  const friendships = await Friendship.find({
    friendship_id: { $regex: new RegExp(user_id) },
  });
  await Promise.all(
    friendships.map(async (friendship) => {
      await Friendship.findOneAndRemove({ _id: friendship._id });
    })
  );

  const favorites = await Favorite.find({ author: ObjectId(user_id) });
  await Promise.all(
    favorites.map(async (favorite) => {
      await Favorite.findOneAndRemove({ _id: favorite._id });
    })
  );

  return {
    _id: user._id,
    banner_image_url: user.banner_image_url !== "",
    profile_image_url: !user.profile_image_url.includes(
      "default_profile_image.jpg"
    ),
  };
};

exports.getUserRecommendations = async function (user_id) {
  const map = new Map();

  const followings = await Friendship.find({
    followed_by: ObjectId(user_id),
  }).select("following -_id");

  const following_ids = followings.map((following) =>
    following.following.toString()
  );

  await Promise.all(
    following_ids.map(async (following_id) => {
      const second_followings = await Friendship.find({
        followed_by: ObjectId(following_id),
      }).select("following -_id");

      second_followings.forEach((s) => {
        if (
          !following_ids.includes(s.following.toString()) &&
          s.following.toString() !== user_id
        ) {
          if (map.has(s.following.toString())) {
            map.set(
              s.following.toString(),
              map.get(s.following.toString()) + 1
            );
          } else {
            map.set(s.following.toString(), 1);
          }
        }
      });
    })
  );

  if (map.size > 12) {
    const recommeandations = new Map([...map].sort((a, b) => b[1] - a[1]));
    return [...recommeandations.keys()].slice(0, 12);
  }

  const famous = await Friendship.aggregate([
    { $group: { _id: "$following", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    {
      $match: {
        $and: [
          { _id: { $ne: ObjectId(user_id) } },
          { _id: { $nin: following_ids.map((id) => ObjectId(id)) } },
          { _id: { $nin: Array.from(map.keys()).map((key) => ObjectId(key)) } },
          { count: { $gt: 0 } },
        ],
      },
    },
    { $limit: 10 - map.size },
  ]);

  famous.forEach((f) => map.set(f._id.toString(), f.count));

  return Array.from(map.keys());
};
