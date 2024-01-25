const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const back = require('../middleware/back');



router.get('/index', adminController.displayAdmin);
router.get('/logout',back, adminController.handleLogout);



//product

router.get('/products/:category?', adminController.displayProduct);

router.get('/add-product', adminController.displayAddProduct);
router.post('/add-product', adminController.postAddProduct);

router.get('/edit-product/:id', adminController.getUpdateProduct);
router.post('/edit-product/:id', adminController.postUpdateProduct);

router.delete('/delete-product/:id', adminController.deleteProduct);

router.get('/register', adminController.getRegisterAdmin);
router.post('/register', adminController.postRegisterAdmin);

router.get('/coupen', adminController.getAddCoupon);
router.post('/add-coupon', adminController.postAddCoupon);

router.get('/userlist', adminController.renderUsersList);

router.get('/delete-user/:id', adminController.deleteUser);

router.post('/block-user/:id', adminController.blockUser);








module.exports = router;
