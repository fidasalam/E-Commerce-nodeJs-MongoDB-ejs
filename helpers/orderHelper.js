const Order = require('../models/order');
const User = require('../models/usermodel');

async function getNextStatus(currentStatus) {
 
    switch (currentStatus) {
        case 'pending':
          return 'pending';
        case 'shipping':
          return 'shipping';
        case 'delivered':
          return 'delivered';
        default:
          return currentStatus;
      }
    };



module.exports = {
    getNextStatus
    };
    