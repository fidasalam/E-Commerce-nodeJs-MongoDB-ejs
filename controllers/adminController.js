const User = require('../models/usermodel');
const Product = require('../models/product');
const Category = require('../models/category');
const DeletedUser = require('../models/deletedUser');
const Coupon = require('../models/coupon')
const Order = require('../models/order');

const bcrypt = require('bcryptjs');

const path = require('path');
const fs = require('fs').promises;
const ProductHelper = require('../helpers/productHelper');
const orderHelper = require('../helpers/orderHelper');
const upload = require('../config/multerConfig');





exports.displayAdmin = async (req, res) => {
  try {
    res.render('admin/index');
  } catch (error) {
    console.error('Error rendering admin page:', error);
    res.status(500).send('Internal Server Error');
  }
};



exports.handleLogout = (req, res) => {
  try {
    // Set a flash message
    req.flash('success', 'Logged out successfully');

    // Destroy the session to log out the user
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
        res.status(500).send('Internal Server Error');
      } else {
        // Redirect to the login page with a success message
        res.redirect('/user/index');
      }
    });
  } catch (error) {
    console.error('Error during logout:', error.message);
    res.status(500).render('error', { message: 'Error during logout', error: error.message });
  }
};




//product




exports.displayProduct = async (req, res) => {
  try {
    
    const categoryParam = req.query.category;

  
    let products;
    if (categoryParam && categoryParam !== 'All') {
      products = await ProductHelper.getProductsByCategoryName(categoryParam);
    } else {
      products = await ProductHelper.getAllProducts();
    }

    res.render('admin/products', { products, selectedCategory: categoryParam });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).send('Internal Server Error');
  }
};



exports.displayAddProduct = (req, res) => {
  try {
    res.render('admin/add-product');
  } catch (error) {
    console.error('Error rendering add-product page:', error);
    res.status(500).send('Internal Server Error');
  }
};

exports.postAddProduct = async (req, res) => {
  try {
    // Multer middleware should be used in the route handler
    upload.array('images')(req, res, async function (err) {
      if (err) {
        // Handle Multer error
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

      return res.redirect('/admin/products');
    });
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).render('error', { error: 'Internal Server Error' });
  }
};

   
exports.getUpdateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await ProductHelper.getProductById(productId);
   
    if (!product) {
      // Handle the case where the product is not found
      return res.status(404).send('Product not found');
    }

    // Fetch additional information related to categories
    const categories = await ProductHelper.getProductsByCategoryName('All'); // Assuming 'All' is a default category
    // You may adjust the category name as needed based on your application logic

    // Render the edit-product view with the product details and categories
   
    res.render('admin/edit-product', { existingProduct: product, categories,productId });
  } catch (error) {
    // Handle errors appropriately
    console.error(error);
    res.status(500).send('Internal Server Error');
  }};

  exports.postUpdateProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const updatedData = req.body;

        console.log('ProductId:', productId);
        console.log('Updated Data:', updatedData);

        const updatedProduct = await ProductHelper.updateProductById(productId, updatedData);

        if (updatedProduct) {
            return res.redirect('/admin/products');
        } else {
            res.status(404).render('error', { message: 'Product not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Internal Server Error' });
    }
};


  exports.deleteProduct = async (req, res) => {
    try {
      const productId = req.params.id;
  
      console.log('Before deleteProductById call');
await ProductHelper.deleteProductById(productId);
console.log('After deleteProductById call');
     
  
      res.status(204).end(); // Respond with a successful status without content
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).send('Internal Server Error');
    }
  };
 



//register
  exports.getRegisterAdmin = (req, res) => {
    try {
      res.render('admin/register-admin');
    } catch (error) {
      console.error('Error rendering add-product page:', error);
      res.status(500).send('Internal Server Error');
    }
  };

  exports.postRegisterAdmin = async (req, res) => {
    try {
      // Assuming your registration form fields are: name, username, email, password, phone
      const { name, username, email, password, phone } = req.body;
  
      // Use the adminHelper to register the admin
      await ProductHelper.registerAdmin({ name, username, email, password, phone });
  
      // Redirect or render as needed
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
    try {
      res.render('admin/coupen');
    } catch (error) {
      console.error('Error rendering add-product page:', error);
      res.status(500).send('Internal Server Error');
    }
  };

  exports.postAddCoupon = async (req, res) => {
    try {
        const { code, discountPercentage } = req.body;

        // Validate if the required fields are provided
        if (!code || !discountPercentage) {
            return res.status(400).json({ success: false, message: 'Coupon code and discount percentage are required.' });
        }

        // Check if the coupon code already exists
        const existingCoupon = await Coupon.findOne({ code });
        if (existingCoupon) {
            return res.status(400).json({ success: false, message: 'Coupon code already exists. Choose a different one.' });
        }

        // Create a new coupon
        const newCoupon = new Coupon({
            code,
            discountPercentage,
        });

        // Save the coupon to the database
        await newCoupon.save();

        return res.status(201).json({ success: true, message: 'Coupon added successfully.' });
    } catch (error) {
        console.error('Error adding coupon:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};
  

exports.renderUsersList = async (req, res) => {
  try {
    const users = await User.find();
    res.render('admin/userlist', { users });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};


exports.deleteUser = async (req, res) => {
  try {
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

    res.redirect('/admin/userlist'); // Redirect to user list or another page
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).render('error', { error: "Internal Server Error" });
  }
};



exports.blockUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.renderOrderList = async (req, res) => {
  try {
    const orders = await Order.find().sort({ 'payment.orderDate': -1 }).populate('user'); // Assuming the user field in the Order model is used to reference the user who placed the order
    res.render('admin/orderlist', { orders });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};


exports.changeStatus = async (req, res) => {
  const { orderId } = req.params;
  const { status, currentDate } = JSON.parse(req.body);

  console.log('Received payload:', currentDate);

  try {
    // Find the order by orderId
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get the next status using the awaited result of getNextStatus
    const nextStatus = await orderHelper.getNextStatus(status);

    // Update only the payment status field
    order.payment.status = nextStatus;
    if (nextStatus === 'shipping') {
      order.shippedDate = new Date(currentDate);
  } else if (nextStatus === 'delivered') {
      order.deliveredDate = new Date(currentDate);
  }

    // Save the updated order
    const updatedOrder = await order.save();

    res.status(200).json(updatedOrder);
  } catch (error) {
    console.error('Error updating order status:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.getMonthlySalesData=async(req,res)=>{
  const orders = await Order.find();
        res.json(orders);
}