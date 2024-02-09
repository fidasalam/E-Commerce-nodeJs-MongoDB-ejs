const Product = require('../models/product');
const Category= require('../models/category')
const User = require('../models/usermodel');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');
const Order = require('../models/order')

module.exports = {



  getProductById: async (productId) => {
    return await Product.findById(productId);
  },

  getAllProducts: async () => {
    try {
      const result = await Product.find({}).populate('category').lean();
      return result;
    } catch (error) {
      throw new Error('Error fetching all products');
    }
  },
  getFewProducts: async () => {
    return await Product.aggregate([
      {
        $sort: { category: 1, createdAt: -1 }
      },
      {
        $group: {
          _id: "$category",
          products: { $push: "$$ROOT" }
        }
      },
      {
        $project: {
          _id: 0,
          category: "$_id",
          products: { $slice: ["$products", 3] }
        }
      },
      {
        $unwind: "$products"
      },
      {
        $replaceRoot: { newRoot: "$products" }
      }
    ]);
  },
  
  
  getAllCategories : async () => {
    try {
      const categories = await Category.find({}).lean();
      return categories;
    } catch (error) {
      throw new Error('Error fetching all categories');
    }
  },
  getProductsByCategoryName: async (categoryName) => {
    try {
      const selectedCategory = await Category.findOne({ name: categoryName });

      if (!selectedCategory) {
        return [];
      }

      const products = await Product.find({ category: selectedCategory._id }).populate('category').lean();
      return products;
    } catch (error) {
      throw new Error('Error fetching products by category');
    }
  },


  addProduct: async (productData) => {
    try {
      const product = new Product(productData);
      await product.save();
    } catch (error) {
      throw new Error('Error adding product');
    }
  },
  
  getProductById: async (productId) => {
    try {
      const product = await Product.findById(productId);
      return product;
    } catch (error) {
      console.error('Error retrieving product by ID:', error);
      throw new Error('Error retrieving product by ID');
    }
  },

  
  updateProductById: async (productId, updatedData) => {
    try {
       
        const updatedProduct = await Product.findByIdAndUpdate(productId, updatedData, { new: true });

        if (updatedProduct) {
            console.log('Product updated successfully:', updatedProduct);
            return updatedProduct;
        } else {
            console.log('Product not found');
            return null;
        }
    } catch (error) {
        console.error('Error updating product:', error.message);
        throw new Error('Error updating product');
    }
},




  deleteProductById: async (productId) => {
    try {
      const product = await Product.findById(productId);

      if (!product) {
        throw new Error('Product not found');
      }

      const imagePath = './public/' + product.image; // Manually construct the path
      console.log('Deleting file at path:', imagePath);
      try {
        await fs.unlink(imagePath);
        console.log('File deleted successfully:', imagePath);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError.message);
      }

      await Product.deleteOne({ _id: productId });
    } catch (error) {
      console.error('Error deleting product:', error.message);
      throw new Error('Error deleting product');
    }
  },
  
  registerAdmin: async (adminData) => {
    const { name, username, email, password, phone } = adminData;

    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = new User({
      name,
      username,
      email,
      password: hashedPassword,
      phone,
      role: 'admin',
    });
    await newAdmin.save();
  },



  performSearch: async (searchQuery) => {

    const regex = new RegExp(searchQuery, 'i');

    try {
      
        const searchResults = await Product.find({ name: regex });
        return searchResults;
    } catch (error) {
        console.error(error);
        throw new Error('Error performing search');
    }
},



getProductSalesByMonth: async () => {
  try {
    const salesData = await Order.aggregate([
      {
        $unwind: '$items' // Unwind the items array to work with each product separately
      },
      {
        $group: {
          _id: {
            month: { $month: '$payment.orderDate' },
            product: '$items.product'
          },
          totalQuantity: { $sum: '$items.quantity' } // Sum up the quantities of each product
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id.product',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      {
        $unwind: '$productInfo'
      },
      {
        $group: {
          _id: '$_id.month',
          totalSales: { $sum: { $multiply: ['$totalQuantity',1] } } // Calculate the total sales for each month by multiplying product quantity with their respective prices and summing them up
        }
      },
      {
        $sort: { '_id': 1 } // Sort the results by month in ascending order
      }
    ]);

    // Create an array of all months
    const allMonths = Array.from({ length: 12 }, (_, i) => i + 1);

    // Merge the sales data with all months
    const formattedSalesData = allMonths.map(month => {
      const salesInMonth = salesData.find(item => item._id === month);
      return {
        month: month,
        totalSales: salesInMonth ? salesInMonth.totalSales : 0 // Set totalSales to 0 if there are no sales for that month
      };
    });

    return formattedSalesData;
  } catch (error) {
    console.error('Error fetching product sales data:', error);
    throw error;
  }
}

 
};


