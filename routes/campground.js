const express = require("express");
const router = express.Router({ mergeParams: true }); //mergeParams, is must because otherwise because of breaking rooute/path-names, the :id in the path won't be accessible which are on the other side [req.params.id], and not available in the modified path-name. Hence,{ mergeParams: true } is must to resolve the null error.

const Campground = require("../models/campground");

const catchAsync = require("../utils/catchAsync");
const { isLoggedIn, validateCampground, isAuthor } = require("../middleware"); //never forget to destructure.

const campgrounds = require("../controllers/campgrounds");
const multer = require("multer");
// const upload = multer({ dest: "uploads/" }); //initialized the multer and the destination is set to /upload folder.
const { storage } = require("../cloudinary"); // no need to do /index, because Node automatically finds the index file.
const upload = multer({ storage }); //As seen before(2 lines), dont put in locally(upload/), insted store/upload it in the 'storage' of cloudinary

//We can link routes with: same path and different routes together using router.route method.

router
  .route("/")
  .get(catchAsync(campgrounds.index))
  // .post(isLoggedIn, validateCampground, catchAsync(campgrounds.createCampground));
  //   .post(
  //     upload.array("image"), //means a single or multiple file will be taken[depending on function .single() or .array()] and the name filled on the input tag is "image". Receive from it.! This middleware then add the 'file' attribute to the request and the rest of the body which is called body.
  //     (req, res) => {
  //       console.log(req.body, req.files); // if function upload.single()==>req.file or upload.array()==>req.files
  //       res.send("It WORKED!!!");
  //     }
  //   );
  .post(
    isLoggedIn,
    // validateCampground,
    upload.array("image"), //and this should be the value of name="" in ejs tempelete of input.
    catchAsync(campgrounds.createCampground)
  );

router.get("/new", isLoggedIn, campgrounds.renderNewForm); //*****this cannot be put under the /campgrounds/:id section, otherwise it will mess things up and try to find an id with value new, so always make sure order is importent.

router.route("/:id").get(catchAsync(campgrounds.showCampground)).put(isLoggedIn, isAuthor, upload.array("image"), validateCampground, catchAsync(campgrounds.updateCampground)).delete(isLoggedIn, catchAsync(campgrounds.deleteCampground));
//***so the sequence of the middleware, ofcourse too matter.

router.get("/:id/edit", isLoggedIn, isAuthor, catchAsync(campgrounds.renderEditForm));
//*****so the sequence of the middleware, ofcourse too matter, because the first we have to check if user loggedIn and then see if authorised.

module.exports = router;

/* //Older one
router.get("/", catchAsync(campgrounds.index));

router.get("/new", isLoggedIn, campgrounds.renderNewForm); //*****this cannot be put under the /campgrounds/:id section, otherwise it will mess things up and try to find an id with value new, so always make sure order is importent.

router.get("/:id", catchAsync(campgrounds.showCampground));

router.post("/", isLoggedIn, validateCampground, catchAsync(campgrounds.createCampground));
//***so the sequence of the middleware, ofcourse too matter.

router.get("/:id/edit", isLoggedIn, isAuthor, catchAsync(campgrounds.renderEditForm));
//*****so the sequence of the middleware, ofcourse too matter, because the first we have to check if user loggedIn and then see if authorised.

router.put("/:id", isLoggedIn, isAuthor, validateCampground, catchAsync(campgrounds.updateCampground));

router.delete("/:id", isLoggedIn, catchAsync(campgrounds.deleteCampground));

module.exports = router; */
