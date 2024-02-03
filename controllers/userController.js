const User = require('../models/usermodel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Product = require('../models/product');
const Cart = require('../models/cart');
const Wishlist = require('../models/wishlist');
const Message = require('../models/message')
const mongoose = require('mongoose');
const Order = require('../models/order');
const Coupon = require('../models/coupon');
const path = require('path');
const fs = require('fs');
const userHelper = require('../helpers/userHelper');
const ProductHelper = require('../helpers/productHelper');
const cartHelper = require('../helpers/cartHelper');
const productHelper = require('../helpers/productHelper');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Razorpay = require('razorpay');
const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret-key';

const crypto = require('crypto');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

function generateOrderId() {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8); // Random string with 6 characters
  return `ORDER-${timestamp}-${randomString}`;
}


module.exports = {
  displayHomepage: async (req, res) => {
    const categories = await ProductHelper.getAllCategories();
    const products = await ProductHelper.getFewProducts();
    res.render('user/index', { products, categories, userDetails: req.userDetails });
  },

  // Render the login page
  renderLoginPage: async (req, res) => {
    res.render('user/login', { userDetails: req.userDetails });
  },

  // Handle user login
  handleLogin: async (req, res) => {
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
    res.redirect('/user/index');
  },

  // Handle user logout
  handleLogout: (req, res) => {
    req.flash('success', 'Logged out successfully');

    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
        res.status(500).send('Internal Server Error');
      } else {
        res.redirect('/user/login');
      }
    });
  },

  // Render the register page
  renderRegisterPage: async (req, res) => {
    res.render('user/register', { userDetails: req.userDetails });
  },

// Handle user registration
handleRegister: async (req, res) => {
  try {
    const { username, email, password, name, phone } = req.body;

    // Check for valid password format
    if (!userHelper.isValidPasswordFormat(password)) {
      req.flash('error', 'Invalid password format');
      return res.redirect('/user/register');
    }

    // Check for valid phone number format
    if (!userHelper.isValidPhoneNumberFormat(phone)) {
      req.flash('error', 'Invalid phone number format');
      return res.redirect('/user/register');
    }

    // Check for valid username format
    if (!userHelper.isValidUsernameFormat(username)) {
      req.flash('error', 'Invalid username format. Only alphabets are allowed.');
      return res.redirect('/user/register');
    }

    // Check for valid name format
    if (!userHelper.isValidUsernameFormat(name)) {
      req.flash('error', 'Invalid name format. Only alphabets are allowed.');
      return res.redirect('/user/register');
    }

    // Register the user
    await userHelper.registerUser({
      username,
      email,
      password,
      name,
      phone,
    });

    // Generate token and set session
    const registeredUser = await User.findOne({ username });
    userHelper.generateTokenAndSetSession(registeredUser, req);

    // Redirect to the homepage or any other desired page
    res.redirect('/user/index');
  } catch (error) {
    console.error(error);

    if (error.code === 11000) {
      return res.status(400).send('Username or email already in use.');
    }

    res.status(500).send('Internal Server Error');
  }
},

  // Render the profile page
  renderProfilePage: async (req, res) => {
    res.render('user/profile', { userDetails: req.userDetails });
  },



  // Handle editing user profile
  handleEditProfile: async (req, res) => {
    const { username, email, name, phone, oldPassword, newPassword, confirmPassword } = req.body;
         
    const isPasswordValid = await userHelper.validatePassword(req.userDetails, oldPassword);
    if (!isPasswordValid) {
      req.flash('error', 'Invalid old password');
     }
         // Validate new password and confirm password
    if (newPassword && newPassword !== confirmPassword) {
      req.flash('error','New password and confirm password do not match' );
    }
    req.userDetails.username = username;
    req.userDetails.email = email;
    req.userDetails.name = name;
    req.userDetails.phone = phone;

      
    if (newPassword) {
      req.userDetails.password = await bcrypt.hash(newPassword, 10);
    }
    await req.userDetails.save();

    req.flash('success', 'Profile updated successfully');
    res.redirect('/user/profile');
  },




  // Render product details page
  renderProductDetail: async (req, res) => {
    const productId = req.params.productId;
    const product = await Product.findById(productId);
    if (!product) {
         return res.status(404).render('error', { message: 'Product not found' });
     }
        res.render('user/productdetails', { product, userDetails: req.userDetails });
  },


    // Render products by category
    renderProductsByCategory: async (req, res) => {
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
    },
  
    // Render search products page
    renderSearchProducts: async (req, res) => {
      res.render('user/search', { userDetails: req.userDetails });
    },
  
    // Search products
    searchProducts: async (req, res) => {
      const searchQuery = req.body.searchProduct;
      const searchResults = await ProductHelper.performSearch(searchQuery);
  
      res.render('user/search', {
        searchResults,
        userDetails: req.userDetails,
      });
    },
  

  //Render Contact
  renderContact: async (req, res) => {
    res.render('user/contact', { userDetails: req.userDetails });
  },

  handleContact:async (req, res) => {
    
      const { msg, email } = req.body;
      const newMessage = new Message({ msg, email });
       await newMessage.save();
       req.flash('message', 'Message sent successfully!');
       req.flash('error', 'Message sent successfully!');
  
     res.redirect('/user/contact')
    },
  


  // Render shopping cart
  renderShoppingCart: async (req, res) => {
    const cart = await cartHelper.getCart(req.userId);

    if (!cart || cart.items.length === 0) {
      return res.render('user/empty-cart', { userDetails: req.userDetails });
    }

    const subtotal = cartHelper.calculateSubtotal(cart);
    res.render('user/shopping-cart', { userDetails: req.userDetails, cart, subtotal, discountedTotal: subtotal });
  },

  // Render empty cart page
  renderEmptyCart: async (req, res) => {
    res.render('user/empty-cart', { userDetails: req.userDetails });
  },


  // Add product to the cart
  addToCart: async (req, res) => {
    const { productId } = req.body;
    const userId = req.session.userId;
    await cartHelper.addToCart(userId, productId, 1);
    res.redirect(`/user/productdetails/${productId}`);
  },

  // Update product quantity in the cart
  updateQuantity: async (req, res) => {
    const itemIndex = req.body.itemIndex;
    const newQuantity = req.body.newQuantity;
    const cart = await cartHelper.getCart(req.userDetails);
    const subtotal =  cartHelper.calculateSubtotal(cart);
    const cartItem = cart.items[itemIndex - 1];
    cartItem.quantity = newQuantity;
    await cart.save();
    res.json({ newTotal: subtotal });
  },


  // Remove product from the cart
  removeProduct: async (req, res) => {
    const productId = req.body.productId;

    if (!productId) {
      return res.status(400).json({ error: 'Missing or invalid product ID' });
    }
    const cart = await cartHelper.getCart(req.userDetails);
    cart.items = cart.items.filter(item => item.product._id.toString() !== productId);
    await cartHelper.updateCart(cart);

    const subtotal = cartHelper.calculateSubtotal(cart);

    if (cart.items.length === 0) {
      return res.render('user/empty-cart', { userDetails: req.userDetails });
    }

    await cartHelper.updateCart(cart);
    res.render('user/shopping-cart', { userDetails: req.userDetails, cart, subtotal, discountedTotal: subtotal });
  },




  // Filter products based on criteria
  filterProducts: async (req, res) => {
    let filterCriteria = {};

    if (req.query.priceRange) {
      const [minPrice, maxPrice] = req.query.priceRange.split('-');
      filterCriteria.price = { $gte: parseFloat(minPrice), $lte: parseFloat(maxPrice) };
    }

    let sortCriteria = {};

    if (req.query.sortBy) {
      switch (req.query.sortBy) {
        case 'newness':
          sortCriteria.createdAt = -1;
          break;
        case 'priceLowToHigh':
          sortCriteria.price = 1;
          break;
        case 'priceHighToLow':
          sortCriteria.price = -1;
          break;
        default:
          break;
      }
    }

    const products = await Product.find(filterCriteria).sort(sortCriteria).limit(10);
    res.setHeader('Cache-Control', 'no-store');
    res.json({ products });
  },



  // Render wishlist
  renderWishlist: async (req, res) => {
    const wishlist = await Wishlist.find({ user: req.userDetails }).populate('product');
    res.render('user/wish', { wishlist, userDetails: req.userDetails });
  },


  // Add product to wishlist
  addWishlist: async (req, res) => {
    const { productId } = req.params;
    const existingWishlistItem = await Wishlist.findOne({ user: req.userDetails, product: productId });

    if (existingWishlistItem) {
      return res.status(400).json({ message: 'Product already in wishlist' });
    }
   await Wishlist.create({ user: req.userDetails, product: productId });
   res.sendStatus(200);
  },



  // Remove product from wishlist
  removeWishlist: async (req, res) => {
    const { productId } = req.params;
    const result = await Wishlist.findOneAndDelete({ user: req.userDetails, product: productId });
    if (!result) {
      return res.status(404).json({ message: 'Product not found in wishlist' });
    }
    res.sendStatus(200);
  },


  // Add wishlist item to cart
  wishlistAddToCart: async (req, res) => {
    const productId = req.params.productId;
    const wishlist = await Wishlist.find({ user: req.userDetails }).populate('product');
   const wishlistItem = await Wishlist.findOne({ user: req.userDetails, product: productId }).populate('product');
   if (!wishlistItem) {
      return res.status(404).json({ error: 'Product not found in the wishlist' });
    }

    await cartHelper.addToCart(req.userDetails, productId, 1);
    await Wishlist.findOneAndDelete({ user: req.userDetails, product: productId });
    res.redirect('/user/wishlist');
  },


  renderCoupon: async (req, res) => {
    
    const coupons = await Coupon.find();
        res.json(coupons);
   
  },


  handleCoupon: async (req, res) => {
    const userId = req.userDetails;
    const userOrders = await Order.find({ user: userId });
   const hasOrderHistory = userOrders.length > 0;
   res.json({ hasOrderHistory });
  },

  // Render checkout page
  renderCheckout: async (req, res) => {
    const cart = await Cart.findOne({ user: req.userDetails._id }).populate('items.product');
    const latestorder = await Order.findOne({ user: req.userDetails._id }).sort({ createdAt: -1 });
     res.render('user/checkout', {
      userDetails: req.userDetails,
      cart,
      latestorder,
    });
  },


  // Handle checkout process
  handleCheckout: async (req, res) => {
    const cart = await Cart.findOne({ user: req.userDetails }).populate('items.product');
    const { street, city, state, postalCode, coupon } = req.body;
    const foundCoupon = await Coupon.findOne({ code: coupon });
    const subtotal = cartHelper.calculateSubtotal(cart);
    let discountedTotal = subtotal;

    if (foundCoupon) {
      discountedTotal = cartHelper.calculateDiscountedTotal(subtotal, foundCoupon);
    }

    if (!street || !city || !state || !postalCode) {
      return res.status(400).render('error', { message: 'Invalid shipping address' });
    }

    cart.appliedCoupon= foundCoupon,
    cart.total = discountedTotal;
    cart.subtotal = subtotal;
    cart.appliedCoupon = foundCoupon;
    await cart.save();

    req.userDetails.shippingAddress = {
      street: street,
      city: city,
      state: state,
      postalCode: postalCode,
    };
    await req.userDetails.save();

    res.redirect('/user/checkout');
  },


  // Handle Razorpay payment
  razorPay: async (req, res) => {
    const { discountedTotal } = req.body;
    const order = await razorpay.orders.create({
      amount: Math.round(discountedTotal * 100),
      currency: 'INR',
      receipt: `order_${Date.now()}`,
      payment_capture: 1,
    });

    res.render('user/razorPay', { order ,user:req.userDetails});
  },


  // Verify Razorpay payment
  verifyPayment: async (req, res) => {
    const { payment, order } = req.body;
    const secret = process.env.RAZORPAY_KEY_SECRET;
    const generated_signature = crypto
      .createHmac('sha256', secret)
      .update(order + '|' + payment.razorpay_payment_id)
      .digest('hex');

    if (generated_signature === payment.razorpay_signature) {
      console.log('Payment verification successful');

      const cart = await Cart.findOne({ user: req.userDetails._id });
      const newOrder = new Order({
        user: req.userDetails._id,
        payment: {
          orderId: order,
          paymentId: payment.razorpay_payment_id,
          orderDate: new Date(),
          status: 'placed',
          paymentMethod:'RazorPayment'
        },
        items: cart.items,
      });

      await newOrder.save();

      console.log('neworder:', newOrder);
      res.status(200).json({ status: 'success' });
    } else {
      res.status(400).json({ status: 'error', error: 'Invalid signature' });
    }
  },

  // Render Razorpay payment page
  renderrazorPayment: async (req, res) => {
    res.render('user/rayzorPay');
  },

  

  // Handle Cash On Delivery payment
  handleCashOnDelivery: async (req, res) => {

    const userCart = await Cart.findOne({ user: req.userDetails._id });
    const orderId = generateOrderId();
    const cart = await Cart.findOne({ user: req.userDetails._id });
    const newOrder = new Order({
      user: req.userDetails._id,
      payment: {
        orderId: orderId,
        orderDate: new Date(),
        status: 'placed',
        paymentMethod:'COD'
      },
      items: cart.items,
    });

    await newOrder.save();

    res.render('user/thankyou', { userDetails: req.userDetails });
  },



    // Render thank you page
    renderThankyou: async (req, res) => {
      const userCart = await Cart.findOne({ user: req.userDetails._id });
      userCart.items = [];
      await userCart.save();
      res.render('user/thankyou', { userDetails: req.userDetails });
    },
  
    // Render order history page
    renderOrderPage: async (req, res) => {
      const orders = await Order.find({ user: req.userDetails }).populate('items.product');
      console.log('Order History:', orders);
  
      res.render('user/orderHistory', { orderHistory: orders, userDetails: req.userDetails });
    },


    renderStripePayment : async(req,res)=>{
  res.render('user/stripe-payment',{userDetails: req.userDetails}); // Create a new view for the Stripe payment form
},



handleStripePayment: async (req, res) => {
  const { discountedTotal } = req.body;
  res.render('user/stripe-payment',{discountedTotal});
},


handleProcessPayment : async (req, res) => {
  
  const cart = await cartHelper.getCart(req.userDetails);
  console.log('dis',cart.total)
  total=cart.total
  const amount = Math.round(total * 100);

  const paymentMethodId = req.body.payment_method_id;

    // Confirm the payment by creating a PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, 
      currency: 'INR',
      payment_method: paymentMethodId,
    
    });
    const orderId = generateOrderId();
    res.status(200).json({
      orderId,
      paymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret
    });

},





saveOrder : async (req, res) => {
  const bodyString = req.body.toString();
  const { orderId, paymentId } = JSON.parse(bodyString);
  const cart = await cartHelper.getCart(req.userDetails);
 
    // Validate the presence of orderId, paymentId, and user in the request
    if (!orderId || !paymentId || !req.userDetails) {
      return res.status(400).json({ error: 'Invalid request data' });
    }

    console.log('order:', orderId);
    console.log('pid:',paymentId);

    // Find the user's latest order
    const newOrder = new Order({
      user: req.userDetails._id,
      payment: {
        paymentId:paymentId,
        orderId: orderId,
        orderDate: new Date(),
        status: 'placed',
        paymentMethod:'StripePayment'
      },
      items: cart.items,
    });

    await newOrder.save();
    res.status(200).json({ success: true });
  
 
},


  
};

