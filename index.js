const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const socket = require("socket.io");
const users = require("./routes/users");
const tweets = require("./routes/tweets");
const hashtags = require("./routes/hashtags");
const favorites = require("./routes/favorites");
const messages = require("./routes/messages");
const conversations = require("./routes/conversations");
const friendships = require("./routes/friendships");
const notifications = require("./routes/notifications");
const app = express();
require("dotenv").config();

app.use(express.json());
app.use(cors());

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDb..."))
  .catch((err) => console.log(err));

app.get("/", (_, res) => {
  res.send("Welcome to Twitter API");
});

app.use("/user", users);
app.use("/tweet", tweets);
app.use("/hashtag", hashtags);
app.use("/favorite", favorites);
app.use("/friendship", friendships);
app.use("/message", messages);
app.use("/conversation", conversations);
app.use("/notification", notifications);

const server = app.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}...`)
);

const io = socket(server, {
  cors: {
    origin: "*",
    credential: true,
  },
});

global.onlineUsers = new Map();

io.on("connection", (socket) => {
  socket.on("user-added", (userId) => {
    onlineUsers.set(userId, socket.id);
  });

  socket.on("message-sent", (data) => {
    const receiverId = onlineUsers.get(data.receiver);
    if (receiverId) {
      socket.to(receiverId).emit("message-received", data);
    }
  });
});
