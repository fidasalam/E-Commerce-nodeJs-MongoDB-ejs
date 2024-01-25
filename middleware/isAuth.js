//Authendication purpose
const isAuth = (req, res, next) => {
    if ( req.session.userId  && req.session.token) {
      next();
      
    } else {
      req.flash('error', 'You need to log in to access this page');
      res.redirect('/user/login')
    }
  };

  module.exports ={ isAuth};