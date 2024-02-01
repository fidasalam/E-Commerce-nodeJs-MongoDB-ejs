

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { isAuth } = require('../middleware/isAuth');
const back = require('../middleware/back');
const {getUser} = require('../middleware/getUser');


router.get('/index',getUser, userController.displayHomepage);

router.get('/login',getUser, userController.renderLoginPage);
router.post('/login',getUser, userController.handleLogin);
router.get('/logout',getUser,back, userController.handleLogout);



router.get('/register',getUser, userController.renderRegisterPage);
router.post('/register',getUser, userController.handleRegister);



router.get('/profile',isAuth,getUser, userController.renderProfilePage);
router.post('/profile/edit',isAuth,getUser, userController.handleEditProfile);

router.get('/product',getUser, userController.renderProductsByCategory);
router.get('/productdetails/:productId',getUser, userController.renderProductDetail);
router.post('/addToCart/:productId',getUser,userController.addToCart);
router.get('/filter',getUser,userController.filterProducts);

router.get('/cart',getUser, userController.renderShoppingCart);
router.post('/cart',getUser, userController.removeProduct);
router.get('/empty-cart',getUser, userController.renderEmptyCart);
router.post('/cart/update-quantity',getUser, userController.updateQuantity);
router.post('/cart',getUser, userController.removeProduct);
router.post('/cart/remove-product',getUser, userController.removeProduct);





router.get('/search',getUser,userController.renderSearchProducts);
router.post('/search', getUser, userController.searchProducts);


// router.get('/checkout',isAuth,getUser,userController.renderCheckout);

router.get('/wishlist',isAuth,getUser,userController.renderWishlist);
router.post('/wishlist/:productId',isAuth,getUser,userController.addWishlist);
router.post('/wishlist/add-to-cart/:productId',isAuth,getUser, userController.wishlistAddToCart);
router.delete('/wishlist/:productId',getUser,userController.removeWishlist);



router.get('/checkout',back,isAuth,getUser,userController.renderCheckout);
router.post('/checkout',isAuth,getUser,userController.handleCheckout);

router.post('/stripePayment',getUser,userController.handleStripePayment);
router.get('/stripe-payment',getUser,userController.renderStripePayment);



router.post('/process-payment',getUser,userController.handleProcessPayment);
router.post('/save-order-payment',getUser,userController.saveOrder);



router.post('/razorPay',getUser,userController.razorPay);
router.get('/razor-payment',getUser,userController.renderrazorPayment);
router.post('/verify-payment',getUser,userController.verifyPayment);


router.post('/cashOnDelivery',getUser,userController.handleCashOnDelivery);


router.get('/thankyou',getUser,userController.renderThankyou);

router.get('/orders',getUser,userController.renderOrderPage);




module.exports = router;


