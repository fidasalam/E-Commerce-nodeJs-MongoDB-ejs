const otpGenerator = require('otp-generator');

function generateOTP() {
  return otpGenerator.generate(6, { digits: true, alphabets: false, upperCase: false, specialChars: false });
}

module.exports = {generateOTP};