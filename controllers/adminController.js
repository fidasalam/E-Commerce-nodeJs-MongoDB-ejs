const User = require('../models/usermodel');
const Product = require('../models/product');
const Category = require('../models/category');

const bcrypt = require('bcryptjs');

const path = require('path');
const fs = require('fs').promises;
const ProductHelper = require('../helpers/productHelper');
const upload = require('../config/multerConfig');





exports.displayAdmin = async (req, res) => {
  try {
    res.render('admin/index');
  } catch (error) {
    console.error('Error rendering admin page:', error);
    res.status(500).send('Internal Server Error');
  }
};





//product




exports.displayProduct = async (req, res) => {
  try {
    
    const categoryParam = req.query.category;

  
    let products;
    if (categoryParam && categoryParam !== 'All') {
      products = await ProductHelper.getProductsByCategoryName(categoryParam);
    } else {
      products = await ProductHelper.getAllProducts();
    }

    res.render('admin/products', { products, selectedCategory: categoryParam });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).send('Internal Server Error');
  }
};



exports.displayAddProduct = (req, res) => {
  try {
    res.render('admin/add-product');
  } catch (error) {
    console.error('Error rendering add-product page:', error);
    res.status(500).send('Internal Server Error');
  }
};

exports.postAddProduct = async (req, res) => {
  try {
    // Multer middleware should be used in the route handler
    upload.array('images')(req, res, async function (err) {
      if (err) {
        // Handle Multer error
        return res.status(500).json({ error: err.message });
      }

      const { name, price, category, description, color, size, unitsSold, inStock } = req.body;
      const imagePaths = req.files.map(file => `/uploads/product-images/${file.filename}`);

      const newProduct = new Product({
        name,
        price,
        images: imagePaths,
        category,
        description,
        color,
        size,
        unitsSold,
        inStock,
      });

      await newProduct.save();

      return res.redirect('/admin/products');
    });
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).render('error', { error: 'Internal Server Error' });
  }
};

   
exports.getUpdateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await ProductHelper.getProductById(productId);
   
    if (!product) {
      // Handle the case where the product is not found
      return res.status(404).send('Product not found');
    }

    // Fetch additional information related to categories
    const categories = await ProductHelper.getProductsByCategoryName('All'); // Assuming 'All' is a default category
    // You may adjust the category name as needed based on your application logic

    // Render the edit-product view with the product details and categories
   
    res.render('admin/edit-product', { existingProduct: product, categories,productId });
  } catch (error) {
    // Handle errors appropriately
    console.error(error);
    res.status(500).send('Internal Server Error');
  }};


  exports.postUpdateProduct = async (req, res) => {
    try {
      const productId = req.params.id;
      const updatedData = req.body;
      const file = req.file;

      console.log('ProductId:', productId);
      console.log('Updated Data:', updatedData);
      console.log('File:', file);
     

      const updatedProduct = await ProductHelper.updateProductById(productId, updatedData, file);

      if (updatedProduct) {
        return res.redirect('/admin/products');
      } else {
        res.status(404).render('error', { message: 'Product not found' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).render('error', { message: 'Internal Server Error' });
    }
  };

  exports.deleteProduct = async (req, res) => {
    try {
      const productId = req.params.id;
  
      console.log('Before deleteProductById call');
await ProductHelper.deleteProductById(productId);
console.log('After deleteProductById call');
     
  
      res.status(204).end(); // Respond with a successful status without content
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).send('Internal Server Error');
    }
  };
 



//register
  exports.getRegisterAdmin = (req, res) => {
    try {
      res.render('admin/register-admin');
    } catch (error) {
      console.error('Error rendering add-product page:', error);
      res.status(500).send('Internal Server Error');
    }
  };

  exports.postRegisterAdmin = async (req, res) => {
    try {
      // Assuming your registration form fields are: name, username, email, password, phone
      const { name, username, email, password, phone } = req.body;
  
      // Use the adminHelper to register the admin
      await ProductHelper.registerAdmin({ name, username, email, password, phone });
  
      // Redirect or render as needed
      res.redirect('/admin/dashboard');
    } catch (error) {
      console.error(error);
      if (error.code === 11000) {
        return res.status(400).send('Username or email already in use.');
      }
  
      res.status(500).send('Internal Server Error');
    }
  };


  //user

  