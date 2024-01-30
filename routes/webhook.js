const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const stripe = require('stripe')('sk_test_51OcjKQSAozOuGu5VBxZyokvRH8WSyNnWvtftzfloHNeWJIPL9tDpx8drMmAF24wukrPdSyp3yTJrT4vbOTwYQQ0n00EjxmHpCC');




// Add your webhook handling code here
router.post('/webhook', bodyParser.raw({ type: 'application/json' }), (req, res) => {
  console.log('Received a webhook request');

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    const ngrokSubdomain = req.headers.referer.split('//')[1].split('.')[0];
    const webhookSecret = `whsec_${ngrokSubdomain}`;

    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error(err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event based on its type
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      // Handle successful payment
      console.log('Payment succeeded:', paymentIntent.id);
      break;

    case 'payment_intent.payment_failed':
      const paymentFailure = event.data.object;
      // Handle payment failure
      console.log('Payment failed:', paymentFailure.id);
      break;

    // Add more cases for other events as needed

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  res.json({ received: true });
});

module.exports = router;
