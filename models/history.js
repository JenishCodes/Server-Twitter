const mongoose = require("mongoose");

const { ObjectId } = mongoose.Schema.Types;

const History = mongoose.model(
  "History",
  new mongoose.Schema(
    {
      user_id: {
        type: ObjectId,
        required: true,
        ref: "User",
      },
      title: {
        type: String,
        required: true,
      },
      subtitle: {
        type: String,
        default: null,
      },
      image_url: {
        type: String,
        default: null,
      },
    },
    {
      timestamps: true,
    }
  )
);

exports.History = History;
