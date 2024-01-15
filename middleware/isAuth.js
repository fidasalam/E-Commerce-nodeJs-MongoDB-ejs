//Authendication purpose
const isAuth = (req, res, next) => {
    if (req.session.loggedIn && req.session.token) {
      next();
    } else {
      req.flash('error', 'You need to log in to access this page');
      res.redirect('/users/login')
    }
  };

  module.exports ={ isAuth};