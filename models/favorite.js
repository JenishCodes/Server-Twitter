const mongoose = require("mongoose");
const { Tweet } = require("./tweet");
const { User } = require("./user");

const { ObjectId } = mongoose.Schema.Types;

const favoriteSchema = new mongoose.Schema(
  {
    author: {
      type: ObjectId,
      ref: "User",
      required: true,
    },
    tweet: {
      type: ObjectId,
      ref: "Tweet",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

favoriteSchema.post("save", async function (doc) {
  await Tweet.findByIdAndUpdate(doc.tweet, {
    $inc: { "public_metrics.like_count": 1 },
  });
  await User.findByIdAndUpdate(doc.author, {
    $inc: { favourites_count: 1 },
  });
});

favoriteSchema.post("findOneAndRemove", async function (doc) {
  await Tweet.findByIdAndUpdate(doc.tweet, {
    $inc: { "public_metrics.like_count": -1 },
  });
  await User.findByIdAndUpdate(doc.author, {
    $inc: { favourites_count: -1 },
  });
});

const Favorite = mongoose.model("Favorite", favoriteSchema);

exports.Favorite = Favorite;
