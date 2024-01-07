const express = require("express");
const router = express.Router();
const User = require("../models/user");
const users = require("../controllers/users");

const passport = require("passport");
const ExpressError = require("../utils/ExpressError");
const catchAsync = require("../utils/catchAsync");
const { storeReturnTo } = require("../middleware"); //never forget to destructure them. Never Ever, because its too tough to then track the error.

router.route("/register").get(users.renderRegisterForm).post(catchAsync(users.registerUser));

router
  .route("/login")
  .get(users.renderLoginForm)
  .post(storeReturnTo, passport.authenticate("local", { failureFlash: true, failureRedirect: "/login" }), users.loginUser);
//here we will use the magic of passport, as it gives us the middleware to authenticate. In this we can use strategy like "local", (in between we can setup a route to login with google), and at the end the options{}.
/** BugFix(Step-2): Call the storeReturnTo middleware function before passport.authenticate(). Remember that middleware functions are executed in the order they are specified in the route. So, in this case, storeReturnTo should be called first, followed by passport.authenticate() and then the final middleware function to redirect the user. */
//For storeReturnTo =>>>>> we used the storeReturnTo middleware to save the returnTo value from session to res.locals
// passport.authenticate() logs the user in and clears req.session now, but we wont have any issue because we applied storeReturnTo middleware.

router.get("/logout", users.deleteUser);

module.exports = router;
