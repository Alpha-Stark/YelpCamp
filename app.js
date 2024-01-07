// Done npm init -y, npm i express mongoose ejs method-override express-session connect-flash passport passport-local passport-local-mongoose multer dotenv cloudinary multer-storage-cloudinary @mapbox/mapbox-sdk express-mongo-sanitize sanitize-html helmet connect-mongo. And at the end we also installed joi (which is a JS validator, and not a client-side/brower validate, beacuse its already handeled off, but not this)

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config(); //means if we are not in production mode, then require dotenv and call the config function.
} //And yes foe now we are not in production mode, we are in development mode, so the key-value pairs from .env file will be added here, and can be accessed through process.env.__
//But in production mode we dont do that, There's another way of storing variables where we don't store them in a file and we just add them into the environment.
// console.log(process.env.SECRET);
// console.log(process.env.API_KEY);

const express = require("express");
const app = express();
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const path = require("path");
const session = require("express-session");
const flash = require("connect-flash");

const ExpressError = require("./utils/ExpressError");
const campgroundRoutes = require("./routes/campground");
const reviewRoutes = require("./routes/review");
const userRoutes = require("./routes/users");
const User = require("./models/user");
const helmet = require("helmet"); //this comes with somewhat of 13-14 middlewares with it
const MongoStore = require("connect-mongo");

const passport = require("passport");
const LocalStrategy = require("passport-local");
const mongoSanitize = require("express-mongo-sanitize"); // (https://www.npmjs.com/package/express-mongo-sanitize)

const mongoose = require("mongoose");
// New/Smarter Way, people always keep mongoose website(i.e., https://mongoosejs.com/) to copy the connection url/code block, so no need to worry.
const dbUrl = process.env.DB_URL || "mongodb://127.0.0.1:27017/yelp-camp"; //**this must be accessed or created before any mongoose function, including it's error handler main() function. [main().catch((err) => console.log(err));]
main().catch((err) => console.log(err));
async function main() {
  await mongoose.connect(dbUrl);
  console.log("MONGO Connection Successful, Now open to work!!!!!");
  // use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/movieApp');` if your database has auth enabled
}

app.engine("ejs", ejsMate); // this line tells express to use this insted of the default one it's relaying on.
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
//Now we'll tell express to serve public directory directly.(Kindoff globally, just like the views directory)
app.use(express.static(path.join(__dirname, "public")));
// app.use(mongoSanitize()); //This just makes things empty if it has restricted symbols, through which malicious activites can be carried out.
app.use(
  mongoSanitize({
    replaceWith: "_",
  })
); //This, insted of ristricted symbole, it will pass "-" in it.

const secret = process.env.SECRET || "thisshouldbeabettersecret!";

const store = new MongoStore({
  mongoUrl: dbUrl, //(older version) url:dbUrl, refer docs(https://www.npmjs.com/package/connect-mongo)
  secret,
  touchAfter: 24 * 60 * 60, //this means don't touch/update resave all the session on database every single time, user refreshes the page. Do it at the interval of 24 hours only.
});
store.on("error", function (e) {
  console.log("SESSION STORE ERROR: ", e);
});
//to store session date on mango and not on local machine, before creating the sessionConfig, we create the store variable.
const sessionConfig = {
  store, //indirectly means store: store,
  name: "sessionId",
  secret,
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true, //** You mustn't forget to include this, for extra safety measure. As this restricts the 3rd party websited to access browser cookie.
    // secure: true, // For now we'll keep it commented, but at the time of deploying, be must uncomment it.  //this means http wont work. But the secured version of it, https will work. Also our localhose:9090, cannot be considered as secure.
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7, //a week time.
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};
app.use(session(sessionConfig));
app.use(flash());
app.use(helmet()); //By this, it will enable all 13-14 middlewares that comes with helmet
// app.use(helmet({ contentSecurityPolicy: false }));

const scriptSrcUrls = ["https://stackpath.bootstrapcdn.com/", "https://stackpath.bootstrapcdn.com/", "https://api.tiles.mapbox.com/", "https://api.mapbox.com/", "https://kit.fontawesome.com/", "https://cdnjs.cloudflare.com/", "https://cdn.jsdelivr.net"];
const styleSrcUrls = ["https://kit-free.fontawesome.com/", "https://stackpath.bootstrapcdn.com/", "https://api.mapbox.com/", "https://api.tiles.mapbox.com/", "https://fonts.googleapis.com/", "https://use.fontawesome.com/", "https://stackpath.bootstrapcdn.com", "https://cdn.jsdelivr.net/npm/"];
const connectSrcUrls = ["https://api.mapbox.com/", "https://a.tiles.mapbox.com/", "https://b.tiles.mapbox.com/", "https://events.mapbox.com/"];
const fontSrcUrls = [];
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: [],
      connectSrc: ["'self'", ...connectSrcUrls],
      scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
      styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
      workerSrc: ["'self'", "blob:"],
      objectSrc: [],
      imgSrc: [
        "'self'",
        "blob:",
        "data:",
        "https://res.cloudinary.com/dtuiy5fat/", //SHOULD MATCH YOUR CLOUDINARY ACCOUNT!
        "https://images.unsplash.com/",
      ],
      fontSrc: ["'self'", ...fontSrcUrls],
    },
  })
);

app.use(passport.initialize());
app.use(passport.session()); //** We must write it after the official Express session middleware, because it relies on it. We must add this for persistency to our app. Means user dont have to login everytime.
passport.use(new LocalStrategy(User.authenticate())); //Means we are saying, hello Passport, we would like you to use the local strategy(passport-local) and for that localStrategy, the authentication method is going to be located on our User model and its called authenticate().

passport.serializeUser(User.serializeUser()); //Tells passport, how to serialize a user, and serialization means, how do we get data/ How do we store a user in the session.
passport.deserializeUser(User.deserializeUser()); // How do you get a user out of that session. ** And both of this method works because we have added a plugin in user.js file of passportLocalMongoose(passport-local-mongoose).
//And this is why we need all 3 because of dependency of passport-local-mongoose on passport-local and it's on passport.

app.use((req, res, next) => {
  // console.log(req.query);
  // console.log(req.session);
  if (!["/login", "/"].includes(req.originalUrl)) {
    //done this because there was a bug, which is explained in this video(https://youtu.be/g7SaXCYCgXU)
    req.session.returnTo = req.originalUrl;
  }
  res.locals.currentUser = req.user;
  res.locals.success = req.flash("success"); //confused? Go to FlashDemp folder under Session_Flash Directory.
  res.locals.error = req.flash("error");
  //as the above both will be available on every templet, we will add our user's data here, so if current user is not user loggedIn, this will be undefined and the logout button will not be showed, thanks to this.
  next();
  //Remember this req.locals is an object specifically used for passing local variables between middleware and route handlers(**also in templets.). It allows you to share data within a single request-response cycle without polluting the global scope. Used for personalizing the user experience, control access, or display user-specific information[navbar].
});

app.get("/fakeuser", async (req, res) => {
  const user = new User({ email: "mann@savani.com", username: "mann" }); //we dont pass the password here, insted we do it in register method.
  const newUser = await User.register(user, "password");
  res.send(newUser);
});

//remember the above Flash Middleware must be written before the routes code.
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/reviews", reviewRoutes); /****Always remember, when we have this kind of thing in our path "/:id/", means on other side, this id from params wont be accessible, hence, must include { mergeParams: true } inside express.Router(). */
app.use("/", userRoutes);

app.get("/", (req, res) => {
  res.render("home");
});

app.all("*", (req, res, next) => {
  next(new ExpressError("Page Not Found!!!", 404));
});

app.use((err, req, res, next) => {
  // const { message = "Something Went Wrong!!!", statusCode = 500 } = err;
  // res.status(statusCode).send(message);
  const { statusCode = 500 } = err;
  if (!err.message) err.message = "Something Went Wrong";
  res.status(statusCode).render("error", { err });
});

app.listen(9090, () => {
  console.log("SERVING ON PORT 9090!!!!!");
});
