const mongoose = require("mongoose");
const { Hashtag } = require("./hashtag");
const { User } = require("./user");

const { ObjectId } = mongoose.Types;

const tweetSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      maxlength: 256,
    },
    author: {
      type: ObjectId,
      required: true,
      ref: "User",
    },
    reply_settings: {
      type: String,
      enum: ["everyone", "followings", "nobody"],
      default: "everyone",
    },
    media: {
      type: String,
      default: "",
    },
    entities: {
      hashtags: [
        {
          start: Number,
          end: Number,
          tag: String,
          _id: false,
        },
      ],
      urls: [
        {
          start: Number,
          end: Number,
          url: String,
          _id: false,
        },
      ],
      mentions: [
        {
          start: Number,
          end: Number,
          account_name: String,
          _id: false,
        },
      ],
    },
    public_metrics: {
      like_count: { type: Number, default: 0 },
      retweet_count: { type: Number, default: 0 },
      reply_count: { type: Number, default: 0 },
    },
    private_metrics: {
      detail_expands: { type: Number, default: 0 },
      profile_visits: { type: Number, default: 0 },
    },
    referenced_tweet: [
      {
        type: {
          type: String,
          enum: ["replied_to", "retweet_of", "quoated_from"],
        },
        id: {
          type: ObjectId,
          ref: "Tweet",
        },
        _id: false,
      },
    ],
  },
  { timestamps: true }
);

tweetSchema.post("save", async function (doc) {
  await User.findByIdAndUpdate(doc.author, {
    $inc: { tweets_count: 1 },
  });

  if (
    doc.referenced_tweet.length > 0 &&
    doc.referenced_tweet[doc.referenced_tweet.length - 1].type === "retweet_of"
  )
    return;

  if (doc.entities.hashtags.length > 0) {
    await Promise.all(
      doc.entities.hashtags.map(async (hashtag) => {
        await Hashtag.findOneAndUpdate(
          { tag: hashtag.tag },
          { tag: hashtag.tag, $addToSet: { tweets: doc._id } },
          { upsert: true }
        );
      })
    );
  }
});

tweetSchema.post("findOneAndRemove", async function (doc) {
  await User.findByIdAndUpdate(doc.author, {
    $inc: { tweets_count: -1 },
  });

  if (doc.referenced_tweet && doc.referenced_tweet.length > 0) {
    const reference = doc.referenced_tweet[doc.referenced_tweet.length - 1];

    if (reference.type === "replied_to") {
      await Tweet.findByIdAndUpdate(reference.id, {
        $inc: { "public_metrics.reply_count": -1 },
      });
    } else {
      await Tweet.findByIdAndUpdate(reference.id, {
        $inc: { "public_metrics.retweet_count": -1 },
      });

      return doc._id;
    }
  }

  if (doc.entities.hashtags.length > 0) {
    await Hashtag.updateMany(
      { tag: { $in: doc.entities.hashtags.map((hashtag) => hashtag.tag) } },
      { $pull: { tweets: doc._id } }
    );
  }

  return doc._id;
});

const Tweet = mongoose.model("Tweet", tweetSchema);

exports.Tweet = Tweet;
