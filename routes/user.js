const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { isAuth } = require('../middleware/isAuth');
const  noLoginPageCaching = require('../middleware/noLoginPageCache');
const { getUser } = require('../middleware/getUser');




// Homepage and Product Routes
router.get('/', userController.displayHomepage);
router.get('/index', getUser, userController.displayHomepage);
router.get('/product', getUser, userController.renderProductsByCategory);
router.get('/productdetails/:productId', getUser, userController.renderProductDetail);

// Authentication Routes
router.get('/login', getUser, userController.renderLoginPage);
router.post('/login', getUser,  noLoginPageCaching, userController.handleLogin);
router.get('/logout', getUser, userController.handleLogout);
router.get('/register', getUser, userController.renderRegisterPage);
router.post('/register', getUser, userController.handleRegister);

// User Profile Routes
router.get('/profile', isAuth, getUser, userController.renderProfilePage);
router.post('/profile/edit', isAuth, getUser, userController.handleEditProfile);

// forgot password Routes
router.get('/forgot-password', getUser, userController.renderforgotpassword);
router.post('/forgot-password', getUser, userController.forgotpassword);
router.post('/verify-otp', getUser, userController.verifyOtp);
router.post('/reset-password', getUser, userController.resetPassword);
router.get('/enter-otp', userController.renderEnterOTPPage);
// Contact Routes
router.get('/contact', getUser, userController.renderContact);
router.post('/contact', getUser, userController.handleContact);

// Cart Routes
router.get('/cart', getUser, userController.renderShoppingCart);
router.post('/cart',isAuth, getUser, userController.removeProduct);
router.get('/empty-cart', getUser, userController.renderEmptyCart);
router.post('/cart/update-quantity',isAuth, getUser, userController.updateQuantity);
router.post('/cart/remove-product', getUser, userController.removeProduct);

//Product Routes
router.get('/product',getUser, userController.renderProductsByCategory);
router.get('/productdetails/:productId',getUser, userController.renderProductDetail);
router.post('/addToCart/:productId',getUser,userController.addToCart);
router.get('/filter',getUser,userController.filterProducts);

// Search Routes
router.post('/search/suggestions', getUser, userController.searchSuggestions);
router.get('/search', getUser, userController.renderSearchProducts);
router.post('/search', getUser, userController.searchProducts);

// Wishlist Routes
router.get('/wishlist', isAuth, getUser, userController.renderWishlist);
router.post('/wishlist/:productId', isAuth, getUser, userController.addWishlist);
router.post('/wishlist/add-to-cart/:productId', isAuth, getUser, userController.wishlistAddToCart);
router.delete('/wishlist/:productId', getUser, userController.removeWishlist);

// Coupon Routes
router.post('/apply-coupon', isAuth, getUser, userController.applyCoupon);
router.post('/coupons', isAuth, getUser, userController.handleCoupon);
router.post('/remove-coupon', isAuth, getUser, userController.removeCoupon);

// Checkout Routes
router.get('/checkout',  isAuth, getUser, userController.renderCheckout);
router.post('/checkout', isAuth, getUser, userController.handleCheckout);
// Address
router.get('/add-address',  isAuth, getUser, userController.getAddAddress);
router.post('/add-address',  isAuth, getUser, userController.addAddress);
router.post('/updateaddress',  isAuth, getUser, userController.updateAddress);
router.get('/delete-address/:index',  isAuth, getUser, userController.deleteAddress);
router.post('/set-default-address/:index',  isAuth, getUser, userController.setDefault);

router.post('/submitRating',  isAuth, getUser, userController.submitRating);


// Payment Routes
router.post('/stripePayment', getUser, userController.handleStripePayment);
router.get('/stripe-payment', getUser, userController.renderStripePayment);
router.post('/process-payment', getUser, userController.handleProcessPayment);
router.post('/save-order-payment', getUser, userController.saveOrder);
router.post('/razorPay', getUser, userController.razorPay);
router.get('/razor-payment', getUser, userController.renderrazorPayment);
router.post('/verify-payment', getUser, userController.verifyPayment);
router.post('/cashOnDelivery', getUser, userController.handleCashOnDelivery);

// Thank You and Order History Routes
router.get('/thankyou', getUser, userController.renderThankyou);
router.get('/orders', getUser, isAuth, userController.renderOrderPage);

module.exports = router;
