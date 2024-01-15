

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateUserMiddleware } = require('../middleware/jwtAuth');
const { isAuth } = require('../middleware/isAuth');
const back = require('../middleware/back');


router.get('/index', userController.displayHomepage);

router.get('/login', userController.renderLoginPage);
router.post('/login', userController.handleLogin);


router.get('/register', userController.renderRegisterPage);
router.post('/register', userController.handleRegister);

router.get('/logout',back, userController.handleLogout);


router.get('/profile', userController.renderProfilePage);
router.post('/profile/edit', userController.handleEditProfile);

router.get('/productdetails/:productId', userController.renderProductDetail);



router.get('/cart', isAuth, addToCart);
router.post('/add-to-cart', isAuth, addToCart);






module.exports = router;

