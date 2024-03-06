const Product = require('../models/product');
const Category= require('../models/category')
const User = require('../models/usermodel');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');
const Order = require('../models/order');
const product = require('../models/product');
const Rating = require('../models/rating');

module.exports = {



  getProductById: async (productId) => {
    return await Product.findById(productId);
  },

  getAllProducts: async () => {
    try {
      const result = await Product.find({}).populate('category').populate('coupon').lean();
      return result;
    } catch (error) {
      throw new Error('Error fetching all products');
    }
  },
  
 calculateAverageRating : async (productId) => {
    try {
    
      const ratings = await Rating.find({ product: productId }).lean();
  
      if (ratings.length > 0) {

        const totalRating = ratings.reduce((acc, rating) => acc + rating.value, 0);
        const averageRating = totalRating / ratings.length;
        
        return averageRating;
      } else {
        return null;
      }
    } catch (error) {
      throw new Error('Error calculating average rating');
    }
  },
  
  getTopRatedProducts: async () => {
    try {
        // Find all ratings
        const ratings = await Rating.find();

        // Calculate average rating for each product
        const productRatingsMap = {};
        const productRatingCount = {};
        ratings.forEach(rating => {
            if (!productRatingsMap[rating.product]) {
                productRatingsMap[rating.product] = 0;
                productRatingCount[rating.product] = 0;
            }
            productRatingsMap[rating.product] += rating.value;
            productRatingCount[rating.product]++;
        });

        // Calculate average rating
        const averageRatings = {};
        for (const productId in productRatingsMap) {
            averageRatings[productId] = productRatingsMap[productId] / productRatingCount[productId];
        }

        // Sort products by average rating
        const sortedProductIds = Object.keys(averageRatings).sort((a, b) => averageRatings[b] - averageRatings[a]);

        // Limit to top 10 products
        const topRatedProductIds = sortedProductIds.slice(0, 13);

        // Fetch details of top-rated products
        const topRatedProductsDetails = await Product.find({ _id: { $in: topRatedProductIds } })
            .populate('category')
            .populate('coupon')
            .lean();

        // Add average rating to each top-rated product
        const result = topRatedProductsDetails.map(product => {
            return {
                ...product,
                averageRating: averageRatings[product._id] || 0 // Set default rating to 0 if not available
            };
        });

        return result;
    } catch (error) {
        throw new Error('Error fetching top-rated products');
    }
},


  
  
  
  getAllCategories : async () => {
    try {
      const categories = await Category.find({}).populate('name').lean();
      return categories;
    } catch (error) {
      throw new Error('Error fetching all categories');
    }
  },

  
  getProductsByName : async (productName) => {
    try {
      const products = await Product.find({ name: { $regex: `^${productName}`, $options: 'i' } }).lean();
      return products;
    } catch (error) {
      throw new Error('Error fetching products');
    }
  },


  getProductsByCategoryName: async (categoryName) => {
    try {
      const selectedCategory = await Category.findOne({ name: categoryName }).lean();
     console.log('sel:',selectedCategory)
      if (!selectedCategory) {
        return [];
      }

      const products = await Product.find({ category: selectedCategory._id }).limit(12).populate('coupon').lean();
      console.log('sel:',selectedCategory._id)
    
      return products;
    } catch (error) {
      throw new Error('Error fetching products by category');
    }
  },


  addProduct: async (productData) => {
    try {
      const product = new Product(productData).lean();
      await product.save();
    } catch (error) {
      throw new Error('Error adding product');
    }
  },
  
  getProductById: async (productId) => {
    try {
      const product = await Product.findById(productId).lean();
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
      
        const searchResults = await Product.find({ name: regex }).populate('coupon').lean();
        return searchResults;
    } catch (error) {
        console.error(error);
        throw new Error('Error performing search');
    }
},

getProductRatings: async ( productId) => {
  try {
    const ratings = await Rating.find({ product: productId }).select('value');
    
    let totalRatings = ratings.length;
    let totalStars = 0;
    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    ratings.forEach(rating => {
      totalStars += rating.value;
      ratingCounts[rating.value]++;
    });

    const averageRating = totalRatings > 0 ? totalStars / totalRatings : 0;

    return { ratings: ratingCounts, averageRating ,totalRatings};
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
},

getAverageRating: async function(productIds) {
  try {
    const averageRatings = await Rating.aggregate([
      {
        $match: { product: { $in: productIds.map(id => mongoose.Types.ObjectId(id)) } } // Match ratings for the given product IDs
      },
      {
        $group: {
          _id: "$product", // Group by product ID
          averageRating: { $avg: "$value" } // Calculate average rating for each product
        }
      }
    ]).lean();

    const averageRatingsMap = averageRatings.reduce((map, rating) => {
      map[rating._id] = rating.averageRating; // Map product ID to average rating
      return map;
    }, {});

    return averageRatingsMap;
  } catch (error) {
    console.error('Error getting average ratings:', error);
    return null; // Return null or handle the error appropriately
  }
}





 
};


