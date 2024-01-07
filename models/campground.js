const mongoose = require("mongoose");
const Review = require("./review");
const Schema = mongoose.Schema;

const ImageSchema = new Schema({
  url: String,
  filename: String,
});
ImageSchema.virtual("thumbnail").get(function () {
  return this.url.replace("/upload", "/upload/w_200"); //here this refers to
}); // hence on otherside/tempelete we will have a property called .thumbnail() available.
//We use virtual property because we dont wanna store the updated url part on our model or in our DataBase, because it's just derived from the information we've alread stored.

/** But the passed campgorund object to the clusterMap.js will not have it. Because after JSON.stringify(campgrounds), because by default, Mongoose does not include virtuals when you convert a document to JSON.  
Hence we follow the Docs(https://mongoosejs.com/docs/tutorials/virtuals.html#virtuals-in-json). And the step according to the docs in as below to even include virtuals in JSON. */

const opts = { toJSON: { virtuals: true } };
const CampgroundSchema = new Schema(
  {
    title: String,
    // image: String,
    images: [ImageSchema],
    price: Number,
    description: String,
    location: String,
    //GeoJSON docs ref:(https://mongoosejs.com/docs/geojson.html)
    geometry: {
      type: {
        type: String, // Don't do `{ location: { type: String } }`
        enum: ["Point"], // 'location.type' must be 'Point'
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    reviews: [
      {
        type: Schema.Types.ObjectId,
        ref: "Review",
      },
    ],
  },
  opts //put it after the full schema object.
);

CampgroundSchema.virtual("properties.popUpMarkup").get(function () {
  // return "I AM POP UP TEXT";
  return `<strong><a href="/campgrounds/${this._id}">${this.title}</a></strong>
  <p>${this.description.substring(0, 25)}...</p>`;
}); //**We did this because the mapbox only finds data in nested properties object. {.., .., properties:{ourData}}, but there is a problem, and it is solved by including opts in schema, as mentioned just before creating the campground schema

CampgroundSchema.post("findOneAndDelete", async function (doc) {
  //now why did we do this, because on the app.js, for deleting campground, we used findByIdAndDelete() method and according to docs(https://mongoosejs.com/docs/api/model.html#Model.findByIdAndDelete()), this method can only hit one middleware and we must follow it. And that is, findOneAndDelete()
  // console.log("DELETED!!!", doc);
  if (doc.reviews) {
    await Review.deleteMany({
      _id: {
        $in: doc.reviews, //means delete all '_id's [document itself] which are $in the doc.reviews array. The method remove() is discarded from the mongoose after V6, so its alternative is deleteMany().
      },
    });
  }
}); //and also this must be defined before writing the code for making a model.

module.exports = mongoose.model("Campground", CampgroundSchema); //Exported the model
