const express = require('express');
const Razorpay = require('razorpay');
const router = express.Router();

// Initialize Razorpay with your API Key and Secret
const razorpay = new Razorpay({
  key_id: 'rzp_test_W6OqPxgU2L2gKQ',
  key_secret: 'JKkLAgrYMDagiSGJRaye4QgW',
});

exports.renderrazorPayment = async (req, res) => {
  try {
    // Fetch the necessary data for the Razorpay payment
    const { discountedTotal } = req.body;

    // Perform any additional logic if needed

    // Create a new order using Razorpay API
    const order = await razorpay.orders.create({
      amount: discountedTotal * 100, // Convert to paise
      currency: 'INR',
      receipt: 'order_receipt_1',
      payment_capture: 1,
    });

    // Render the 'rayzorPay.ejs' view and pass the order data
    res.render('user/rayzorPay', { order });
  } catch (error) {
    console.error('Error rendering Razorpay payment:', error);
    res.status(500).render('error', { message: 'Internal server error' });
  }
};


module.exports = router;
