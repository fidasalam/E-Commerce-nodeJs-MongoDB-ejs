const Product = require('../models/product');
const User = require('../models/usermodel');
const Cart = require('../models/cart');
const Wishlist = require('../models/wishlist');
const productHelper = require('./productHelper');



async function addToCart(userId, productId, quantity) {
  try {
    let cart = await Cart.findOne({ user: userId }).populate({
      path: 'items.product',
      model: 'Product',
    }).exec();

    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    const quantityToAdd = parseInt(quantity, 10) || 1;

    const existingProduct = cart.items.find(item => item.product._id.toString() === productId);

    if (existingProduct) {
      existingProduct.quantity += quantityToAdd;

      // Remove the item from the cart if the updated quantity is zero
      if (existingProduct.quantity <= 0) {
        cart.items = cart.items.filter(item => item.product._id.toString() !== productId);
      }
    } else {
      const product = await Product.findById(productId);
      cart.items.push({
        product: { ...product.toJSON(), image: product.image },
        quantity: quantityToAdd,
        
      });
    }

    const savedCart = await cart.save();
    return savedCart;
  } catch (error) {
    console.error('Error adding to cart:', error);
    throw error; // Rethrow the error for better handling in the calling function
  }
}





async function getCart(userId) {
    try {
      const cart = await Cart.findOne({ user: userId }).populate({
        path: 'items.product',
        model: 'Product'
      }).exec();
  
      return cart;
    } catch (error) {
      console.error('Error fetching cart:', error);
      throw error;
    }
  };



  async function removeFromCart(userId,productId) {
    const filter = { user: userId };
  
    try {
      const cart = await Cart.findOneAndUpdate(
        filter,
        { $pull: { items: { product: productId } } },
        { new: true }
      );
      
      return cart;
    } catch (error) {
      console.error('Error in removeFromCart:', error);
      throw error; // Rethrow the error to handle it in the calling function
    }
  };



  function calculateSubtotal(cart) {
    let subtotal = 0;
    for (const item of cart.items) {
      // Ensure both quantity and price are present and are numbers
      if (typeof item.quantity === 'number' && typeof item.product.price === 'number') {
        subtotal += item.quantity * item.product.price;
      }
    }
    return subtotal;
  };


  async function updateCart(cart) {
    try {
      // Assuming that cart has a valid _id field
      const cartId = cart._id;
  
      // Update the cart in the database
      const updatedCart = await Cart.findByIdAndUpdate(cartId, cart, { new: true });
  
      if (!updatedCart) {
        console.error('Cart not found in the database');
        // Handle the case where the cart is not found
        throw new Error('Cart not found');
      }
  
      console.log('Cart updated in the database:', updatedCart);
      return updatedCart;
    } catch (error) {
      console.error('Error updating cart in the database:', error);
      throw error; // Rethrow the error for higher-level handling
    }
  };

  
  function calculateDiscountedTotal(originalSubtotal, coupon) {
   
    // Use the correct field name from your Coupon model
    const discountPercentage = coupon.discountPercentage || 0;
  

    const discountAmount = (originalSubtotal * discountPercentage) / 100;
    

    const discountedTotal = originalSubtotal - discountAmount;
    

    return discountedTotal;
};


async function getCartProducts(userId){
  const cart = await Cart.findOne({ user: userId }).populate({
    path: 'items.product',
    model: 'Product'
  }).exec();
  const cartProducts = cart.items.map(item => item.product);
  return cartProducts;
};



async function getCartCount(userId){
  const cart = await Cart.findOne({ user: userDetails._id });
  const cartCount = cart.items.reduce((total, item) => total + item.quantity, 0);
  return cartCount;
}

async function getWishlistCount(userId){
  const wishlistCount = await Wishlist.countDocuments({ user: userDetails._id });
  return wishlistCount;
}




  
module.exports = {
  getWishlistCount, getCartCount,
removeFromCart, getCartProducts,addToCart,getCart,calculateSubtotal,updateCart, calculateDiscountedTotal,
};
