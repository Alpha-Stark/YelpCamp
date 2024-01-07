// Done npm init -y, npm i express mongoose ejs method-override. And at the end we also installed joi (which is a JS validator, and not a client-side/brower validate, beacuse its already handeled off, but not this)
const express = require("express");
const app = express();
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const path = require("path");
const mongoose = require("mongoose");
const Campground = require("./models/campground");
const ExpressError = require("./utils/ExpressError");
const catchAsync = require("./utils/catchAsync");
// const Joi = require("joi"); //No longer needed, because main use will be in schemas.js file
const { campgroundSchema, reviewsSchema } = require("./schemas"); //destructored it because we will need to import multiple validation schemas in future
const Review = require("./models/review");

// New/Smarter Way, people always keep mongoose website(i.e., https://mongoosejs.com/) to copy the connection url/code block, so no need to worry.
main().catch((err) => console.log(err));
async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/yelp-camp");
  console.log("MONGO Connection Successful, Now open to work!!!!!");
  // use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/movieApp');` if your database has auth enabled
}

app.engine("ejs", ejsMate); // this line tells express to use this insted of the default one it's relaying on.
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

const validateCampground = (req, res, next) => {
  // now we will pass our data through the schema to be/get validated. We then also store it error specific portion to a destructured variable.
  const { error } = campgroundSchema.validate(req.body);
  console.log(error);
  if (error) {
    //this is because if there will be no error then in object, there will only be only value property in it and not error property. Eg: {value:{campground:{title:'mann',price:1}}}. Otherwise.......: {value:{campground:{title:'mann',price:'-2'}},error:[Error[ValidationError]:"campground.price" must be greater than or equal to 0]{_original:{campground:[Object]},details:[[Object]]}}
    const msg = error.details.map((el) => el.message).join(","); //this will find message and .join will join messages with ',' if there will be multiple
    throw new ExpressError(msg, 400); //by this we can just(immediatly) throw stopage/error. Which can be then handeled by something else, we dont know.
  } else {
    next(); //if everything will be good but without this, we wont be able to move forware/ go to main function to be executed, as this is a middleware, we must use next().
  }
  // So by this even by trying througn postman type outsider, the data will not reach to mongoose, but before it will be show error, and then the wrapped catchAsync function will this error to error handler middelware, which will display red box on browser.
}; //And we can add this middleware at the selective places where we want to, in as an argument.

const validateReview = (req, res, next) => {
  const { error } = reviewsSchema.validate(req.body);
  if (error) {
    const msg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(msg, 400);
  } else {
    next();
  }
};

app.get("/", (req, res) => {
  res.render("home");
});

app.get(
  "/campgrounds",
  catchAsync(async (req, res) => {
    const campgrounds = await Campground.find({});
    res.render("campgrounds/index", { campgrounds });
  })
);

app.get("/campgrounds/new", (req, res) => {
  res.render("campgrounds/new");
}); //*****this cannot be put under the /campgrounds/:id section, otherwise it will mess things up and try to find an id with value new, so always make sure order is importent.

app.get(
  "/campgrounds/:id",
  catchAsync(async (req, res) => {
    // const { id } = req.params;
    const campground = await Campground.findById(req.params.id).populate("reviews");
    res.render("campgrounds/show", { campground });
  })
);

app.post(
  "/campgrounds",
  validateCampground,
  catchAsync(async (req, res) => {
    // const c = await Campground.insertMany([{ title: title, location: location }]);
    // if (!req.body.campground) throw new ExpressError("Invalid Campground Data", 400);
    // This will give error where there is no element in the body. But if there is even one, while on postmen, it will insert that data.

    const c = new Campground(req.body.campground);
    await c.save();
    res.redirect(`/campgrounds/${c._id}`);
  })
);

app.get(
  "/campgrounds/:id/edit",
  catchAsync(async (req, res) => {
    // const { id } = req.params;
    const campground = await Campground.findById(req.params.id);
    res.render("campgrounds/edit", { campground });
  })
);

app.put(
  "/campgrounds/:id",
  validateCampground,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const { title, location } = req.body.campground;
    console.log(req.body.campground);
    // const updatedground = await Campground.findByIdAndUpdate(id, {title, location}, {runValidators: true, new: true,});
    // const updatedground = await Campground.findByIdAndUpdate(id,req.body.campground,{runValidators: true,new: true,});
    const updatedground = await Campground.findByIdAndUpdate(id, { ...req.body.campground }, { runValidators: true, new: true });
    // console.log(updatedground);
    res.redirect(`/campgrounds/${id}`);
  })
);

app.delete(
  "/campgrounds/:id",
  catchAsync(async (req, res) => {
    const { id } = req.params;
    await Campground.findByIdAndDelete(id);
    res.redirect("/campgrounds");
  })
);

app.post(
  "/campgrounds/:id/reviews",
  validateReview,
  catchAsync(async (req, res) => {
    // res.send("we made ittt!");
    const review = new Review(req.body.review); //because inside form name, everything is inside review[].
    const data = await review.save();
    const camp = await Campground.findById(req.params.id);
    camp.reviews.push(data); //we dont need to manually put in the id. Mongoose will do it for us.
    await camp.save();
    res.redirect(`/campgrounds/${req.params.id}`);
  })
);

app.delete(
  "/campgrounds/:id/reviews/:reviewId",
  catchAsync(async (req, res) => {
    const { id, reviewId } = req.params;
    await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    /** idk why but this order matter! of first removing from campground and then only from reviews collection. Ans: When you call findByIdAndUpdate with the $pull operator, it first retrieves the document and then removes the specified element from the array. However, the document is still locked until the update is finished. This means that the findByIdAndDelete operation on the same reviewId will be blocked until the update is complete. 
    ///The correct order is to first update the Campground document with the $pull operator to remove the reviewId element from the reviews array. This ensures that the element is removed from the array before the actual review document is deleted. By doing so, you avoid the "StaleVersionError" and successfully remove both the reference and the actual review document.
    means apply pull, and pull from the reviews array where we have the specific "reviewId". 
    In our case, we must use findByIdAndUpdate(), because we are updating the data in the one go. Not first fetching and then doing other things with that response data. 
    Or we can also say that, pull the data 'reviewId' out of the field 'reviews'. $pull is specifically used for removing an element from an array only. Refer docs for more understanging(https://www.mongodb.com/docs/manual/reference/operator/update/pull/). */
    res.redirect(`/campgrounds/${id}`);
  })
);

app.all("*", (req, res, next) => {
  // res.send("404!!!");
  next(new ExpressError("Page Not Found!!!", 404));
});

app.use((err, req, res, next) => {
  // res.send("OHHH!!BOYYY!!Something went Wrong");
  // const { message = "Something Went Wrong!!!", statusCode = 500 } = err;
  // res.status(statusCode).send(message);
  const { statusCode = 500 } = err;
  if (!err.message) err.message = "Something Went Wrong";
  res.status(statusCode).render("error", { err });
});

app.listen(9090, () => {
  console.log("SERVING ON PORT 9090!!!!!");
});
