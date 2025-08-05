const express = require('express');
const { register, verifyOtp, login, resendOtp, logout } = require('../../controller/admin/authcontroller');
const router = express.Router();


router.post('/register',register);

router.post('/verify-otp',verifyOtp);

router.post('/login',login);

router.post('/resend-otp',resendOtp);

router.post('/logout',logout);


module.exports = router;
