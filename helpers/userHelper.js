const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/usermodel');
const Message = require('../models/message')
const nodemailerConfig=require('../config/nodemailerConfig')
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport(nodemailerConfig);
const otpGenerator = require('otp-generator');
const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret-key';

function generateOTP() {
  return otpGenerator.generate(6, { digits: true, alphabets: false, upperCase: false, specialChars: false });
}


module.exports = {


   generateTokenAndSetSession :(user, req) => {
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });
    req.session.token = token;
    req.session.userId = user._id;
},

 isValidUsernameFormat : (username) => {
  
  const nameRegex = /^[a-zA-Z]+$/;
  return nameRegex.test(username) 
},



 
  isValidPasswordFormat :(password) => {
   
    const minLength = 6;
    return password.length >= minLength;
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
getTotalUsers:async()=>{
  try {
    const totalUsers = await User.countDocuments();
    return totalUsers;
} catch (error) {
    console.error('Error fetching total user data:', error);
    throw error;

}},


  registerUser: async (userData) => {
    const { username, email, password, name,phone,otp} = userData;
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

  getUserByEmail: async (email) => {
    return await User.findOne({ email });
  },

  
  updateUserOTP:async (email, otp)=> {
    const user = await User.findOne({ email });
    if (user) {
        user.otp = otp;
        await user.save();
    }
},

updateUserPassword: async(email, newPassword) =>{
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await User.updateOne({ email }, { password: hashedPassword });
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

  saveMessage: async (msg, email) => {
    const newMessage = new Message({ msg, email });
    await newMessage.save();
    return newMessage; // Optionally, you can return the saved message object
  },
  defaultShippingAddress:async(userId)=>
  {
  const defaultShippingAddress = userId.shippingAddresses.find(shippingAddress => shippingAddress.default === true);
    return defaultShippingAddress;
  },

  sendRegistrationOTP: async (email) => {
    const user =  await User.findOne({ email });
    if (!user) {
    console.log('User not found. Please check the email address.');
    }
    const otp = generateOTP();
    if (user) {
        user.otp = otp;
        await user.save();
    }
       const mailOptions = {
      to: email,
      subject: 'Forgot Password OTP',
      text: `Your OTP for password reset is: ${otp}`
    };
    
    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.log(error);
            return res.status(500).send('Error sending OTP via email.');
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
},
verifyOTP: async (email, otp) => {
  try {
    const user = await User.findOne({ email });

    if (!user) {
      console.log('User not found. Please check the email address.');
      return false; // Return false if user not found
    }

    if (otp === user.otp) {
        await user.save();
      return true; // Return true if OTP matches
    } else {
      return false; // Return false if OTP doesn't match
    }
  } catch (error) {
    console.error(error);
    return false; // Return false in case of any error
  }
},

  sendRegistrationEmail: async (email) => {
    const otp = generateOTP();
    
       const mailOptions = {
      to: email,
      subject: 'Forgot Password OTP',
      text: `Your OTP for password reset is: ${otp}`
    };
    
    return new Promise((resolve, reject) => {
      transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
          console.error(error);
          reject(new Error('Error sending OTP via email.'));
        } else {
          console.log('Email sent: ' + info.response);
          resolve(otp); // Resolve with the OTP when the email is sent successfully
        }
      });
    });

},

  }




