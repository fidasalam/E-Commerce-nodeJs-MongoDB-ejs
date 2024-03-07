const Product = require('../models/product');
const User = require('../models/usermodel');
const Cart = require('../models/cart');
const Wishlist = require('../models/wishlist');
const productHelper = require('./productHelper');
const Order = require('../models/order');
const Coupon = require('../models/coupon');




async function addToCart(userId, productId, quantity, req) {
  try {
    let cart;
    if (userId) {
      cart = await Cart.findOne({ user: userId }).populate({
        path: 'items.product',
        model: 'Product',
      }).exec();
    } else {
      cart = req.session.guestCart || { items: [] };
      
    }
       if (!cart) {
      cart =await new Cart({ user: userId, items: [] }).save();
    }

    const quantityToAdd = parseInt(quantity, 10) || 1;
    const existingProductIndex = cart.items.findIndex(item => item.product._id.toString() === productId);

    if (existingProductIndex !== -1) {
      cart.items[existingProductIndex].quantity += quantityToAdd;
      if (cart.items[existingProductIndex].quantity <= 0) {
        cart.items.splice(existingProductIndex, 1);
      }
    } else {
      
      const product = await Product.findById(productId);
      cart.items.push({
        product: { ...product.toJSON(), image: product.image },
        quantity: quantityToAdd,
      });
    }

    if (!userId) {
      req.session.guestCart = cart;
    }

    if (userId) {
      const savedCart = await cart.save();
      return savedCart;
    } else {
      return cart;
    }
  } catch (error) {

    throw error;
  }
}


async function findCouponByCode(couponCode){
  try {
    // Find the coupon by code
    const coupon = await Coupon.findOne({ code: couponCode });
    return coupon;
  } catch (error) {
    console.error('Error finding coupon by code:', error);
    throw new Error('Failed to find coupon by code');
  }
};


async function getCart(userId) {
    try {
  
      const cart = await Cart.findOne({ user: userId }).populate({
        path: 'items.product',
        populate: {
            path: 'coupon',
            model: 'Coupon'
        }
    }).exec();
      return cart;
    } catch (error) {
      console.error('Error fetching cart:', error);
      throw error;
    }
  };


  async function count(cart, wish) {
    try {
      console.log("cart", cart);
      console.log("wish", wish);
      const cartCount = cart && cart.items ? cart.items.length : 0;
      console.log("cartCount", cartCount);
  
      const wishlistCount = wish.length; // Assuming 'wish' is an array
      console.log("wishlistCount", wishlistCount);
      return { cartCount, wishlistCount };
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
    console.log('caerfffffff',cart)
    let subtotal = 0;
    for (const item of cart.items) {
      // Ensure both quantity and price are present and are numbers
      if (typeof item.quantity === 'number' && typeof item.product.price === 'number') {
        if (item.product.coupon) {
            const discountedPrice = item.product.price - (item.product.price * item.product.coupon.discountPercentage / 100);
            subtotal += item.quantity * discountedPrice;
        } else {
            subtotal += item.quantity * item.product.price;
        }
    }
}
return subtotal;
  };

  async function mergecart(user, guestCart) {
    const userId = user._id;
    
    // Get the user's cart from the database
    let userCart = await Cart.findOne({ user: userId }).populate({
      path: 'items.product',
      model: 'Product',
    }).exec();

    if (!userCart) {
      // If the user doesn't have a cart, create a new one
      userCart = new Cart({ user: userId, items: [] });
    }
    

    // Merge guestCart items into userCart
    guestCart.items.forEach(guestCartItem => {
      const existingProduct = userCart.items.find(item => 
        item.product?._id?.toString() === guestCartItem.product?._id?.toString()
      );
      if (existingProduct) {
        // If the product already exists in the user's cart, update the quantity
        existingProduct.quantity += guestCartItem.quantity;
      } else {
        // If the product doesn't exist in the user's cart, add it
        userCart.items.push({
          product: guestCartItem.product,
          quantity: guestCartItem.quantity,
        });
      }
    });

    // Save the updated userCart to the database
    const updatedUserCart = await userCart.save();
    

    console.log('User cart updated in the database:', updatedUserCart);
    return updatedUserCart;

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
};

async function getWishlistCount(userId){
  const wishlistCount = await Wishlist.countDocuments({ user: userDetails._id });
  return wishlistCount;
};

async function deleteCart(cart){
  await Cart.findByIdAndDelete(cart);
};

async function updateCartTotals(cart, subtotal, discountedTotal){
  try {
    cart.subtotal = subtotal;
    cart.total = discountedTotal;
    await cart.save();
    console.log('Cart updated with subtotal and discounted total:', cart);
  } catch (error) {
    console.error('Error updating cart with subtotal and discounted total:', error);
    throw new Error('Failed to update cart totals');
  }
};

async function updateItemQuantity (cart, itemIndex, newQuantity,user) {
  try {
 
    const cartItem = cart.items[itemIndex - 1];
    cartItem.quantity = newQuantity;
    if (user){
    await cart.save();
    }
    console.log('Cart item quantity updated:', cartItem);
    return cart; // Return the updated cart
  } catch (error) {
    console.error('Error updating cart item quantity:', error);
    throw new Error('Failed to update cart item quantity');
  }
};

const removeProductFromCart = async (cart, productId,user) => {
  try {
    // Filter out the product with the given productId from the cart items
    cart.items = cart.items.filter(item => item.product._id.toString() !== productId);
    if(user){
    await cart.save();
    }
    console.log('Product removed from cart:', productId);
    return cart; // Return the updated cart
  } catch (error) {
    console.error('Error removing product from cart:', error);
    throw new Error('Failed to remove product from cart');
  }
};

async function applyCouponToCart(userId, cart){
  try {
    
  

    const userOrders = await Order.find({ user: userId });
    const hasOrderHistory = userOrders.length > 0;
    const subtotal = calculateSubtotal(cart);
    const subtotalGreaterThan1000 = parseFloat(subtotal) > 1000;
    let coupon = null;
    const hasUsedCoupon = userOrders.some(order => order.appliedCoupon);

    // Check conditions and select appropriate coupon
    if (!hasUsedCoupon) {
    // Check conditions and select appropriate coupon
    if (!hasOrderHistory && subtotalGreaterThan1000) {
      coupon = await Coupon.findOne({ code: 'FIRSTORDER20', validityPeriod: { $gte: new Date() } });
    } else if (!hasOrderHistory) {
      coupon = await Coupon.findOne({ code: 'FIRSTORDER20', validityPeriod: { $gte: new Date() } });
    } else if (subtotalGreaterThan1000) {
      coupon = await Coupon.findOne({ code: 'DISCOUNT10', validityPeriod: { $gte: new Date() } });
    }}

   
  

    return coupon;
  } catch (error) {
    console.error('Error applying coupon to cart:', error);
    throw new Error('Failed to apply coupon to cart');
  }

};
  
module.exports = {
  updateCartTotals,updateItemQuantity,removeProductFromCart,
 deleteCart, getWishlistCount, getCartCount,mergecart,count,applyCouponToCart,findCouponByCode,
removeFromCart, getCartProducts,addToCart,getCart,calculateSubtotal,updateCart, calculateDiscountedTotal,
};
