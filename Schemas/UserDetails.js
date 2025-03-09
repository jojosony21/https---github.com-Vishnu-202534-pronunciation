const mongoose = require("mongoose");

const UserDetailSchema = new mongoose.Schema(
  {
    username: String,
    email: { type: String, unique: true },
    password: String,
    resetPasswordOTP: Number,
    profilePicId: mongoose.Schema.Types.ObjectId, // Reference to the GridFS file
  },
  {
    collection: "UserInfo",
  }
);

module.exports = mongoose.model("UserInfo", UserDetailSchema);
