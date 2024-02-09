const User = require('../models/usermodel');
const Cart = require('../models/cart');
const Wishlist = require('../models/wishlist');
const Coupon = require('../models/coupon');
const Message = require('../models/message')
const Order = require('../models/order');
const Product = require('../models/product');

const userHelper = require('../helpers/userHelper');
const ProductHelper = require('../helpers/productHelper');
const cartHelper = require('../helpers/cartHelper');
const productHelper = require('../helpers/productHelper');
const paymentHelper = require('../helpers/paymentHelper');

const bcrypt = require('bcryptjs');
const nodemailerConfig=require('../config/nodemailerConfig')
const nodemailer = require('nodemailer');
const otpGenerator = require('otp-generator');
const transporter = nodemailer.createTransport(nodemailerConfig);


function generateOTP() {
  return otpGenerator.generate(6, { digits: true, alphabets: false, upperCase: false, specialChars: false });
}



module.exports = {
  displayHomepage: async (req, res) => {
    const categories = await ProductHelper.getAllCategories();
    const products = await ProductHelper.getFewProducts();
    res.render('user/index', { products, categories, userDetails: req.userDetails });
  },

  //login page
  renderLoginPage: async (req, res) => {
    res.render('user/login', { userDetails: req.userDetails });
  },


  // user login
  handleLogin: async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    const guestUserId = null;
    const guestCart = await cartHelper.getCart(guestUserId);
    

    if (!user || !(await bcrypt.compare(password, user.password))) {
      req.flash('error', 'Invalid credentials');
      return res.redirect('/user/login');
    }

    if (user.isBlocked) {
      req.flash('error', 'Your account is blocked. Please contact support for assistance.');
    }

    userHelper.generateTokenAndSetSession(user, req);

    if(guestCart){
    await cartHelper.mergecart(user, guestCart);
    }
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

  // register page
  renderRegisterPage: async (req, res) => {
    res.render('user/register', { userDetails: req.userDetails });
  },

// user registration
handleRegister: async (req, res) => {
  try {
    const { username, email, password, name, phone } = req.body;
    if (!userHelper.isValidPasswordFormat(password)) {
      req.flash('error', 'Invalid password format');
      return res.redirect('/user/register');
    }

    if (!userHelper.isValidPhoneNumberFormat(phone)) {
      req.flash('error', 'Invalid phone number format');
      return res.redirect('/user/register');
    }

    if (!userHelper.isValidUsernameFormat(username)) {
      req.flash('error', 'Invalid username format. Only alphabets are allowed.');
      return res.redirect('/user/register');
    }

    if (!userHelper.isValidUsernameFormat(name)) {
      req.flash('error', 'Invalid name format. Only alphabets are allowed.');
      return res.redirect('/user/register');
    }

  
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
    res.redirect('/user/index');
  } catch (error) {
    console.error(error);

    if (error.code === 11000) {
      return res.status(400).send('Username or email already in use.');
    }

    res.status(500).send('Internal Server Error');
  }
},

  // profile page
  renderProfilePage: async (req, res) => {
    res.render('user/profile', { userDetails: req.userDetails });
  },



  //editing user profile
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

  

  //forgotpassword
  renderforgotpassword: async (req, res) => {
    res.render('user/forgotPassword',{userDetails:req.userDetails})
  },

  //handle forgotpassword
  forgotpassword: async (req, res) => {
    const { email } = req.body;
    const user = await userHelper.getUserByEmail(email);
  
      if (!user) {
        return res.status(404).send('User not found. Please check the email address.');
      }
  
      const otp = generateOTP();
      await userHelper.updateUserOTP(email, otp);

      const mailOptions = {
        to: email,
        subject: 'Forgot Password OTP',
        text: `Your OTP for password reset is: ${otp}`
      };
  
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error sending email:', error);
          return res.status(500).send('Error sending OTP via email.');
        }

        res.render('user/enterOTP',{userDetails:req.userDetails,email:user.email})
      });
    } ,


    //
  verifyOtp: async (req, res) => {
      const { email, otp } = req.body;
      const user = await userHelper.getUserByEmail(email);
        if (!user) {
          return res.status(404).send('User not found. Please check the email address.');
        }
        if (otp === user.otp) {
          res.render('user/passwordreset',{userDetails:req.userDetails,email})
        
        } else {
          res.status(401).send('Incorrect OTP. Please try again.');
        }
      } ,

  resetPassword:async (req, res) => {
        const { email, newPassword } = req.body;
        await userHelper.updateUserPassword(email, newPassword);
         res.redirect('/user/index')
        } ,

  renderEnterOTPPage: async(req,res)=>{
          res.render('user/enterOTP', { userDetails: req.userDetails });
        },
        


  //  product details page
 renderProductDetail: async (req, res) => {
  const productId = req.params.productId;
  const product = await Product.findById(productId);
  if (!product) {
       return res.status(404).render('error', { message: 'Product not found' });
   }
      res.render('user/productdetails', { product, userDetails: req.userDetails });
},

    // products by category
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


      
  
    // search products page
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
     await userHelper.saveMessage(msg, email);
       req.flash('message', 'Message sent successfully!');
       req.flash('error', 'Message sent successfully!');
  
     res.redirect('/user/contact')
    },
  


  //cart
  renderShoppingCart: async (req, res) => {
    const cart = await cartHelper.getCart(req.userId);
    if (!cart || cart.items.length === 0) {
      return res.render('user/empty-cart', { userDetails: req.userDetails });
    }
   const subtotal = cartHelper.calculateSubtotal(cart);
    res.render('user/shopping-cart', { userDetails: req.userDetails, cart, subtotal, discountedTotal: subtotal });
  },

  //  empty cart page
  renderEmptyCart: async (req, res) => {
    res.render('user/empty-cart', { userDetails: req.userDetails });
  },


  // Add product to the cart
  addToCart: async (req, res) => {
    try {
      const { productId } = req.body;
      const userId = req.session.userId;
      const product = await Product.findById(productId);
      
      if (!product || product.inStock <= 0) {
        req.flash('error', 'Product is out of stock.');
        return res.redirect(`/user/productdetails/${productId}?addedToCart=false`);
      }
  
      await cartHelper.addToCart(userId, productId, 1);
      return res.redirect(`/user/productdetails/${productId}?addedToCart=true`);
    } catch (error) {
      console.error('Error adding product to cart:', error);
      // Handle the error as needed, such as displaying an error page
      res.status(500).send('Internal Server Error');
    }
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



  //  wishlist
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
   const wishlistItem = await Wishlist.findOne({ user: req.userDetails, product: productId }).populate('product');
   if (!wishlistItem) {
      return res.status(404).json({ error: 'Product not found in the wishlist' });
    }

    await cartHelper.addToCart(req.userDetails, productId, 1);
    await Wishlist.findOneAndDelete({ user: req.userDetails, product: productId });
    res.redirect('/user/wishlist');
  },



  //ApplyCoupon
  applyCoupon: async (req, res) => {

    const { couponCode } = req.body;
    const coupon = await Coupon.findOne({ code: couponCode });
    const cart = await Cart.findOne({ user: req.userDetails._id }).populate('items.product');
    
    const subtotal = cartHelper.calculateSubtotal(cart);
    const discountedTotal=cartHelper.calculateDiscountedTotal(subtotal,coupon)

    const roundedDiscountedTotal = Math.round(discountedTotal);

    cart.subtotal=subtotal
    cart.total=roundedDiscountedTotal;
    cart.appliedCoupon=coupon;
    await cart.save();
    console.log('cart',cart);

    res.json({ discountedTotal: roundedDiscountedTotal });
  },


  handleCoupon: async (req, res) => {
    const userId = req.userDetails;
    const cart = await Cart.findOne({ user: req.userDetails._id }).populate('items.product');
    const coupon = await cartHelper.applyCouponToCart(userId,cart);
    res.json({ coupon });
},


  // checkout page
  renderCheckout: async (req, res) => {
    const cart = await Cart.findOne({ user: req.userDetails._id }).populate('items.product');
    const latestorder = await Order.findOne({ user: req.userDetails._id }).sort({ createdAt: -1 });
     res.render('user/checkout', {
      userDetails: req.userDetails,
      cart,
      latestorder,
    });
  },


  // checkout process
  handleCheckout: async (req, res) => {
   const { street, city, state, postalCode ,subtotal, discountedTotal} = req.body;
  if (!street || !city || !state || !postalCode) {
      return res.status(400).render('error', { message: 'Invalid shipping address' });
    }

    console.log('subtotal:',subtotal);
    console.log('dicscount:',discountedTotal);
    req.userDetails.shippingAddress = {
      street: street,
      city: city,
      state: state,
      postalCode: postalCode,
    };
    await req.userDetails.save();
    const cart = await Cart.findOne({ user: req.userDetails._id }).populate('items.product');

    cart.subtotal = subtotal;
    await cart.save();

    console.log('cart:',cart)
    res.redirect('/user/checkout');
  },


  //  Razorpay payment
  razorPay: async (req, res) => {
    const { discountedTotal } = req.body;
    const order = await paymentHelper.createRazorpayOrder(discountedTotal);

    res.render('user/razorPay', { order ,user:req.userDetails});
  },

  verifyPayment: async (req, res) => {
    const { payment, order } = req.body;
    const verificationResult = await paymentHelper.verifyRazorpayPayment(payment, order, req.userDetails);
    if (verificationResult === 'success') {
      res.status(200).json({ status: 'success' });
    } else {
      res.status(400).json({ status: 'error', error: verificationResult.error });
    }
  },

  renderrazorPayment: async (req, res) => {
    res.render('user/rayzorPay');
  },

  

  //  Cash On Delivery payment
  handleCashOnDelivery: async (req, res) => {
   const user=req.userDetails;
    const cart = await Cart.findOne({ user: user._id });
    const codPayment=await paymentHelper.createCODOrder(cart,user._id )
    if (codPayment === 'success') {
      res.render('user/thankyou', { userDetails: req.userDetails });
    }
   
   
  },



//stripe Payment
renderStripePayment : async(req,res)=>{
  res.render('user/stripe-payment',{userDetails: req.userDetails}); // Create a new view for the Stripe payment form
},

handleStripePayment: async (req, res) => {
  const { discountedTotal } = req.body;
  res.render('user/stripe-payment',{discountedTotal});
},


handleProcessPayment : async (req, res) => {
  
   const payment_method_id = req.body.payment_method_id;

  const { orderId, paymentId, clientSecret } = await paymentHelper.handleProcessPayment(req.userDetails, payment_method_id);
 res.status(200).json({ orderId, paymentId, clientSecret });
},

saveOrder : async (req, res) => {

  const bodyString = req.body.toString();
  const { orderId, paymentId } = JSON.parse(bodyString);
 
  const saveOrderResult = await paymentHelper.saveOrder(orderId, paymentId, req.userDetails);
  if (saveOrderResult==='success'){
  res.status(200).json({ success: true });
  }
  
},

  // Render thank you page
renderThankyou: async (req, res) => { 
      res.render('user/thankyou', { userDetails: req.userDetails });
    },
  
    // Render order history page
renderOrderPage: async (req, res) => {
      const orders = await Order.find({ user: req.userDetails }).populate('items.product');
      console.log('Order History:', orders);
  
      res.render('user/orderHistory', { orderHistory: orders, userDetails: req.userDetails });
    },

  
};



