const User = require('../models/usermodel');
const Cart = require('../models/cart');
const Wishlist = require('../models/wishlist');
const Coupon = require('../models/coupon');
const Order = require('../models/order');
const Rating = require('../models/rating');
const Product = require('../models/product');
const Banner = require('../models/banner');
const orderHelper = require('../helpers/orderHelper');
const userHelper = require('../helpers/userHelper');
const ProductHelper = require('../helpers/productHelper');
const cartHelper = require('../helpers/cartHelper');
const productHelper = require('../helpers/productHelper');
const paymentHelper = require('../helpers/paymentHelper');
const bcrypt = require('bcryptjs');





module.exports = {
  //home page
  displayHomepage: async (req, res) => {
    let categories = await ProductHelper.getAllCategories();
    let banners = await Banner.find({}).lean();
    let productsWithAvgRating = await ProductHelper.getTopRatedProducts();
    res.render('user/index', { products: productsWithAvgRating, categories, userDetails: req.userDetails,banners });
  },

  //login page
  renderLoginPage: async (req, res) => {
    res.render('user/login', { userDetails: req.userDetails });
  },


// user login
handleLogin: async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  const guestCart = req.session.guestCart;

  if (!user || !(await bcrypt.compare(password, user.password))) {
    req.flash('error', 'Invalid credentials');
    return res.redirect('/user/login');
  }
  if (user.isBlocked) {
    req.flash('error', 'Your account is blocked. Please contact support for assistance.');
  }
  userHelper.generateTokenAndSetSession(user, req);

  if (guestCart) {
    await cartHelper.mergecart(user, guestCart); // Pass req here
  
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
    const emailSent = req.session.emailSent || false;
    res.render('user/register', { userDetails: req.userDetails,emailSent}  );
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
;

      // Send registration email with redirect link
     const otp = await userHelper.sendRegistrationEmail(email);
        await userHelper.registerUser({
        username,
        email,
        password,
        name,
        phone,
        otp
    })

    const action ='Register';
    res.render('user/enterOTP',{userDetails:req.userDetails,email,action})
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
    const user =  await User.findOne({ email });
   await userHelper.sendRegistrationOTP(email);
   const action ='forgotPassword';
    res.render('user/enterOTP',{userDetails:req.userDetails,email:user.email,action})
    
    } ,


    verifyOtp: async (req, res) => {
      try {
        const { email, otp, action } = req.body;
        const success = await userHelper.verifyOTP(email, otp);
    
        if (success) {
          if (action === 'forgotPassword') {
            const userDetails = await userHelper.getUserByEmail(email);
            res.render('user/passwordreset', { userDetails, email });
          } else if (action === 'Register') {
            req.flash('success', 'Successfully registered. Please log in.');
            res.redirect('/user/login');
          } 
        } else {
          req.flash('error', 'Incorrect OTP. Please try again.');
          res.redirect('/user/enter-otp'); // Redirect back to OTP verification page
        }
      } catch (error) {
        res.status(500).send('Internal Server Error');
      }
    },
    

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
        const product = await Product.findById(productId).populate('coupon');
        const ratingData = await productHelper.getProductRatings(productId);
        if (!product) {
            return res.status(404).render('error', { message: 'Product not found' });
        }
            res.render('user/productdetails', { product, userDetails: req.userDetails,rating:ratingData });
      },


    // products by category
    renderProductsByCategory: async (req, res) => {
      let categories = await ProductHelper.getAllCategories();
      const selectedCategory = req.query.categoryId;
      let products;
      if (!selectedCategory) {
        products = await productHelper.getAllProducts()
      } else {
          products = await productHelper.getProductsByCategoryName(selectedCategory);
      }
      for (let product of products) {
        product.avgRating = await productHelper.calculateAverageRating(product._id);
      }
      res.render('user/product', {
          selectedCategory,
          products,
          userDetails: req.userDetails,categories
      });
  },
  

   // search suggestions
    searchSuggestions: async (req, res) => {
      const { query } = req.body;
      if (!query) {
        return res.json([]);
    }
      const products = await productHelper.getProductsByName(query);
      const suggestions = products.map(product => product.name);
      res.json(suggestions);
  } ,

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
      res.redirect('/user/contact')
    },
  


//cart
renderShoppingCart: async (req, res) => {
  let cart;

  if (req.userId) {
    cart = await cartHelper.getCart(req.userId);
  } else {
    cart = req.session.guestCart || { items: [] };

    await Promise.all(cart.items.map(async (item) => {
      const product = await Product.findById(item.product._id).populate('coupon').exec();
      item.product = { ...product.toJSON(), image: product.image };
  }));
  req.session.guestCart = cart;
    console.log('gcart',cart.items) // Retrieve guest cart from session or create a new one
  }

  if (!cart || cart.items.length === 0) {
    if (cart) { 
      await cartHelper.deleteCart(cart._id);
    }
    return res.render('user/empty-cart', { userDetails: req.userDetails });
  }

  let subtotal = cartHelper.calculateSubtotal(cart);
  let discountedTotal = subtotal;
  
  if (cart.appliedCoupon) {
    discountedTotal = cart.total;
  }

  // Update cart totals only if it's not a guest cart
  if (req.userId) {
    await cartHelper.updateCartTotals(cart, subtotal, discountedTotal);
  }

  res.render('user/shopping-cart', { userDetails: req.userDetails, cart, subtotal, discountedTotal });
},


  //  empty cart page
  renderEmptyCart: async (req, res) => {
    res.render('user/empty-cart', { userDetails: req.userDetails });
  },


  // Add product to the cart
  addToCart: async (req, res) => {
      const { productId } = req.body;
      const userId = req.session.userId;
      const product = await Product.findById(productId);
      if (!product || product.inStock <= 0) {
        req.flash('error', 'Product is out of stock.');
        return res.redirect(`/user/productdetails/${productId}?addedToCart=false`);
      }
   
      let cart =await cartHelper.addToCart(userId, productId, 1,req);
      console.log('sdfdssfd',cart)
      
      return res.redirect(`/user/productdetails/${productId}?addedToCart=true`);
    },

    
  // Update product quantity in the cart
  updateQuantity: async (req, res) => {
    const itemIndex = req.body.itemIndex;
    const newQuantity = req.body.newQuantity;
    let cart;
    if (req.userDetails) {
       cart = await cartHelper.getCart(req.userDetails);
      if (cart.appliedCoupon) {
          return res.json({ message: 'Remove Coupon and update your cart.' });
      }}
      else {
        cart = req.session.guestCart || { items: [] };
        console.log('cart',cart)

      }
    const updatedCart = await cartHelper.updateItemQuantity(cart, itemIndex, newQuantity,req.userDetails);
    const updatedSubtotal = cartHelper.calculateSubtotal(updatedCart);
    res.json({ newTotal: updatedSubtotal });
  },


  // Remove product from the cart
  removeProduct: async (req, res) => {
    const productId = req.body.productId;
    let cart;
    if (!productId) {
      return res.status(400).json({ error: 'Missing or invalid product ID' });
    }
    if (req.userDetails) {
      cart = await cartHelper.getCart(req.userDetails);
    } else {
      cart = req.session.guestCart || { items: [] };
    }
    await cartHelper.removeProductFromCart(cart, productId,req.userDetails);
    if (req.userDetails) {
    await cartHelper.updateCart(cart);
    }
    const subtotal = cartHelper.calculateSubtotal(cart);
    if (cart.items.length === 0) {
      if (req.userDetails) {
      await cartHelper.deleteCart(cart);
      await cartHelper.updateCart(cart);
      }
      return res.render('user/empty-cart', { userDetails: req.userDetails });
    }
   
    res.render('user/shopping-cart', { userDetails: req.userDetails, cart, subtotal, discountedTotal: subtotal });
  },


// Filter products based on criteria
filterProducts: async (req, res) => {
  try {
  
    let filterCriteria = {};
    let sortCriteria = {};
   // Parse price range
    if (req.query.priceRange) {
      const [minPrice, maxPrice] = req.query.priceRange.split('-').map(parseFloat);
      filterCriteria.price = { $gte: minPrice, $lte: maxPrice };
     }
     // Set sorting criteria
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
    const products = await Product.find(filterCriteria).sort(sortCriteria).limit(12).lean();
    res.setHeader('Cache-Control', 'no-store');
    res.json({ products });
  } catch (error) {
    console.error('Error filtering products:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
},



  //  wishlist
  renderWishlist: async (req, res) => {
    const wishlist = await Wishlist.find({ user: req.userDetails }).populate({
        path: 'product',
        populate: {
            path: 'coupon'
        }
    });
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
    const cart = await Cart.findOne({ user: req.userDetails._id }).populate({
      path: 'items.product',
      populate: {
          path: 'coupon'
      }
  });
    const subtotal = cartHelper.calculateSubtotal(cart);
    const discountedTotal=cartHelper.calculateDiscountedTotal(subtotal,coupon)
    const roundedDiscountedTotal = Math.round(discountedTotal);
    cart.subtotal=subtotal
    cart.total=roundedDiscountedTotal;
    cart.appliedCoupon=coupon;
    await cart.save();
    res.json({ message: 'Cart updated successfully' });
  
  },


  handleCoupon: async (req, res) => {
    const userId = req.userDetails;
    const cart = await Cart.findOne({ user: req.userDetails._id }).populate({
      path: 'items.product',
      populate: {
          path: 'coupon'
      }
  });
    const coupon = await cartHelper.applyCouponToCart(userId,cart);
    res.json({ coupon });
},


removeCoupon: async (req, res) => {
const cart = await cartHelper.getCart(req.userId);
const discountedTotal=cart.subtotal;
cart.appliedCoupon=null;
cart.total=discountedTotal;
await cart.save();
  res.json({ success: true ,discountedTotal});
},



  // checkout page
  renderCheckout: async (req, res) => {
    const cart = await Cart.findOne({ user: req.userDetails._id }).populate('items.product');
    const latestOrder = await Order.findOne({ user: req.userDetails._id }).sort({ createdAt: -1 });
    const hasAddress = req.userDetails.shippingAddresses && req.userDetails.shippingAddresses.length > 0;
    if (hasAddress) {
      return res.render('user/checkout', {
        userDetails: req.userDetails,
        cart,
        latestOrder,
      });
    } else {
      res.redirect('/user/add-address')
    }   
  },

  //address
  getAddAddress: async (req, res) => {
   res.render('user/editAddress',{ userDetails: req.userDetails});
  },

  addAddress: async (req, res) => {
   const userDetails= req.userDetails;
    const { street, city, state, postalCode } = req.body;
    const newAddress = {
      street,
      city,
      state,
      postalCode
    };
    userDetails.shippingAddresses.push(newAddress);
    await userDetails.save();
   res.redirect('/user/add-address')
  
   },

   updateAddress: async (req, res) => {
    const userDetails= req.userDetails;
    const index = req.body.index;
    userDetails.shippingAddresses[index] = {
      street: req.body.street || userDetails.shippingAddresses[index].street,
      city: req.body.city || userDetails.shippingAddresses[index].city,
      state: req.body.state || userDetails.shippingAddresses[index].state,
      postalCode: req.body.postalCode || userDetails.shippingAddresses[index].postalCode
    };
    await userDetails.save();
    res.redirect('/user/add-address')
    },

    deleteAddress: async (req, res) => {
      const userDetails= req.userDetails;
      const index = req.params.index;
      userDetails.shippingAddresses.splice(index, 1);
     await userDetails.save()
     res.redirect('/user/add-address')
      
     },

     setDefault: async (req, res) => {
      const userDetails= req.userDetails;
      const index = req.params.index;
      console.log('index:',index)
      userDetails.shippingAddresses.forEach((address, i) => {
        if (i == index) {
            address.default = true;
        } else {
            address.default = false;
        }
    });
      await userDetails.save()
      res.redirect('/user/add-address')
      
     },



  // checkout process
  handleCheckout: async (req, res) => {
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
    const codPayment=await paymentHelper.createCODOrder(cart,req.userDetails )
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
      const orders = await Order.find({ user: req.userDetails }).populate('items.product').lean();
      console.log('Order History:', orders);
      const productRatings = {};
      for (const order of orders) {
        for (const item of order.items) {
            const ratings = await Rating.find({ product: item.product._id }).lean();
            item.product.ratings = ratings;
            productRatings[item.product._id] = ratings;

        }
    }
      res.render('user/orderHistory', { orderHistory: orders, userDetails: req.userDetails,productrating:productRatings });
    },


    //rating
    submitRating: async (req, res) => {
      const userDetails= req.userDetails;
      const { productId, rating } = req.body;
      await orderHelper.submitRating(userDetails,productId,rating);
      res.redirect('/user/orders')
   
     },
  
};



