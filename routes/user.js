

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { isAuth } = require('../middleware/isAuth');
const back = require('../middleware/back');
const {getUser} = require('../middleware/getUser');


router.get('/index',getUser, userController.displayHomepage);

router.get('/login',getUser, userController.renderLoginPage);
router.post('/login',getUser, userController.handleLogin);


router.get('/register',getUser, userController.renderRegisterPage);
router.post('/register',getUser, userController.handleRegister);

router.get('/logout',getUser,back, userController.handleLogout);


router.get('/profile',isAuth,getUser, userController.renderProfilePage);
router.post('/profile/edit',isAuth,getUser, userController.handleEditProfile);

router.get('/productdetails/:productId',getUser, userController.renderProductDetail);
router.post('/addToCart/:productId',getUser,userController.addToCart);


router.get('/cart',getUser, userController.renderShoppingCart);
router.post('/cart',getUser, userController.removeProduct);


router.post('/cart/update-quantity',getUser, userController.updateQuantity);
router.post('/cart',getUser, userController.removeProduct);

router.post('/cart/remove-product',getUser, userController.removeProduct);

router.post('/cart/add-coupon',isAuth,getUser, userController.applyCoupen);

router.get('/product',getUser, userController.renderProductsByCategory);


router.get('/search',getUser,userController.renderSearchProducts);
router.post('/search', getUser, userController.searchProducts);


router.get('/checkout',isAuth,getUser,userController.renderCheckout);

router.get('/wishlist',isAuth,getUser,userController.renderWishlist);
router.post('/wishlist/:productId',isAuth,getUser,userController.addWishlist);

router.delete('/wishlist/:productId',getUser,userController.removeWishlist);



router.get('/checkout',getUser,userController.renderCheckout);
router.post('/checkout',getUser,userController.handleCheckout);



module.exports = router;

