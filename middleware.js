const { campgroundSchema, reviewsSchema } = require("./schemas");
const Campground = require("./models/campground");
const Review = require("./models/review");
const ExpressError = require("./utils/ExpressError");

module.exports.isLoggedIn = (req, res, next) => {
  //   console.log("REQ.USER...", req.user);
  // this methods[req.user or req.isAuthenticated()] comes from passport and added to req object.
  if (!req.isAuthenticated()) {
    //if not then store the url they are requesting, and after login, redirect them back to it.
    // console.log(req.path, req.originalUrl);
    req.session.returnTo = req.originalUrl; //now after a user logIn, if there is something inside session's returnTo, to redirect over there.
    /* due to some recent security improvements in the Passport.js version updates (used for authentication in our YelpCamp application), the session now gets cleared after a successful login. This causes a problem with our returnTo redirect logic because we store the returnTo route path (i.e., the path where the user should be redirected back after login) in the session (req.session.returnTo), which gets cleared after a successful login. */
    req.flash("error", "You must be Logged-In First.");
    return res.redirect("/login");
  }
  next();
};

//BugFix(Step-1):But due to passport security feature update, just after passport.authenticate() in "/login" route, the session values will be reset and the above set-ed req.session.returnTo will be cleared. Hence we now as a fix give this value to res.locals, to keep the 'returnTo's value persistent in our app.
module.exports.storeReturnTo = (req, res, next) => {
  if (req.session.returnTo) {
    res.locals.returnTo = req.session.returnTo;
  }
  next();
};

module.exports.validateCampground = (req, res, next) => {
  // now we will pass our data through the schema to be/get validated. We then also store it error specific portion to a destructured variable.
  const { error } = campgroundSchema.validate(req.body);
  // console.log(error);
  if (error) {
    //this is because if there will be no error then in object, there will only be only value property in it and not error property. Eg: {value:{campground:{title:'mann',price:1}}}. Otherwise.......: {value:{campground:{title:'mann',price:'-2'}},error:[Error[ValidationError]:"campground.price" must be greater than or equal to 0]{_original:{campground:[Object]},details:[[Object]]}}
    const msg = error.details.map((el) => el.message).join(","); //this will find message and .join will join messages with ',' if there will be multiple
    throw new ExpressError(msg, 400); //by this we can just(immediatly) throw stopage/error. Which can be then handeled by something else, we dont know.
  } else {
    next(); //if everything will be good but without this, we wont be able to move forware/ go to main function to be executed, as this is a middleware, we must use next().
  }
  // So by this even by trying througn postman type outsider, the data will not reach to mongoose, but before it will be show error, and then the wrapped catchAsync function will this error to error handler middelware, which will display red box on browser.
}; //And we can add this middleware at the selective places where we want to, in as an argument.

module.exports.isAuthor = async (req, res, next) => {
  const { id } = req.params;
  const campground = await Campground.findById(id);
  if (!campground.author.equals(req.user._id)) {
    req.flash("error", "You are not authorized to do so.!!!");
    return res.redirect(`/campgrounds/${id}`);
  } // this will avoid the someone to do editing from url or AJAX or Postman.
  next();
};

module.exports.isReviewAuthor = async (req, res, next) => {
  const { reviewId, id } = req.params;
  const review = await Review.findById(reviewId);
  if (!review.author.equals(req.user._id)) {
    req.flash("error", "You are not authorized to do so.!!!");
    return res.redirect(`/campgrounds/${id}`);
  } // this will avoid the someone to do editing from url or AJAX or Postman.
  next();
};

module.exports.validateReview = (req, res, next) => {
  const { error } = reviewsSchema.validate(req.body);
  if (error) {
    const msg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(msg, 400);
  } else {
    next();
  }
};
