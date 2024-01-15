const User = require('../models/usermodel');
const userHelper = require('../helpers/userHelper');

const displayuser = async (req, res, next) => {
  try {
    if (req.session.userId) {
      const userDetails = await userHelper.getCurrentUsername(req.session.userId);
      res.locals.user = userDetails;
    }
    next();
  } catch (error) {
    console.error('Error authenticating user:', error.message);
    res.status(500).render('error', { message: 'Error authenticating user', error: error.message });
  }
};
module.exports = { displayuser };