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