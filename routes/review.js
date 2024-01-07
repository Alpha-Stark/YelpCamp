const express = require("express");
const router = express.Router({ mergeParams: true }); //mergeParams, is must because otherwise because of breaking rooute/path-names, the :id in the path won't be accessible which are on the other side [req.params.id], and not available in the modified path-name. Hence,{ mergeParams: true } is must to resolve the null error.

const Review = require("../models/review");
const Campground = require("../models/campground");
const reviews = require("../controllers/reviews");

// const { validateReview } = require("../middleware");
// const { isLoggedIn } = require("../middleware");
const { isLoggedIn, validateReview, isReviewAuthor } = require("../middleware"); //************* Never forget to properly destructure the methods from other file's exports. It can make a very unpleasent mess. Instead make a rule of always destructuring and do every function in same line.
const ExpressError = require("../utils/ExpressError");
const catchAsync = require("../utils/catchAsync");

router.post("/", isLoggedIn, validateReview, catchAsync(reviews.createReview));
//**again order matters here, isLoggedIn must be checked before validateReview.

router.delete("/:reviewId", isLoggedIn, isReviewAuthor, catchAsync(reviews.deleteReview));

module.exports = router;
