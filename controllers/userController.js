const User = require('../models/usermodel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Product = require('../models/product');
const path = require('path');
const fs = require('fs');
const userHelper = require('../helpers/userHelper');
const ProductHelper = require('../helpers/productHelper');

const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret-key';




exports.displayHomepage = async (req, res) => {
  try {
    
    const categories = await ProductHelper.getAllCategories();
    const user = res.locals.user;
    const products = await Product.find();
    

    res.render('user/index', { products: products, user: user, categories: categories});

  } catch (error) {
    console.error('Error rendering index page:', error.message);
    res.status(500).render('error', { message: 'Error rendering index page', error: error.message });
  }
};



exports.renderLoginPage = async (req, res) => {
  try {
   
    const user = res.locals.user;
    res.render('user/login', { user });
  } catch (error) {
    console.error('Error rendering login page:', error.message);
    res.status(500).render('error', { message: 'Error rendering login page', error: error.message });
  }
};


exports.handleLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      req.flash('error', 'Invalid credentials');
      return res.redirect('/user/login');
    }

    // Generate a JWT token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });

    // Store the token and userId in the session
    req.session.token = token;
    req.session.userId = user._id;

    // Fetch the user details for displaying on the index page
    const products = await Product.find();
    const userDetails = await userHelper.getCurrentUsername(user._id);

    // Render the 'user/index' page with products and the logged-in user's details
    res.render('user/index', { products: products, user: userDetails });

  } catch (error) {
    console.error('Error during login:', error.message);
    res.status(401).render('user/login', { error: error.message });
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
        res.redirect('/user/login');
      }
    });
  } catch (error) {
    console.error('Error during logout:', error.message);
    res.status(500).render('error', { message: 'Error during logout', error: error.message });
  }
};

 



exports.renderRegisterPage = async (req, res) => {
  try {
   
    const user = res.locals.user;
    res.render('user/register', { user });
  } catch (error) {
    console.error('Error rendering login page:', error.message);
    res.status(500).render('error', { message: 'Error rendering login page', error: error.message });
  }
};


exports.handleRegister = async (req, res) => {
 
  try {
    const newUser = await userHelper.registerUser(req.body);
    const userId = req.session.userId;

  
    const products = await Product.find();
    const userDetails = await userHelper.getCurrentUsername(newUser._id);

    
    res.render('user/index', { products: products, user: userDetails });
  
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return res.status(400).send('Username or email already in use.');
    }

    res.status(500).send('Internal Server Error');
  }
};



exports.renderProfilePage = async (req, res) => {
  try {
    // Check if the user is authenticated
    if (!req.session.userId) {
      return res.redirect('/user/login'); // Redirect to login if not authenticated
    }

    // Fetch the user details using userHelper
    const userDetails = await userHelper.getUserProfile(req.session.userId);

    if (!userDetails) {
      return res.redirect('/user/login'); // Redirect to login if user details are not found
    }

    // Render the 'user/profile' page with user details
    res.render('user/profile', { user: userDetails });

  } catch (error) {
    console.error('Error rendering profile page:', error.message);
    res.status(500).render('error', { message: 'Error rendering profile page', error: error.message });
  }
};

exports.handleEditProfile = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { username, email, name, phone, password, address } = req.body;

    // Update user details
    await User.findByIdAndUpdate(userId, {
      username,
      email,
      name,
      phone,
      address,
    });

    // Redirect to the profile page after successful update
    req.flash('success', 'Profile updated successfully');

    // Redirect to the profile page with a success message
    res.redirect('/user/profile');
  } catch (error) {
    console.error('Error handling edit profile:', error.message);
    res.status(500).render('error', { message: 'Error handling edit profile', error: error.message });
  }
};


exports.renderProductDetail = async (req, res) => {
  try {
    
    const user = res.locals.user;
    // Extract the product ID from the request parameters
    const productId = req.params.productId;

    // Fetch the product details from the database based on the ID
    const product = await Product.findById(productId);

    if (!product) {
      // If the product is not found, handle the error (e.g., redirect to an error page)
      return res.status(404).render('error', { message: 'Product not found' });
    }

    // Render the product-detail page with the product details
    res.render('user/productdetails', { product, user: user});
  } catch (error) {
    console.error('Error rendering product detail page:', error.message);
    res.status(500).render('error', { message: 'Error rendering product detail page', error: error.message });
  }
};



exports.addToCart = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { productId, quantity } = req.body;

    // Call the addToCart function to add the product to the cart
    await userHelper.addToCart(userId, productId, quantity);

    // Redirect back to the cart display
    res.redirect('/user/cart');
  } catch (error) {
    console.error('Error adding to cart:', error.message);
    res.status(500).render('error', { message: 'Error adding to cart', error: error.message });
  }
};



