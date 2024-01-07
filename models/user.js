const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  //   password: String, // because username and password will be handeled by passportLocalMongoose
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);
