const User = require('../models/usermodel');
const Product = require('../models/product');
const Category = require('../models/category');
const DeletedUser = require('../models/deletedUser');
const Coupon = require('../models/coupon')
const Banner = require('../models/banner');
const Order = require('../models/order');
const ProductHelper = require('../helpers/productHelper');
const orderHelper = require('../helpers/orderHelper');
const upload = require('../config/multerConfig');
const userHelper = require('../helpers/userHelper');





exports.displayAdmin = async (req, res) => {

    const salesData = await orderHelper.getProductSalesByMonth();
     const totalSalesArray = salesData.map(item => item.totalSales); 
     const incomeData = await orderHelper.getProductIncomeByMonth();
     const totalIncomeArray = incomeData.map(item => item.totalIncome);
     const orderData = await orderHelper.getTotalOrders();
     const totalRevenue= await orderHelper.getTotalRevenue();
    const users=await userHelper.getTotalUsers()
    const orders = await Order.find().sort({ 'payment.orderDate': -1 }).populate('user').lean(); 
    console.log("sale:",orders);
    console.log("rev:",totalSalesArray);
     res.render('admin/index', { salesData: totalSalesArray, incomeData: totalIncomeArray,  totalOrders:orderData ,totalRevenue,users,orders});
   } ;



exports.handleLogout = (req, res) => {
    req.flash('success', 'Logged out successfully');
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
        res.status(500).send('Internal Server Error');
      } else {
        res.redirect('/user/index');
      }
    });
  } ,



//product

exports.displayProduct = async (req, res) => {

    const categoryParam = req.query.category;
    let products;
    if (categoryParam && categoryParam !== 'All') {
      products = await ProductHelper.getProductsByCategoryName(categoryParam);
    } else {
      products = await ProductHelper.getAllProducts();
    }
    await Product.populate(products, { path: 'coupon' });
    res.render('admin/products', { products, selectedCategory: categoryParam });
  } ;


exports.displayAddProduct = (req, res) => {

    res.render('admin/add-product');
  } ;


exports.postAddProduct = async (req, res) => {
    upload.array('images')(req, res, async function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      const { name, price, category, description, color, size, unitsSold, inStock } = req.body;
      const imagePaths = req.files.map(file => `/uploads/product-images/${file.filename}`);
      const newProduct = new Product({
        name,
        price,
        images: imagePaths,
        category,
        description,
        color,
        size,
        unitsSold,
        inStock,
      });
      await newProduct.save();
      console.log(newProduct)
      return res.redirect('/admin/products');
    });
  } ;

   
exports.getUpdateProduct = async (req, res) => {
    const productId = req.params.id;
    const product = await ProductHelper.getProductById(productId);
    if (!product) {
      return res.status(404).send('Product not found');
    }
    const categories = await ProductHelper.getProductsByCategoryName('All'); 
    res.render('admin/edit-product', { existingProduct: product, categories,productId });
  } ;

  exports.postUpdateProduct = async (req, res) => {
        const productId = req.params.id;
        const updatedData = req.body;
        const updatedProduct = await ProductHelper.updateProductById(productId, updatedData);
        if (updatedProduct) {
            return res.redirect('/admin/products');
        } else {
            res.status(404).render('error', { message: 'Product not found' });
        }
    } ;

  exports.deleteProduct = async (req, res) => {
      const productId = req.params.id;
     await ProductHelper.deleteProductById(productId);
      res.status(204).end();
    } ;


//register
  exports.getRegisterAdmin = (req, res) => {
      res.render('admin/register-admin');
    } ;

  exports.postRegisterAdmin = async (req, res) => {
    try {
       const { name, username, email, password, phone } = req.body;
      await ProductHelper.registerAdmin({ name, username, email, password, phone });
      res.redirect('/admin/index');
    } catch (error) {
      console.error(error);
      if (error.code === 11000) {
        return res.status(400).send('Username or email already in use.');
      }
      res.status(500).send('Internal Server Error');
    }
  };



  //coupen
  exports.getAddCoupon = (req, res) => {
      res.render('admin/coupen');
    } ;


  exports.postAddCoupon = async (req, res) => {
        const { code, discountPercentage , validityPeriod,description} = req.body;
        if (!code || !discountPercentage) {
            return res.status(400).json({ success: false, message: 'Coupon code and discount percentage are required.' });
        }
        const existingCoupon = await Coupon.findOne({ code });
        if (existingCoupon) {
            return res.status(400).json({ success: false, message: 'Coupon code already exists. Choose a different one.' });
        }
        const newCoupon = new Coupon({
            code,
            discountPercentage,
            validityPeriod,
            description,
        });
        await newCoupon.save();

        return res.status(201).json({ success: true, message: 'Coupon added successfully.' });
    } ;
  

exports.postProductCoupon = async(req, res) => {
  const productId = req.body.productId;
  const couponCode = req.body.couponCode;
  console.log('prod',productId)
  console.log('coup',couponCode)

  const product = await Product.findById(productId);
  const coupon = await Coupon.findOne({ code: couponCode });

  if (couponCode=='remove') {
    product.coupon = undefined;
    await product.save();
    return res.status(200).json({ message: 'Coupon removed from product successfully' });
  }
  product.coupon = coupon;
  await product.save();
  console.log('prod:',product)
  return res.status(200).json({ message: 'Coupon added to product successfully' });
};



exports.getBanner = async (req, res) => {
  res.render('admin/banner');
} ;

exports.postBanner = async (req, res) => {
  upload.single('bannerImage')(req, res, async function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    const {  description ,title} = req.body;
    const imagePath = `/uploads/product-images/${req.file.filename}`; // Path to the uploaded banner image
    const newBanner = new Banner({
      bannerImage: imagePath,
      bannerTitle:title,
      bannerDescription:description,
    });
    await newBanner.save();
    return res.redirect('/admin/banner');
  });
} ;

exports.renderUsersList = async (req, res) => {
    const users = await User.find();
    res.render('admin/userlist', { users });
  } ;


exports.deleteUser = async (req, res) => {
    const userId = req.params.id;
    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
      return res.status(404).render('error', { error: "User not found." });
    }
    const deletedUserData = {
      deletedBy: userToDelete._id,
      deletedAt: new Date(),
      ...userToDelete.toObject(),
    };
    await DeletedUser.create(deletedUserData);
    await User.findByIdAndDelete(userId);
    res.redirect('/admin/userlist'); 
  };



exports.blockUser = async (req, res) => {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    user.isBlocked = !user.isBlocked;
    await user.save();
    res.json(user);
  } ;

exports.renderOrderList = async (req, res) => {
    const orders = await Order.find().sort({ 'payment.orderDate': -1 }).populate('user'); // Assuming the user field in the Order model is used to reference the user who placed the order
    res.render('admin/orderlist', { orders });
  } ;


exports.changeStatus = async (req, res) => {
  const { orderId } = req.params;
  const { status, currentDate } = JSON.parse(req.body);
   const order = await Order.findById(orderId);
   if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    const nextStatus = await orderHelper.getNextStatus(status);
    order.payment.status = nextStatus;
    if (nextStatus === 'shipping') {
      order.shippedDate = new Date(currentDate);
  } else if (nextStatus === 'delivered') {
      order.deliveredDate = new Date(currentDate);
  }
    const updatedOrder = await order.save();
    res.status(200).json(updatedOrder);
  };


 


