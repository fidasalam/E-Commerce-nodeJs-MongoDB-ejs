const User = require('../models/usermodel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Product = require('../models/product');
const Cart = require('../models/cart');
const Wishlist = require('../models/wishlist');
const mongoose = require('mongoose');

const Order = require('../models/order');
const Coupon = require('../models/coupen');
const path = require('path');
const fs = require('fs');
const userHelper = require('../helpers/userHelper');
const ProductHelper = require('../helpers/productHelper');
const cartHelper = require('../helpers/cartHelper');
const productHelper = require('../helpers/productHelper');

const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret-key';




exports.displayHomepage = async (req, res) => {
  try {

   const categories = await ProductHelper.getAllCategories();
   const products = await Product.find();


   res.render('user/index', { products, categories,userDetails:req.userDetails});
 } catch (error) {
    console.error('Error rendering index page:', error.message);
    res.status(500).render('error', { message: 'Error rendering index page', error: error.message });
  }
};



exports.renderLoginPage = async (req, res) => {
  try {
   
    
    res.render('user/login', { userDetails:req.userDetails});
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

    if (user.isBlocked) {
      return res.status(403).json({ error: 'Your account is blocked. Please contact support for assistance.' });
    }

    // Generate a JWT token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });

    // Store the token and userId in the session
    req.session.token = token;
    req.session.userId = user._id;
  
    res.redirect('/user/index')

  } catch (error) {
    console.error('Error during login:', error.message);
    res.status(401).render('user/login', { error: error.message });
  }
};


exports.handleLogout = (req, res) => {
  try {
    
    req.flash('success', 'Logged out successfully');

    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
        res.status(500).send('Internal Server Error');
      } else {
      
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
    
    
    res.render('user/register', { userDetails:req.userDetails});
  } catch (error) {
    console.error('Error rendering login page:', error.message);
    res.status(500).render('error', { message: 'Error rendering login page', error: error.message });
  }
};


exports.handleRegister = async (req, res) => {
 
  try {
    
     await userHelper.registerUser(req.body);
    res.redirect('/user/index');
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

    res.render('user/profile', { userDetails:req.userDetails});

  } catch (error) {
    console.error('Error rendering profile page:', error.message);
    res.status(500).render('error', { message: 'Error rendering profile page', error: error.message });
  }
};




exports.handleEditProfile = async (req, res) => {
  try {
  
    const { username, email, name, phone, address } = req.body;
    await User.findByIdAndUpdate(req.userDetails, {
      username,
      email,
      name,
      phone,
      address,
    });

    req.flash('success', 'Profile updated successfully');

    res.redirect('/user/profile');
  } catch (error) {
    console.error('Error handling edit profile:', error.message);
    res.status(500).render('error', { message: 'Error handling edit profile', error: error.message });
  }
};




exports.renderProductDetail = async (req, res) => {
  try {
    
   
    const productId = req.params.productId;
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).render('error', { message: 'Product not found' });
    }

    res.render('user/productdetails', { product,  userDetails:req.userDetails});

  } catch (error) {
    console.error('Error rendering product detail page:', error.message);
    res.status(500).render('error', { message: 'Error rendering product detail page', error: error.message });
  }
};







exports.renderShoppingCart = async (req, res) => {
  try {
  
   const cart = await cartHelper.getCart(req.userId);
   const subtotal = cartHelper.calculateSubtotal(cart);

    res.render('user/shopping-cart',{userDetails:req.userDetails,cart,subtotal,discountedTotal:subtotal});
  
  } catch (error) {
    console.error('Error rendering login page:', error.message);
    res.status(500).render('error', { message: 'Error rendering login page', error: error.message });
  }
};


exports.addToCart = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.session.userId;

    // // Validate that productId is a valid ObjectId
    // if (!mongoose.Types.ObjectId.isValid(productId)) {
    //   throw new Error('Invalid product ID');
    // }
    await cartHelper.addToCart(userId, productId, 1);

    res.redirect(`/user/productdetails/${productId}`);
  } catch (error) {
    console.error('Error adding to cart:', error.message);
    res.status(500).render('error', { message: 'Error adding to cart', error: error.message });
  }
};




exports.updateQuantity = async (req, res) => {
  try {
    const itemIndex = req.body.itemIndex;
    const newQuantity = req.body.newQuantity

    const cart = await cartHelper.getCart(req.userDetails);
    const subtotal = await cartHelper.calculateSubtotal(cart);
    

    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    // Update quantity and total in the cart
    const cartItem = cart.items[itemIndex - 1];

    if (!cartItem) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    cartItem.quantity = newQuantity;

    // // Calculate the new total
    // const pricePerUnit = parseFloat(cartItem.product.price || 0);
    // const newTotal = pricePerUnit * newQuantity;

    // cartItem.total = newTotal;

    await cart.save();
   res.json({ newTotal: subtotal});
  } catch (error) {
    console.error('Error updating quantity:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};




exports.removeProduct = async (req, res) => {
  try {
    const productId = req.body.productId;

    const cart = await cartHelper.getCart(req.userDetails);
    const subtotal = cartHelper.calculateSubtotal(cart);

    
    if (!productId) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

  
    cart.items = cart.items.filter(item => item.product._id.toString() !== productId);

    await cartHelper.updateCart(cart);
    
    
    if (!cart.items.length ) {
      res.render('user/index', { userDetails: req.userDetails});
    } else {
    
      res.render('user/shopping-cart', { userDetails: req.userDetails, cart, subtotal, discountedTotal:subtotal });
    }
  } catch (error) {
  
    console.error('Error in removeProduct:', error);

    return res.status(500).json({ error: 'Internal server error' });
  }
};




exports.applyCoupen = async (req, res) => {
  try {
      const { coupon } = req.body;
      

      
      if (!coupon) {
          return res.json({ success: false, message: 'Coupon code is required.' });
      }

    
      const foundCoupon = await Coupon.findOne({ code: coupon });
      
    
      if (!foundCoupon) {
          return res.json({ success: false, message: 'Invalid coupon code.' });
      }

  
      const cart = await cartHelper.getCart(req.userDetails);

      const subtotal = cartHelper.calculateSubtotal(cart);
      
      const discountedTotal = cartHelper.calculateDiscountedTotal(subtotal, foundCoupon);

      cart.appliedCoupon = foundCoupon._id;
      
      await cart.save();

      res.json({ success: true, discountedTotal });
        
  } catch (error) {
      console.error('Error in applyCoupen:', error);
      return res.status(500).json({ error: 'Internal server error' });
  }
};





exports.renderProductsByCategory = async (req, res) => {
  try {
    const selectedCategory = req.query.categoryId;

    let products;

    if (!selectedCategory) {
    
      products = await Product.find();
    } else {
      products = await productHelper.getProductsByCategoryName(selectedCategory);
    }
    
    res.render('user/product', {
      selectedCategory,
      products,
      userDetails: req.userDetails,
  
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};


exports.renderSearchProducts = async (req, res) => {
  try {
    res.render('user/search', { userDetails: req.userDetails });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};

exports.searchProducts = async (req, res) => {
  try {
    const searchQuery = req.body.searchProduct; // Adjust this based on your form input name attribute
    const searchResults = await ProductHelper.performSearch(searchQuery);

    res.render('user/search', {
      searchResults,
      userDetails: req.userDetails,
    
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};








exports.renderWishlist = async (req, res) => {
  try {

    const wishlist = await Wishlist.find({ user:req.userDetails}).populate('product');
    console.log('Wishlist:', wishlist);
    res.render('user/wish', { wishlist, userDetails:req.userDetails });
  } catch (error) {
    console.error('Error rendering wishlist view:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


exports.addWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
  
    const existingWishlistItem = await Wishlist.findOne({ user: req.userDetails, product: productId });
    if (existingWishlistItem) {
      return res.status(400).json({ message: 'Product already in wishlist' });
    }

    await Wishlist.create({ user:req.userDetails, product: productId });
    
    res.sendStatus(200); 
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    res.status(500).json({ message: 'Error adding to wishlist' });
  }
};


exports.removeWishlist = async (req, res) => {
  
    try {
      const { productId } = req.params;
      const result = await Wishlist.findOneAndDelete({ user: req.userDetails, product: productId });
  
      if (!result) {
        return res.status(404).json({ message: 'Product not found in wishlist' });
      }
  
      res.sendStatus(200); 
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      res.status(500).json({ message: 'Error removing from wishlist' });
    }
  };


  exports.renderCheckout = async (req, res) => {
  try {
    // Fetch the user's cart
    const cart = await Cart.findOne({ user: req.userDetails._id }).populate('items.product');
    
    const couponCode = cart.appliedCoupon ? cart.appliedCoupon.code : null;   
    const subtotal =cartHelper.calculateSubtotal(cart);
    // const discountedTotal = cartHelper.calculateDiscountedTotal(subtotal, couponCode);
console.log("discounted:",discountedTotal)
console.log("sub:",subtotal)
  
    const latestorder = await Order.findOne({ user: req.userDetails._id }).sort({ createdAt: -1 });

    // Render the checkout page with the necessary data
    res.render('user/checkout', {
      userDetails: req.userDetails,
      cart,
      subtotal,
      discountedTotal,
      latestorder
      // Add more values as needed
    });
  } catch (error) {
    console.error('Error rendering checkout page:', error.message);
    res.status(500).render('error', { message: 'Error rendering checkout page', error: error.message });
  }
};


// Define the route to handle the post request from the cart



 exports.handleCheckout = async (req, res) => {
  try {
    // Fetch the user's cart
    const cart = await Cart.findOne({ user: req.userDetails }).populate('items.product');

    // Extract shipping address details and order totals from the request body
    const { street, city, state, postalCode,coupon } = req.body;
    
console.log('coupen:',coupon);

    const foundCoupon = await Coupon.findOne({ code: coupon });
    const subtotal = cartHelper.calculateSubtotal(cart);
    const discountedTotal = cartHelper.calculateDiscountedTotal(subtotal, foundCoupon);

    // Validate the shipping address fields
    if (!street || !city || !state || !postalCode) {
      return res.status(400).render('error', { message: 'Invalid shipping address' });
    }

    // Create a new order instance with shipping address and update totals
    const order = new Order({
      user: req.userDetails._id,
      items: cart.items,
      subtotal: subtotal, // Use the subtotal from the request body
      total: discountedTotal, // Use the total from the request body
      shippingAddress: {
        street: street,
        city: city,
        state: state,
        postalCode: postalCode,
        coupon:coupon
      },
      // Other order-related fields...
    });

    // Save the order to the database
    await order.save();

    // Update the user's cart (clear items, update inventory, etc.)
    // ...

    res.redirect('/user/checkout');
  } catch (error) {
    console.error('Error submitting order:', error.message);
    res.status(500).render('error', { message: 'Error submitting order', error: error.message });
  }
};

