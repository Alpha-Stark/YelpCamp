const mongoose = require("mongoose");
const Campground = require("../models/campground");
const cities = require("./cities");
const { descriptors, places } = require("./seedHelpers");
// New/Smarter Way, people always keep mongoose website(i.e., https://mongoosejs.com/) to copy the connection url/code block, so no need to worry.
main().catch((err) => console.log(err));
async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/yelp-camp");
  console.log("MONGO Connection Successful, Now open to work!!!!!");
  // use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/movieApp');` if your database has auth enabled
}

const sample = (arr) => arr[Math.floor(Math.random() * arr.length)];
//will find a randon element from given array

// console.log(descriptors, places);

const seedDB = async () => {
  await Campground.deleteMany({});
  for (let i = 0; i < 300; i++) {
    const random1000 = Math.floor(Math.random() * 1000);
    const price = Math.floor(Math.random() * 20) + 10;
    const c = new Campground({
      //Your USER ID
      author: "657b29ef46a33288154e1b16",
      location: `${cities[random1000].city}, ${cities[random1000].state}`,
      title: `${sample(descriptors)} ${sample(places)}`,
      // image: "http://source.unsplash.com/collection/484351",
      description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Hic beatae optio ea rerum temporibus, dolore quae impedit natus dolorem eius doloribus sapiente reprehenderit sequi et corporis facilis eaque quod deleniti.",
      // price: price,
      price,
      geometry: {
        type: "Point",
        coordinates: [cities[random1000].longitude, cities[random1000].latitude],
      },
      images: [
        {
          url: "https://res.cloudinary.com/dtuiy5fat/image/upload/v1702797993/YelpCamp/lhgkpex8phpon04qdgjp.jpg",
          filename: "YelpCamp/lhgkpex8phpon04qdgjp",
        },
        {
          url: "https://res.cloudinary.com/dtuiy5fat/image/upload/v1702797995/YelpCamp/ovvcpolslglmxqcd6uls.jpg",
          filename: "YelpCamp/ovvcpolslglmxqcd6uls",
        },
      ],
    });
    await c.save();
  }
};

seedDB().then(() => {
  mongoose.connection.close();
});
