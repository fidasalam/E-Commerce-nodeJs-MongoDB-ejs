const Order = require('../models/order');
const User = require('../models/usermodel');
const Rating = require('../models/rating');

async function getNextStatus(currentStatus) {
 
    switch (currentStatus) {
        case 'placed':
          return 'placed';
        case 'shipping':
          return 'shipping';
        case 'delivered':
          return 'delivered';
        default:
          return currentStatus;
      }
    };

    

    async function  getProductSalesByMonth() {
  
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
    };
    
    
    async function getProductIncomeByMonth() {
      try {
        const incomeData = await Order.aggregate([
          {
            $unwind: '$items' // Unwind the items array to work with each product separately
          },
          {
            $lookup: {
              from: 'products',
              localField: 'items.product',
              foreignField: '_id',
              as: 'productInfo'
            }
          },
          {
            $unwind: '$productInfo'
          },
          {
            $group: {
              _id: {
                month: { $month: '$payment.orderDate' },
                product: '$items.product'
              },
              totalPrice: { $sum: { $multiply: ['$items.quantity', '$productInfo.price'] } } // Calculate the total price of each product
            }
          },
          {
            $group: {
              _id: '$_id.month',
              totalIncome: { $sum: '$totalPrice' } // Sum up the total prices for each month to get the total income
            }
          },
          {
            $sort: { '_id': 1 } // Sort the results by month in ascending order
          }
        ]);
    
        // Create an array of all months
        const allMonths = Array.from({ length: 12 }, (_, i) => i + 1);
    
        // Merge the income data with all months
        const formattedIncomeData = allMonths.map(month => {
          const incomeInMonth = incomeData.find(item => item._id === month);
          return {
            month: month,
            totalIncome: incomeInMonth ? incomeInMonth.totalIncome : 0 // Set totalIncome to 0 if there is no income for that month
          };
        });
    
        return formattedIncomeData;
      } catch (error) {
        console.error('Error fetching product income data:', error);
        throw error;
      }
    };
    
    async function submitRating(user,productId,rating){
     
    try {
      // const existingRating = await Rating.findOneAndDelete({ user: user.id, product: productId });
      const newRating = new Rating({
        user: user.id,
        product: productId,
        value: rating
      });

      // Save the new rating
      await newRating.save();

    } catch (error) {
      console.error('Error submitting rating:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } ;

    
  async function getTotalOrders() {
    try {
        const totalOrders = await Order.aggregate([
            {
                $count: "totalOrders" // Count all orders without grouping
            }
        ]);

        return totalOrders[0]?.totalOrders ?? 0; // Return the total number of orders, or 0 if no orders exist
    } catch (error) {
        console.error('Error fetching total orders data:', error);
        throw error;
    }
};

    
  async function getProductSalesByMonth() {
    try {
        const salesData = await Order.aggregate([
            {
                $unwind: '$items' // Unwind the items array to work with each product separately
            },
            {
                $group: {
                    _id: {
                        month: { $month: '$payment.orderDate' }
                    },
                    totalQuantity: { $sum: '$items.quantity' } // Sum up the quantities of each product
                }
            },
            {
                $group: {
                    _id: '$_id.month',
                    totalSales: { $sum: '$totalQuantity' } // Calculate the total sales for each month by summing up total quantities
                }
            },
            {
                $sort: { '_id': 1 } 
            }
        ]);

      
        const allMonths = Array.from({ length: 12 }, (_, i) => i + 1);

        
        const formattedSalesData = allMonths.map(month => {
            const salesInMonth = salesData.find(item => item._id === month);
            return {
                month: month,
                totalSales: salesInMonth ? salesInMonth.totalSales : 0 
            };
        });

        return formattedSalesData;
    } catch (error) {
        console.error('Error fetching product sales data:', error);
        throw error;
    }
};
  
async function getTotalRevenue() {
  try {
      const totalRevenueData = await Order.aggregate([
          {
              $unwind: '$items' 
          },
          {
              $lookup: {
                  from: 'products',
                  localField: 'items.product',
                  foreignField: '_id',
                  as: 'productInfo'
              }
          },
          {
              $unwind: '$productInfo'
          },
          {
              $group: {
                  _id: null,
                  totalRevenue: { $sum: { $multiply: ['$items.quantity', '$productInfo.price'] } } 
              }
          }
      ]);


      const totalRevenue = totalRevenueData.length > 0 ? totalRevenueData[0].totalRevenue : 0;

      return totalRevenue;
  } catch (error) {
      console.error('Error fetching total revenue data:', error);
      throw error;
  }
}

  

module.exports = {
  submitRating,getTotalOrders,getTotalRevenue,
    getNextStatus,getProductSalesByMonth,getProductIncomeByMonth
    };
    