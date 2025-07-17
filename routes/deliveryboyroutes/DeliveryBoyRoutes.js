// routes/driverAuthRoutes.js
const express = require('express');
const upload = require('../../middleware/multer');
const { registerDriver, login, verifyOTP, updateDriverStatus, sendDriverOTP, updateDriverProfile, getDriverById, getAllDrivers, deleteDriver, toggleDeliveryBoyAvailability } = require('../../controller/deliveryboycontroller/driverAuthController');


const router = express.Router();
// const driverAuth = require('../controllers/driverAuthController');

// router.post('/register', registerDriver);
router.post(
    '/register',
    upload.fields([
        { name: 'ProfileImage', maxCount: 1 },
        { name: 'RCbookImage', maxCount: 1 },
        { name: 'DrivingLicenceImage', maxCount: 1 },
        { name: 'IDProofImage', maxCount: 1 },
      ]),registerDriver);
router.post('/login', login);
router.post('/verify-otp', verifyOTP);
router.put('/update-status/:id', updateDriverStatus);
router.put('/toggle-availability/:driverId', toggleDeliveryBoyAvailability);
router.post('/send-otp',sendDriverOTP);
router.put('/update-profile/:driverId', upload.fields([
  { name: 'ProfileImage', maxCount: 1 },
  { name: 'RCbookImage', maxCount: 1 },
  { name: 'DrivingLicenceImage', maxCount: 1 },
  { name: 'IDProofImage', maxCount: 1 },
]),updateDriverProfile)
router.get('/getall',getAllDrivers);
router.get('/getDeliveryBoyId/:driverId',getDriverById);
router.delete('/delete/:driverId',deleteDriver);

module.exports = router;





































// const express = require('express');
// const { register, verifyOtp, login, resendOtp, logout, updateUserDetails, getUserDetails, getAllUser, getDeliveryBoysByShopId, deleteDeliveryBoy } = require('../../controller/deliveryboycontroller/DeliveryBoyController');
// const router = express.Router();


// // Register with OTP (Step 1 - send OTP)
// router.post('/register',register);

// // Verify OTP and finalize registration
// router.post('/verify-otp',verifyOtp);

// // Login with OTP (Step 1 - send OTP)
// router.post('/login',login);

// // Resend OTP
// router.post('/resend-otp',resendOtp);

// // Logout
// router.post('/logout',logout);
// router.put('/update/:deliveryBoyId',updateUserDetails);
// router.get('/get/:deliveryBoyId',getUserDetails);
// router.get('/shop/:shopId',getDeliveryBoysByShopId);
// router.delete('/delivery-boy/:deliveryBoyId', deleteDeliveryBoy);


// // Get user details by ID
// // router.get('/:userId',getUserDetails);

// module.exports = router;
