const mongoose = require("mongoose");

const { ObjectId } = mongoose.Schema.Types;

const Hashtag = mongoose.model(
  "Hashtag",
  new mongoose.Schema({
    tag: {
      type: String,
      required: true,
      maxlength: 32,
      unique: true,
    },
    tweets: [
      {
        type: ObjectId,
        ref: "Tweet",
        _id: false,
      },
    ],
  })
);

exports.Hashtag = Hashtag;
