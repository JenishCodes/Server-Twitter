const { Favorite } = require("../models/favorite");
const { Notification } = require("../models/notification");
const { Tweet } = require("../models/tweet");
const { User } = require("../models/user");
const userController = require("./userController");
const { ObjectId } = require("mongoose").Types;

exports.searchTweets = async function (query, page) {
  const results = await Tweet.find({
    text: {
      $regex: new RegExp(query, "i"),
    },
    "referenced_tweet.type": { $ne: "retweet" },
  })
    .select({ _id: 1 })
    .skip(page)
    .limit(10)
    .transform((docs) => docs.map((doc) => doc._id));

  const data = await exports.getTweets({ _id: { $in: results } });

  return { data, hasMore: data.length === 10 };
};

exports.deleteTweet = async function (tweet_id, author_id) {
  var tweet;
  if (author_id) {
    tweet = await Tweet.findOneAndRemove({
      author: ObjectId(author_id),
      "referenced_tweet.type": "retweet_of",
      "referenced_tweet.id": tweet_id,
    });
    return;
  } else {
    tweet = await Tweet.findOneAndRemove({ _id: ObjectId(tweet_id) });
  }

  const retweets = await Tweet.find({
    "referenced_tweet.type": "retweet_of",
    "referenced_tweet.id": tweet_id,
  });
  await Promise.all(
    retweets.map(async (retweet) => {
      await Tweet.findOneAndRemove({ _id: retweet._id });
    })
  );

  const favorites = await Favorite.find({
    tweet: tweet_id,
  });
  await Promise.all(
    favorites.map(async (favorite) => {
      await Favorite.findOneAndRemove({ _id: favorite._id });
    })
  );

  return tweet.media;
};

exports.createTweet = async function (tweetData) {
  const { replyTo, ...data } = tweetData;

  const tweet = new Tweet(data);

  await tweet.save();

  const { account_name } = await User.findById(tweet.author, "account_name");

  var reference_tweet;
  if (tweet.referenced_tweet.length > 0) {
    reference_tweet = tweet.referenced_tweet[tweet.referenced_tweet.length - 1];

    if (reference_tweet.type === "replied_to") {
      await Tweet.findByIdAndUpdate(reference_tweet.id, {
        $inc: { "public_metrics.reply_count": 1 },
      });

      const replyNotification = new Notification({
        message: `${account_name} replied to your tweet`,
        user: replyTo,
        action: "/" + account_name + "/status/" + tweet._id,
      });

      await replyNotification.save({ validateBeforeSave: false });
    } else {
      await Tweet.findByIdAndUpdate(reference_tweet.id, {
        $inc: { "public_metrics.retweet_count": 1 },
      });

      return tweet._id;
    }
  }

  if (tweet.entities.mentions.length > 0) {
    await Promise.all(
      tweet.entities.mentions.map(async (mention) => {
        const mentionNotification = new Notification({
          message: `${account_name} mentioned you in a tweet`,
          user: mention.account_name,
          action: "/" + account_name + "/status/" + tweet._id,
        });

        await mentionNotification.save({ validateBeforeSave: false });
      })
    );
  }

  return tweet._id;
};

exports.getTweetReplies = async function (tweet_id, user_id, page) {
  var userReplies = [];

  if (page === 0 || user_id) {
    userReplies = await Tweet.find({
      author: ObjectId(user_id),
      $expr: {
        $and: [
          {
            $eq: [
              { $arrayElemAt: ["$referenced_tweet.type", -1] },
              "replied_to",
            ],
          },

          {
            $eq: [
              { $arrayElemAt: ["$referenced_tweet.id", -1] },
              ObjectId(tweet_id),
            ],
          },
        ],
      },
    })
      .sort({ createdAt: -1 })
      .populate("author", "name account_name auth_id profile_image_url");
  }

  const replies = await Tweet.find({
    author: { $ne: user_id ? ObjectId(user_id) : null },
    $expr: {
      $and: [
        {
          $eq: [{ $arrayElemAt: ["$referenced_tweet.type", -1] }, "replied_to"],
        },
        {
          $eq: [
            { $arrayElemAt: ["$referenced_tweet.id", -1] },
            ObjectId(tweet_id),
          ],
        },
      ],
    },
  })
    .sort({ createdAt: -1 })
    .skip(page)
    .limit(10)
    .populate("author", "name account_name auth_id profile_image_url");

  return { data: [...userReplies, ...replies], hasMore: replies.length === 10 };
};

exports.getTweetReferences = async function (tweet_id) {
  const referenced_tweets = await Tweet.findById(tweet_id, "referenced_tweet")
    .populate("referenced_tweet.id")
    .transform(function (doc) {
      const { referenced_tweet } = doc._doc;
      const newRefTweets = referenced_tweet.map((ref) => {
        return { type: ref.type, ...(ref.id ? ref.id._doc : null) };
      });
      return newRefTweets;
    });

  const data = await Promise.all(
    referenced_tweets.map(async (reference) => {
      if (reference && reference.author) {
        const ref_tweet_author = await userController.getUser(
          "_id",
          reference.author,
          "name account_name auth_id profile_image_url"
        );

        return { ...reference, author: ref_tweet_author };
      } else {
        return null;
      }
    })
  );

  return data;
};

exports.getTweet = async function (tweet_id, fields, include = null) {
  const data = await Tweet.findById(tweet_id, fields)
    .populate("author", "name account_name auth_id profile_image_url")
    .populate(include);

  return data;
};

exports.getTweets = async function (condition, page, fields) {
  var tweets = await Tweet.find(condition)
    .sort({ createdAt: -1 })
    .skip(page)
    .limit(10)
    .populate("author", fields)
    .populate("referenced_tweet.id")
    .transform(function (docs) {
      return docs.map((doc) => {
        const { referenced_tweet, ...restDoc } = doc._doc;
        const newRefTweets = referenced_tweet.map((ref) => {
          return { type: ref.type, ...(ref.id ? ref.id._doc : null) };
        });
        return {
          ...restDoc,
          referenced_tweet: newRefTweets,
        };
      });
    });

  const res = await Promise.all(
    tweets.map(async (tweet) => {
      if (tweet.referenced_tweet.length === 0) {
        return tweet;
      } else {
        const { author, ...restRef } =
          tweet.referenced_tweet[tweet.referenced_tweet.length - 1];

        const ref_user = await userController.getUser("id", author, fields);

        const refTweet = { author: ref_user, ...restRef };

        if (restRef.type === "replied_to") {
          return {
            ...tweet,
            message:
              "Repling to " + (ref_user ? "@" + ref_user.account_name : ""),
            referenced_tweet: tweet.referenced_tweet,
          };
        } else {
          return {
            ...refTweet,
            message: tweet.author.account_name + " Retweeted",
          };
        }
      }
    })
  );

  return res;
};

exports.getTweetRetweeters = async function (tweet_id, page) {
  const data = await Tweet.find({
    "referenced_tweet.type": "retweet_of",
    "referenced_tweet.id": ObjectId(tweet_id),
  })
    .skip(parseInt(page))
    .limit(10)
    .populate(
      "author",
      "name account_name auth_id profile_image_url description"
    )
    .transform((docs) => docs.map((doc) => doc._doc.author));

  return { data, hasMore: data.length === 10 };
};

exports.isRetweeter = async function (tweet_id, user_id) {
  const data = await Tweet.findOne({
    author: ObjectId(user_id),
    "referenced_tweet.type": "retweet_of",
    "referenced_tweet.id": ObjectId(tweet_id),
  });

  return data ? true : false;
};

exports.updateTweetDetails = async function (tweet_id, newData) {
  await Tweet.findByIdAndUpdate(tweet_id, newData);

  return true;
};
