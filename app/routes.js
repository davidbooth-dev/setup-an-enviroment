const passport = require("passport");

module.exports = function(app, db) {
  function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect("/");
  }

  app.route("/auth/github").get(function(req, res, next) {
    passport.authenticate("github", {
      scope: ["user:email"]
    })(req, res, next),
      (req, res, next) => {
        next();
      };
  });

  app.route("/auth/github/callback").get(function(req, res, next) {
    passport.authenticate("github", {
      failureRedirect: "/",
      successRedirect: "/chat"
    })(req, res, next),
      (req, res, next) => {
        req.session.user_id = req.user.id;
        res.redirect("/chat");
      };
  });

  /*app.route('/auth/github/callback')
      .get(passport.authenticate('github', { failureRedirect: '/' }), (req,res) => {
          req.session.user_id = req.user.id;
          res.redirect('/chat');
      });*/

  app.route("/").get((req, res) => {
    res.render(process.cwd() + "/views/pug/index");
  });

  app.route("/chat").get(ensureAuthenticated, (req, res) => {
    res.render(process.cwd() + "/views/pug/chat", { user: req.user });
  });

  app.route("/logout").get((req, res) => {
    req.logout();
    res.redirect("/");
  });

  app.use((req, res, next) => {
    res
      .status(404)
      .type("text")
      .send("Not Found");
  });
};
