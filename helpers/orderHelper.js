const Order = require('../models/order');
const User = require('../models/usermodel');

async function getNextStatus(currentStatus) {
 
    switch (currentStatus) {
        case 'pending':
          return 'shipping';
        case 'shipping':
          return 'delivered';
        case 'delivered':
          return 'completed';
        default:
          return currentStatus;
      }
    }


module.exports = {
    getNextStatus
    };
    