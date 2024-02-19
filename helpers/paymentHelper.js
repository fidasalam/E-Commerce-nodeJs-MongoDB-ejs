const User = require('../models/usermodel');
const Cart = require('../models/cart');
const Wishlist = require('../models/wishlist');
const Coupon = require('../models/coupon');
const Message = require('../models/message')
const Order = require('../models/order');
const Product = require('../models/product');
const crypto = require('crypto');

const userHelper = require('../helpers/userHelper');
const ProductHelper = require('../helpers/productHelper');
const cartHelper = require('../helpers/cartHelper');
const productHelper = require('../helpers/productHelper');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Razorpay = require('razorpay');
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  function generateOrderId() {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    return `ORDER-${timestamp}-${randomString}`;
  }
module.exports = {
    // Function to create a Razorpay order
    createRazorpayOrder: async (amount) => {
      try {
        const order = await razorpay.orders.create({
          amount: Math.round(amount * 100), // amount in paisa
          currency: 'INR',
          receipt: `order_${Date.now()}`,
          payment_capture: 1, // auto-capture enabled
        });
        return order;
      } catch (error) {
        console.error('Error creating Razorpay order:', error);
        throw new Error('Error creating Razorpay order');
      }
    },

   verifyRazorpayPayment: async (payment, order, userDetails) => {
    try {
      const address =await userHelper.defaultShippingAddress(userDetails)
      console.log('adress:',address);
      const secret = process.env.RAZORPAY_KEY_SECRET;
      const generated_signature = crypto
        .createHmac('sha256', secret)
        .update(order + '|' + payment.razorpay_payment_id)
        .digest('hex');

      if (generated_signature === payment.razorpay_signature) {
        const cart = await Cart.findOne({ user: userDetails._id });
        const newOrder = new Order({
          user: userDetails._id,
          payment: {
            orderId: order,
            paymentId: payment.razorpay_payment_id,
            orderDate: new Date(),
            status: 'placed',
            paymentMethod: 'RazorPayment',
          },
          items: cart.items,
          shippingAddress: {
            street: address.street,
            city: address.city,
            state: address.state,
            postalCode: address.postalCode,
            // Add other address fields as needed
        },
        appliedCoupon: cart.appliedCoupon 
          
        });
        
        for (const item of cart.items) {
          const product = await Product.findById(item.product._id);
          if (product) {
            product.inStock -= item.quantity;
            await product.save();
          }
        }
  
        await cartHelper.deleteCart(cart._id);
  
        await newOrder.save();
        console.log('neworder:',newOrder)
        return 'success';
      } else {
        return { status: 'error', error: 'Invalid signature' };
      }
    } catch (error) {
      console.error('Error verifying Razorpay payment:', error);
      throw new Error('Error verifying Razorpay payment');
    }
  },

  createCODOrder: async (cart,user) => {
    try {
      const address =await userHelper.defaultShippingAddress(user)
        const orderId = generateOrderId();
        const newOrder = new Order({
          user: user._id,
          payment: {
            orderId: orderId,
            orderDate: new Date(),
            status: 'placed',
            paymentMethod:'COD'
          },
          items: cart.items,
          shippingAddress: {
            street: address.street,
            city: address.city,
            state: address.state,
            postalCode: address.postalCode,
            // Add other address fields as needed
        },
        appliedCoupon: cart.appliedCoupon ,
          
        });
    
        for (const item of cart.items) {
          const product = await Product.findById(item.product._id);
          if (product) {
              // Ensure there's enough stock before decrementing
              if (product.inStock >= item.quantity) {
                  product.inStock -= item.quantity;
                  await product.save();
              } else {
                  (product.inStock=0);
                  // throw new Error(`Insufficient stock for product ${product.name}`);
              }
          }
      }
        await cartHelper.deleteCart(cart._id);
        await newOrder.save();
        return 'success';
    
    } catch (error) {
      console.error('Error creating COD order:', error);
      throw new Error('Error creating COD order');
    }
  },

  handleProcessPayment: async (userDetails, payment_method_id) => {
    try {
      // Get the user's cart
      const cart = await cartHelper.getCart(userDetails);
      const total = cart.total;
      const amount = Math.round(total * 100);

      // Confirm the payment by creating a PaymentIntent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'INR',
        payment_method: payment_method_id,
      });

      // Generate an order ID
      const orderId = generateOrderId();

      return {
        orderId,
        paymentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
      };
    } catch (error) {
      console.error('Error processing Stripe payment:', error);
      throw new Error('Error processing Stripe payment');
    }
  },
  saveOrder: async (orderId, paymentId, userDetails) => {
    try {
      // Get the user's cart
      const cart = await cartHelper.getCart(userDetails);
      const address =await userHelper.defaultShippingAddress(userDetails)

      // Validate request data
      if (!orderId || !paymentId || !userDetails) {
        throw new Error('Invalid request data');
      }

      // Create a new order
      const newOrder = new Order({
        user: userDetails._id,
        payment: {
          paymentId: paymentId,
          orderId: orderId,
          orderDate: new Date(),
          status: 'placed',
          paymentMethod: 'StripePayment',
        },
        items: cart.items,
        shippingAddress: {
          street: address.street,
          city: address.city,
          state: address.state,
          postalCode: address.postalCode,
          // Add other address fields as needed
      },
      appliedCoupon: cart.appliedCoupon ,
      });
      for (const item of cart.items) {
        const product = await Product.findById(item.product._id);
        if (product) {
          product.inStock -= item.quantity;
          await product.save();
        }
      }

     await cartHelper.deleteCart(cart._id);
      // Save the order
      await newOrder.save();

      return 'success';
    } catch (error) {
      console.error('Error saving order:', error);
      throw new Error('Error saving order');
    }
  },
}