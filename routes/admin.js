const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');




router.get('/index', adminController.displayAdmin);



//product

router.get('/products/:category?', adminController.displayProduct);

router.get('/add-product', adminController.displayAddProduct);
router.post('/add-product', adminController.postAddProduct);

router.get('/edit-product/:id', adminController.getUpdateProduct);
router.post('/edit-product/:id', adminController.postUpdateProduct);

router.delete('/delete-product/:id', adminController.deleteProduct);

router.get('/register', adminController.getRegisterAdmin);
router.post('/register', adminController.postRegisterAdmin);







module.exports = router;
