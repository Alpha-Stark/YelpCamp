const Review = require("../models/review");
const Campground = require("../models/campground");

module.exports.createReview = async (req, res) => {
  const review = new Review(req.body.review); //because inside form name, everything is inside review[].
  review.author = req.user._id; //Setting the author with userId using req.user object .
  const data = await review.save();
  const camp = await Campground.findById(req.params.id);
  camp.reviews.push(data); //we dont need to manually put in the id. Mongoose will do it for us.
  await camp.save();
  req.flash("success", "Created a new Review.");
  //**means if on other side, we want to show that some task is completed, then we will tell from here that it will be flash of "success" type and the message this "Created a new Review.".
  res.redirect(`/campgrounds/${req.params.id}`);
};

module.exports.deleteReview = async (req, res) => {
  const { id, reviewId } = req.params;
  await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
  await Review.findByIdAndDelete(reviewId);
  /** idk why but this order matter! of first removing from campground and then only from reviews collection. Ans: When you call findByIdAndUpdate with the $pull operator, it first retrieves the document and then removes the specified element from the array. However, the document is still locked until the update is finished. This means that the findByIdAndDelete operation on the same reviewId will be blocked until the update is complete. 
        ///The correct order is to first update the Campground document with the $pull operator to remove the reviewId element from the reviews array. This ensures that the element is removed from the array before the actual review document is deleted. By doing so, you avoid the "StaleVersionError" and successfully remove both the reference and the actual review document.
        means apply pull, and pull from the reviews array where we have the specific "reviewId". 
        In our case, we must use findByIdAndUpdate(), because we are updating the data in the one go. Not first fetching and then doing other things with that response data. 
        Or we can also say that, pull the data 'reviewId' out of the field 'reviews'. $pull is specifically used for removing an element from an array only. Refer docs for more understanging(https://www.mongodb.com/docs/manual/reference/operator/update/pull/). */
  req.flash("success", "Deleted a Review");
  res.redirect(`/campgrounds/${id}`);
};
