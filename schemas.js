const BaseJoi = require("joi");
const sanitizeHtml = require("sanitize-html");

const extension = (joi) => ({
  type: "string",
  base: joi.string(),
  messages: {
    "string.escapeHTML": "{{#label}} must not include HTML!",
  },
  rules: {
    escapeHTML: {
      validate(value, helpers) {
        const clean = sanitizeHtml(value, {
          allowedTags: [],
          allowedAttributes: {},
        });
        if (clean !== value) return helpers.error("string.escapeHTML", { value });
        return clean;
      },
    },
  },
}); //this is a security measure, so that noone can pass HTML to our input and infect our website, because some of this code can be changed with HTML Code.

const Joi = BaseJoi.extend(extension);

/** Now we'll define our Joi Specific schema, and hence before even passing it to mongoose, we will validate our data.*/
module.exports.campgroundSchema = Joi.object({
  // now our top thing will be campground, because our data travells like that.i.e., campgeoung[title], campgeoung[price]
  campground: Joi.object({
    title: Joi.string().required().escapeHTML(),
    price: Joi.number().required().min(0),
    description: Joi.string().required().escapeHTML(),
    // image: Joi.string().required(),
    location: Joi.string().required().escapeHTML(),
  }).required(), //means campground will an object, in which everything will be there and it is must => "required"
  deleteImages: Joi.array(),
});

//by these way, exports are not overwrited.
module.exports.reviewsSchema = Joi.object({
  review: Joi.object({
    rating: Joi.number().required().min(1).max(5), //in forms, it's default selected, but by AJAX or Postman, someone che send data and that to without rating.
    body: Joi.string().required().escapeHTML(),
  }).required(),
});
