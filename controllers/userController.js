const User = require('../models/usermodel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Product = require('../models/product');
const Cart = require('../models/cart');
const Wishlist = require('../models/wishlist');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const Order = require('../models/order');
const Coupon = require('../models/coupen');
const path = require('path');
const fs = require('fs');
const userHelper = require('../helpers/userHelper');
const ProductHelper = require('../helpers/productHelper');
const cartHelper = require('../helpers/cartHelper');
const productHelper = require('../helpers/productHelper');
const stripe = require('stripe')('sk_test_51OcjKQSAozOuGu5VBxZyokvRH8WSyNnWvtftzfloHNeWJIPL9tDpx8drMmAF24wukrPdSyp3yTJrT4vbOTwYQQ0n00EjxmHpCC');

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
      req.flash('error', 'Your account is blocked. Please contact support for assistance.');
     
    }

    userHelper.generateTokenAndSetSession(user, req);
    res.redirect('/user/index')

  } catch (error) {
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
    
    const { username, email, password, name, phone } = req.body;

    if (!userHelper.isValidPasswordFormat(password)) {
      return res.status(400).send('Invalid password format');
    }

    if (!userHelper.isValidPhoneNumberFormat(phone)) {
      throw new Error('Invalid phone number format');
  }

 await userHelper.registerUser({
    username,
    email,
    password,
    name,
    phone,
  
});

const registeredUser = await User.findOne({ username });
userHelper.generateTokenAndSetSession(registeredUser, req);
   
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
    const { username, email, name, phone, address, oldPassword, newPassword, confirmPassword } = req.body;

    // Validate old password
    const isPasswordValid = await userHelper.validatePassword(req.userDetails, oldPassword);

    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid old password' });
    }

    // Validate new password and confirm password
    if (newPassword && newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'New password and confirm password do not match' });
    }

    // Update user details
    req.userDetails.username = username;
    req.userDetails.email = email;
    req.userDetails.name = name;
    req.userDetails.phone = phone;
  

    // Update the password only if a new password is provided
    if (newPassword) {
      req.userDetails.password = await bcrypt.hash(newPassword, 10);
    }

    // Save the updated user details
    await req.userDetails.save();

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

    
   if (!cart || cart.items.length === 0) {
    return res.render('user/empty-cart', { userDetails: req.userDetails });
  }

   const subtotal = cartHelper.calculateSubtotal(cart);

    res.render('user/shopping-cart',{userDetails:req.userDetails,cart,subtotal,discountedTotal:subtotal});
  
  } catch (error) {
    console.error('Error rendering login page:', error.message);
    res.status(500).render('error', { message: 'Error rendering login page', error: error.message });
  }
};

exports.renderEmptyCart = async(req,res)=>{
  res.render('user/empty-cart',{userDetails:req.userDetails})
}


exports.addToCart = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.session.userId;
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

    const cartItem = cart.items[itemIndex - 1];

    if (!cartItem) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    cartItem.quantity = newQuantity;
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

    if (!productId) {
      return res.status(400).json({ error: 'Missing or invalid product ID' });
    }

    const cart = await cartHelper.getCart(req.userDetails);

    if (!cart) {
      return res.render('user/empty-cart', { userDetails: req.userDetails });
    }

    const subtotal = cartHelper.calculateSubtotal(cart);

    cart.items = cart.items.filter(item => item.product._id.toString() !== productId);
    await cartHelper.updateCart(cart);
    if (cart.items.length === 0) {
      return res.render('user/empty-cart', { userDetails: req.userDetails });
    }

    await cartHelper.updateCart(cart);

  
    console.log('Cart items after removal:', cart.items);

    res.render('user/shopping-cart', { userDetails: req.userDetails, cart, subtotal, discountedTotal: subtotal });

  } catch (error) {
    console.error('Error in removeProduct:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};




// exports.applyCoupen = async (req, res) => {
//   try {
//       const { coupon } = req.body.coupon;
      

      
//       if (!coupon) {
//           return res.json({ success: false, message: 'Coupon code is required.' });
//       }

    
//       const foundCoupon = await Coupon.findOne({ code: coupon });
      
    
//       if (!foundCoupon) {
//           return res.json({ success: false, message: 'Invalid coupon code.' });
//       }

  
//       const cart = await cartHelper.getCart(req.userDetails);

//       const subtotal = cartHelper.calculateSubtotal(cart);
      
//       const discountedTotal = cartHelper.calculateDiscountedTotal(subtotal, foundCoupon);

//       cart.appliedCoupon = foundCoupon._id;
//       console.log('distot:',discountedTotal)
//       // await cart.save();

//       res.json({ success: true, discountedTotal });
        
//   } catch (error) {
//       console.error('Error in applyCoupen:', error);
//       return res.status(500).json({ error: 'Internal server error' });
//   }
// };





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
  



  exports.wishlistAddToCart = async (req, res) => {
    try {
      const productId = req.params.productId;
    
  
      // Assuming Wishlist model has a reference to the Product model
      const wishlistItem = await Wishlist.findOne({ user: req.userDetails, product: productId }).populate('product');
  
      if (!wishlistItem) {
        return res.status(404).json({ error: 'Product not found in the wishlist' });
      }
  
      // Add the product to the cart
      await cartHelper.addToCart(req.userDetails, productId, 1);
      await Wishlist.findOneAndDelete({ user: req.userDetails, product: productId });
  
      // Optionally, you may want to remove the product from the wishlist after adding to the cart
      
res.redirect('user/wishlist')  
    
    } catch (error) {
      console.error('Error adding to cart:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
  

  exports.renderCheckout = async (req, res) => {
    try {
      // Fetch the user's cart
      const cart = await Cart.findOne({ user: req.userDetails._id }).populate('items.product');
  
      // Fetch the latest order
      const latestorder = await Order.findOne({ user: req.userDetails._id }).sort({ createdAt: -1 });
  
      // Calculate subtotal and total from the latest order
      const subtotal = latestorder.subtotal;
      const total = latestorder.total;
  
      // Render the checkout page with the necessary data
      res.render('user/checkout', {
        userDetails: req.userDetails,
        cart,
        subtotal,
        total,
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

    // Extract shipping address details, order totals, and coupon from the request body
    const { street, city, state, postalCode, coupon } = req.body;

    // Log the coupon code to the console
    console.log('Coupon Code:', coupon);

    // Find the coupon in the database
    const foundCoupon = await Coupon.findOne({ code: coupon });

    // Log the coupon code to the console
    console.log('Coupon found:', foundCoupon);

    // Calculate order totals
    const subtotal = cartHelper.calculateSubtotal(cart);
    let discountedTotal = subtotal;

    // Check if a coupon was found
    if (foundCoupon) {
      discountedTotal = cartHelper.calculateDiscountedTotal(subtotal, foundCoupon);
    }

    // Validate the shipping address fields
    if (!street || !city || !state || !postalCode) {
      return res.status(400).render('error', { message: 'Invalid shipping address' });
    }

    // Create a new order instance with shipping address, coupon, and update totals
    const order = new Order({
      user: req.userDetails._id,
      items: cart.items,
      subtotal: subtotal,
      total: discountedTotal,
      appliedCoupon: foundCoupon, // Save the found coupon in the order
      shippingAddress: {
        street: street,
        city: city,
        state: state,
        postalCode: postalCode,
      },
      // Other order-related fields...
    });

    // Save the order to the database
    await order.save();

    cart.total = discountedTotal; // Use the discountedTotal for the totalPrice
    cart.subtotal = subtotal;

    // Save the updated cart
    await cart.save();
    // Update the user's cart (clear items, update inventory, etc.)
    // ...

    res.redirect('/user/checkout');
  } catch (error) {
    console.error('Error submitting order:', error.message);
    res.status(500).render('error', { message: 'Error submitting order', error: error.message });
  }
};

exports.handlePayment = async(req,res)=>{
   const selectedPaymentMethod = req.body.paymentMethod;

  // Check the selected payment method
  if (selectedPaymentMethod === 'cardPayment') {
    return res.redirect('/user/stripe-payment');

  } else if (selectedPaymentMethod === 'cashOnDelivery') {
    // Redirect to the route for cash on delivery payment
    return res.redirect('/cash-on-delivery');

  } else if (selectedPaymentMethod === 'razorPay') {
    // Redirect to the route for Google Pay payment
    return res.redirect('/Razor-pay');
  }
}



exports.renderStripePayment = async(req,res)=>{
  res.render('user/stripe-payment',{userDetails: req.userDetails}); // Create a new view for the Stripe payment form
}



exports.handleStripePayment = async(req,res)=>{
  const { subtotal, discountedTotal } = req.body; // Get necessary data from the form

  try {
    // Create a PaymentIntent to confirm the payment with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(discountedTotal * 100), // Amount in cents
      currency: 'usd',
    });

    

    // Render the confirmation page with the payment intent client secret
    res.render('stripe-confirmation', { clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Error processing Stripe payment:', error.message);
    res.status(500).render('error', { message: 'Error processing Stripe payment', error: error.message });
  }
}



exports.handleProcessPayment = async (req, res) => {
  const paymentMethodId = req.body.payment_method_id;

  try {
    // Create a PaymentIntent to confirm the payment with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 2000, // Amount in cents (e.g., $20.00)
      currency: 'usd',
      payment_method: paymentMethodId,
    
    });

    const orderId = generateOrderId();
    console.log('orderid:',orderId);


    // Send a success response to the client
    res.status(200).json({
      orderId,
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    console.error('Error processing Stripe payment:', error.message);
    res.status(500).send({ error: error.message });
  }
}

function generateOrderId() {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8); // Random string with 6 characters
  return `ORDER-${timestamp}-${randomString}`;
}



exports.saveOrder = async (req, res) => {
  const bodyString = req.body.toString();
  const { orderId, paymentId } = JSON.parse(bodyString);
  console.log('Request Body:', JSON.parse(req.body.toString()));
  console.log('use:', req.userDetails);

  try {
    // Validate the presence of orderId, paymentId, and user in the request
    if (!orderId || !paymentId || !req.userDetails) {
      return res.status(400).json({ error: 'Invalid request data' });
    }

    console.log('order:', orderId);

    // Find the user's latest order
    const latestOrder = await Order.findOne({ user: req.userDetails._id }).sort({ createdAt: -1 });
    console.log('lastorder:', latestOrder);
    // Update the latest order with payment details
    if (latestOrder) {
      latestOrder.payment = {
        orderId:orderId,
        paymentId: paymentId,
        orderDate: new Date(), 
        status: 'pending',
      };
      console.log('Updated payment:', latestOrder.payment.paymentId);
      // Save the updated order to the database
      await latestOrder.save();

      const userCart = await Cart.findOne({ user: req.userDetails._id });
      userCart.items = [];
      await userCart.save();

      res.status(200).json({ success: true });
    } else {
      // If no order is found, you might want to handle this case accordingly
      return res.status(404).json({ error: 'No order found for the user' });
    }
  } catch (error) {
    console.error('Error updating order with payment details:', error.message);
    res.status(500).json({ error: error.message });
  }
};


exports.renderThankyou = async(req,res)=>{
  res.render('user/thankyou',{userDetails: req.userDetails}); // Create a new view for the Stripe payment form
}


exports.renderOrderPage = async (req, res) => {

    try {
      // Retrieve user's order history with populated product details
      const orderHistory = await Order.find({ user: req.userDetails })
        .populate({
          path: 'items.product',
          select: 'name image', // Select only necessary fields from the Product model
        })
        .sort({ createdAt: -1 });
  
      // Render a view with the order history
      res.render('user/orderHistory', { orderHistory,userDetails:req.userDetails });
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  };