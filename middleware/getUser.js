// middleware.js
const userHelper = require('../helpers/userHelper');
const cartHelper = require('../helpers/cartHelper');

const getUser = async (req, res, next) => {
  try {
    
    const userId = req.session.userId;
    const userDetails = await userHelper.getUserProfile(userId);
    const username = await userHelper.getCurrentUsername(userId);
    req.userDetails = userDetails;
    req.userId =userId;
    // req.cart = await cartHelper.getCart(userId);
    // req.subtotal = cartHelper.calculateSubtotal(req.cart);

    next();
  } catch (error) {
    console.error('Error fetching user and cart details:', error.message);
    res.status(500).render('error', { message: 'Error fetching user ', error: error.message });
  }
};

module.exports = { getUser };
