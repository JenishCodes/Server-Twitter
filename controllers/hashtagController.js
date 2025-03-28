const { Hashtag } = require("../models/hashtag");
const tweetController = require("./tweetController");

exports.removeTweetFromHashtag = async function (tag, tweet_id) {
  await Hashtag.updateOne({ tag }, { $pull: { tweets: tweet_id } });
  return true;
};

exports.addTweetToHashtag = async function (tag, tweet) {
  await Hashtag.updateOne(
    { tag },
    { tag, $push: { tweets: tweet } },
    { upsert: true }
  );
  return true;
};

exports.searchHashtag = async function (query, page, limit) {
  if (query.charAt(0) === "#") {
    query = query.replace("#", "^") + ".*";
  }

  const data = await Hashtag.find({
    tag: { $regex: new RegExp(query, "i") },
  })
    .skip(page)
    .limit(limit)
    .select({ tag: 1, tweet_count: { $size: "$tweets" } });

  return { data, hasMore: data.length === limit };
};

exports.getHashtagTweets = async function (tag, page) {
  const hashtag = await Hashtag.findOne({ tag });

  if (hashtag) {
    const data = await tweetController.getTweets(
      { _id: { $in: hashtag.tweets } },
      page,
      "name account_name auth_id profile_image_url"
    );

    return { data, hasMore: data.length === 20 };
  } else {
    return { data: [], hasMore: false };
  }
};

exports.createHashtag = async function (hashtagData) {
  await Hashtag.create(hashtagData);

  return true;
};
