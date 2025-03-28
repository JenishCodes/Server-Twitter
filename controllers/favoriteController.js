const { Favorite } = require("../models/favorite");
const tweetController = require("./tweetController");
const { ObjectId } = require("mongoose").Types;

exports.destoryFavorites = async function (tweet) {
  const favorites = await Favorite.find({ tweet: ObjectId(tweet) });

  await Promise.all(
    favorites.map(async (favorite) => {
      await Favorite.findOneAndRemove({ _id: favorite._id });
    })
  );

  return true;
};

exports.deleteFavorite = async function (tweet, author) {
  await Favorite.findOneAndRemove({
    author: ObjectId(author),
    tweet: ObjectId(tweet),
  });

  return true;
};

exports.isFavorite = async function (tweet, user) {
  const data = await Favorite.findOne({
    tweet: ObjectId(tweet),
    author: ObjectId(user),
  });

  return data ? true : false;
};

exports.getFavoriters = async function (tweet, page) {
  const data = await Favorite.find({ tweet: ObjectId(tweet) })
    .skip(page)
    .limit(10)
    .select("author -_id")
    .populate("author")
    .transform((docs) => docs.map((doc) => doc._doc.author));

  return { data, hasMore: data.length === 10 };
};

exports.getFavorites = async function (user, page) {
  const tweets = await Favorite.find({ author: ObjectId(user) })
    .skip(page)
    .limit(10)
    .select("tweet -_id")
    .transform((docs) => docs.map((doc) => doc._doc.tweet));

  const data = await tweetController.getTweets(
    { _id: { $in: tweets } },
    0,
    "name account_name profile_image_url auth_id"
  );

  return { data, hasMore: data.length === 10 };
};

exports.createFavorite = async function (favoriteData) {
  var favorite = await Favorite.findOne({
    author: ObjectId(favoriteData.author),
    tweet: ObjectId(favoriteData.tweet),
  });

  if (favorite) {
    return true;
  }

  favorite = new Favorite(favoriteData);

  await favorite.save();

  return true;
};
