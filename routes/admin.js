const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const noLoginPageCache= require('../middleware/noLoginPageCache');

// Admin Authentication Routes
router.get('/index', adminController.displayAdmin);
router.get('/logout', noLoginPageCache, adminController.handleLogout);

// Product Routes
router.get('/products/:category?', adminController.displayProduct);
router.get('/add-product', adminController.displayAddProduct);
router.post('/add-product', adminController.postAddProduct);
router.get('/edit-product/:id', adminController.getUpdateProduct);
router.post('/edit-product/:id', adminController.postUpdateProduct);
router.delete('/delete-product/:id', adminController.deleteProduct);

// Admin Registration and Coupon Routes
router.get('/register', adminController.getRegisterAdmin);
router.post('/register', adminController.postRegisterAdmin);
router.get('/coupen', adminController.getAddCoupon);
router.post('/add-coupon', adminController.postAddCoupon);
router.post('/add-productCoupon', adminController.postProductCoupon);

// User Management Routes
router.get('/userlist', adminController.renderUsersList);
router.get('/delete-user/:id', adminController.deleteUser);
router.post('/block-user/:id', adminController.blockUser);

// Order Management Routes
router.get('/orderlist', adminController.renderOrderList);
router.post('/updateStatus/:orderId', adminController.changeStatus);





module.exports = router;
