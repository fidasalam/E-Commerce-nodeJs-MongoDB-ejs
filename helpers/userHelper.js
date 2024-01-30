const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/usermodel');

const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret-key';



module.exports = {


   generateTokenAndSetSession :(user, req) => {
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });
    req.session.token = token;
    req.session.userId = user._id;
},



  isValidPasswordFormat :(password) => {
   
    const minLength = 6;
    const hasUpperCase = /[A-Z]/.test(password);

    return password.length >= minLength && hasUpperCase;
},


 isValidPhoneNumberFormat : (phoneNumber) => {
 
  const numericRegex = /^[0-9]+$/;
  return numericRegex.test(phoneNumber) && phoneNumber.length === 10; // Adjust as needed
},


  validatePassword: async (user, password) => {
    try {


        // Compare hashed password in the user object with the provided password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        return isPasswordValid;
    } catch (error) {
        console.error('Error validating password:', error);
        return false; // Return false in case of an error
    }
},


  registerUser: async (userData) => {
    const { username, email, password, name,phone,address} = userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      name,
      phone,
    
    
    });
    return await newUser.save();
  },

  
  getUserById: async(userId)=> {
    try {
      const user = await User.findById(userId);
      return user;
    } catch (error) {
      throw new Error(`Error fetching user by ID: ${error.message}`);
    }
  },

  getCurrentUsername: async (userId) => {
    try {
      const user = await User.findById(userId);
      return user ? user.username : null;
    } catch (error) {
      throw new Error('Error retrieving current username');
    }
  },
  
  authenticateUser: async (username, password) => {
    const user = await User.findOne({ username });
    if (!user) {
      throw new Error('Invalid credentials');
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }
    const token = jwt.sign({ _id: user._id }, 'your-secret-key', { expiresIn: '1h' });
    return token;
  },




  authenticateAdmin: (username, password) => {
    // Check if the provided username and password match the admin credentials
    const isAdmin = username === 'admin' && password === 'admin_password';

    if (isAdmin) {
      // Generate a token for admin
      const adminToken = jwt.sign({ role: 'admin' }, 'your-secret-key', { expiresIn: '1h' });
      return adminToken;
    } else {
      throw new Error('Invalid credentials');
    }
  },
  getUserProfile: async (userId) => {
    return await User.findById(userId);
  },





  

  addToCart : async (userId, productId, quantity) => {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }
  
      // Check if the product is already in the cart
      const existingProduct = user.cart.find(item => item.product.toString() === productId);
      if (existingProduct) {
        // If the product is already in the cart, update the quantity
        existingProduct.quantity += quantity;
      } else {
        // If the product is not in the cart, add it
        user.cart.push({ product: productId, quantity });
      }
  
      await user.save();
    } catch (error) {
      console.error('Error adding to cart:', error.message);
      throw new Error('Error adding to cart');
    }
  },
  
};






