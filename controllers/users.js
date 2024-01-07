const User = require("../models/user");

module.exports.renderRegisterForm = (req, res) => {
  res.render("users/register");
};

module.exports.registerUser = async (req, res, next) => {
  try {
    const { email, username, password } = req.body; // we must not give name like user[email] in our form and then do req.body.user, because further ahead, the passport's middleware wont go through it.
    const user = new User({ email, username });
    const registeredUser = await User.register(user, password);
    //   console.log(registeredUser); //But this doesn't log us in, just makes an account(have to manualy do it on our own), which is not good, as we want to take user directly to LoggedIn website. So we Use login() here. (http://www.passportjs.org/concepts/authentication/login/)
    req.login(registeredUser, (err) => {
      if (err) return next(err); // as there is a next(), hence we add it to our parameters too.s
      req.flash("success", "Welcome to Yelp Camp");
      res.redirect("/campgrounds");
    });
  } catch (e) {
    req.flash("error", e.message);
    res.redirect("/register");
  }
};

module.exports.renderLoginForm = (req, res) => {
  res.render("users/login");
};

module.exports.loginUser = (req, res) => {
  const redirectUrl = res.locals.returnTo || "/campgrounds"; //means if in session there is predefined returnTo info(getting back user to the page from where it was asked/thrown to login) go there, else to the standard redirect. And at the end delete that session variable. // delete req.session.returnTo; //no need of this, because passport.authenticate() clears the session and deletes itself.
  req.flash("success", "Welcome Back to Yelp Camp");
  res.redirect(redirectUrl);
};

module.exports.deleteUser = (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.flash("success", "GoodBye!!!");
    res.redirect("/campgrounds");
  });
}; //The above code is different from Course Code, because of Passport's document update, where we must pass a function to the logout() or logOut(). (http://www.passportjs.org/concepts/authentication/logout/).
