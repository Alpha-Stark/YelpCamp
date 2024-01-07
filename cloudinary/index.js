const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary"); //bott lines copied from (https://github.com/affanshahid/multer-storage-cloudinary)

//The below setting config is not in the github page(https://github.com/affanshahid/multer-storage-cloudinary), but it is in the docs.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary, //the configured cloudinary object
  params: {
    folder: "YelpCamp",
    allowedFormat: ["jpeg", "jpg", "png"],
  },
});

module.exports = {
  cloudinary, //configured object
  storage, // storage£¢
};
