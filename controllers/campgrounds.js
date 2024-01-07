const Campground = require("../models/campground");
const { cloudinary } = require("../cloudinary");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapBoxToken });

module.exports.index = async (req, res) => {
  const campgrounds = await Campground.find({});
  res.render("campgrounds/index", { campgrounds });
};

module.exports.renderNewForm = (req, res) => {
  res.render("campgrounds/new");
  //We could have just put up the isAuthenticated() condition here, but that only stops user to access the form, but the data still can be sent through AJAX or postman. So we defined a middleware. Actually do it in a seperate file, because we also need same thing in reviews file. And then just require it.
};

module.exports.showCampground = async (req, res) => {
  // const { id } = req.params;
  // const campground = await Campground.findById(req.params.id).populate("reviews").populate("author"); //But this .populate("author") is just for campgrounds and not the auther of the review.
  const campground = await Campground.findById(req.params.id)
    .populate({
      path: "reviews",
      populate: { path: "author" },
    })
    .populate("author");
  // This means populate all reviews(and inside of it, it's author too) on the cmpground's array.
  if (!campground) {
    req.flash("error", "Cannot find that Campground");
    return res.redirect("/campgrounds");
  }
  res.render("campgrounds/show", { campground });
};

module.exports.createCampground = async (req, res) => {
  // const c = await Campground.insertMany([{ title: title, location: location }]);
  // if (!req.body.campground) throw new ExpressError("Invalid Campground Data", 400);
  // This will give error where there is no element in the body. But if there is even one, while on postmen, it will insert that data.
  // req.files.map((f) => ({ url: f.path, filename: f.filename })); //The multer's upload middleware then add the 'file' attribute to the request and the rest of the body which is called body. Also a single or multiple file can be taken[depending on function .single() or .array()] and the name filled on the input tag is "image". Receive from it.! This middleware then add the 'file' attribute to the request and the rest of the body which is called body.
  const geoData = await geocoder
    .forwardGeocode({
      query: req.body.campground.location,
      limit: 1,
    })
    .send(); //never forget to add .send() and await keyword befor execution.
  const campground = new Campground(req.body.campground);
  campground.geometry = geoData.body.features[0].geometry;
  campground.images = req.files.map((f) => ({ url: f.path, filename: f.filename }));
  campground.author = req.user._id; //req.user is a part of auth.
  await campground.save();
  console.log(campground);
  req.flash("success", "Successfully Created a new Campgound.!");
  //**means if on other side, we want to show that some task is completed, then we will tell from here that it will be flash of "success" type and the message this "Successfully Created a new Campgound.!".
  res.redirect(`/campgrounds/${campground._id}`);
};

module.exports.renderEditForm = async (req, res) => {
  const { id } = req.params;
  const campground = await Campground.findById(id);
  if (!campground) {
    req.flash("error", "Cannot find that Campground");
    return res.redirect("/campgrounds");
  }
  res.render("campgrounds/edit", { campground });
};

module.exports.updateCampground = async (req, res) => {
  const { id } = req.params;
  const { title, location } = req.body.campground;
  // console.log(req.body.deleteImages);

  // const updatedground = await Campground.findByIdAndUpdate(id, {title, location}, {runValidators: true, new: true,});
  // const updatedground = await Campground.findByIdAndUpdate(id,req.body.campground,{runValidators: true,new: true,});
  const updatedground = await Campground.findByIdAndUpdate(id, { ...req.body.campground }, { runValidators: true, new: true });
  const imgs = req.files.map((f) => ({ url: f.path, filename: f.filename })); //we did this because we cannot add an array to the database array. We can add elemnts in database array but not an array directly. So we will assign this array to imgs variable and then in next line, spread it into elements using the "...___" operator.
  updatedground.images.push(...imgs);
  await updatedground.save();
  if (req.body.deleteImages) {
    for (const filename of req.body.deleteImages) {
      cloudinary.uploader.destroy(filename);
    } //After this we update our campground's DB data.
    //now we must remember we have to delete images from object and not the model.
    await updatedground.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages } } } }); //Here it is updateOne because whatever we are doing is in that one perticulate campground. So updateOne and the $pull is used to remove/pull out elements from an array[specifically].
    //***Now the query meaning: $Pull out(but what,) the 'images',by the matching the filename(in our instance), to that to which are present $in the req.body.deleteImages's array(because it only has filename, so need need to good further) END-QUERY.
  }
  console.log(updatedground);
  req.flash("success", "Successfully Updated the Campgound.!");
  res.redirect(`/campgrounds/${id}`);
};

module.exports.deleteCampground = async (req, res) => {
  const { id } = req.params;
  const campground = await Campground.findById(id);
  for (const img of campground.images) {
    cloudinary.uploader.destroy(img.filename);
  }
  await Campground.findByIdAndDelete(id);
  req.flash("success", "Successfully Deleted a Campgound.!");
  res.redirect("/campgrounds");
};
