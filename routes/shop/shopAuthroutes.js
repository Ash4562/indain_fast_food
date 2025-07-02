// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../../controller/shop/shopAuthcontroller');
const upload = require('../../middleware/multer');

// router.post('/register', authController.register)

router.post(
    '/register',
    upload.fields([
      { name: 'hotelImage', maxCount: 1 },
      { name: 'enterGSTImage', maxCount: 1 },
      { name: 'shopActLicenseImage', maxCount: 1 },
      { name: 'foodDrugLicenseImage', maxCount: 1 },
      { name: 'clerkLicenseImage', maxCount: 1 }
    ]),
    authController.registerShop
    )
    router.put(
        '/update/:shopId',
        upload.fields([ 
           { name: 'hotelImage', maxCount: 1 },
          { name: 'enterGSTImage', maxCount: 1 },
          { name: 'shopActLicenseImage', maxCount: 1 },
          { name: 'foodDrugLicenseImage', maxCount: 1 },
          { name: 'clerkLicenseImage', maxCount: 1 }
        ]),
        authController.updateShopDetails
      );
  router.put('/statusAppRej/:id',authController.updateShopStatus)
  router.post('/login', authController.login)
.post('/verify-login-otp',authController.verifyOTP)
.post('/resend-otp', authController.resendOtp)
.get('/get/:shopId', authController.getShopDetails)
// .get('/getShopServicesGallerys/:shopId', authController.getShopWithServicesGallery)
.get('/allshops', authController.getAllShops)
.delete('/delete/:shopId', authController.deleteShop);
module.exports = router;
