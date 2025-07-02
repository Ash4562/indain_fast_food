// const jwt = require('jsonwebtoken');

// const sendOTP = require('../../utils/sendOTP');
// const DriverAuth = require('../../models/deliveryboy/deliveryAuth');

// const otpStore = {}; // Use DB in production

// // ✅ Register Driver with Files and Email OTP
// exports.registerDriver = async (req, res) => {
//   try {
//     const {
//       fullName,
//       phone,
//       email,
//       vehicleType,
//       registerFeesAmount,
//       LanguagePreferred
//     } = req.body;

//     const {
//       driverImage,
//       vehicleImage,
//       drivingLicenseImage,
//       aadharCardImage,
//       vehicleRCImage,
//       vehicleInsuranceImage
//     } = req.files;

//     const existing = await DriverAuth.findOne({ email });
//     if (existing) {
//       return res.status(400).json({ message: 'Driver already registered with this email' });
//     }

//     const otp = Math.floor(1000 + Math.random() * 9000).toString();
//     otpStore[email] = otp;

//     await sendOTP(email, otp);

//     const newDriver = new DriverAuth({
//       fullName,
//       phone,
//       email,
//       vehicleType,
//       registerFeesAmount,
//       LanguagePreferred,
//       driverImage: driverImage[0].path,
//       vehicleImage: vehicleImage[0].path,
//       drivingLicenseImage: drivingLicenseImage[0].path,
//       aadharCardImage: aadharCardImage[0].path,
//       vehicleRCImage: vehicleRCImage[0].path,
//       vehicleInsuranceImage: vehicleInsuranceImage[0].path,
//       otp,
//       otpExpiry: new Date(Date.now() + 5 * 60 * 1000),
//     });

//     await newDriver.save();

//     res.status(201).json({
//       message: 'Driver registered successfully. OTP sent to email.',
//       driverId: newDriver._id
//     });
//   } catch (error) {
//     console.error('Driver registration failed:', error);
//     res.status(500).json({ error: 'Registration failed' });
//   }
// };

// // ✅ Login (resend OTP)
// exports.login = async (req, res) => {
//   try {
//     const { phone } = req.body;

//     if (!phone || phone.length !== 10) {
//       return res.status(400).json({ message: 'Please provide a valid 10-digit phone number.' });
//     }

//     const driver = await DriverAuth.findOne({ phone });
//     if (!driver) {
//       return res.status(404).json({ message: 'Driver not found' });
//     }

//     if (driver.status !== 'approved') {
//       return res.status(403).json({ message: 'Not approved by admin yet.' });
//     }

//     const otp = Math.floor(1000 + Math.random() * 9000).toString();
//     otpStore[driver.email] = otp;

//     await DriverAuth.findByIdAndUpdate(driver._id, {
//       otp,
//       otpExpiry: new Date(Date.now() + 5 * 60 * 1000),
//     });

//     await sendOTP(driver.email, otp);

//     res.status(200).json({
//       message: 'OTP sent to registered email',
//       driverId: driver._id
//     });
//   } catch (error) {
//     console.error('Login failed:', error);
//     res.status(500).json({ message: 'Failed to login' });
//   }
// };

// // ✅ OTP Verification
// exports.verifyOTP = async (req, res) => {
//   try {
//     const { driverId, otp } = req.body;

//     if (!driverId || !otp) {
//       return res.status(400).json({ message: 'Missing driverId or OTP' });
//     }

//     const driver = await DriverAuth.findById(driverId);

//     if (!driver || driver.otp !== otp || new Date() > driver.otpExpiry) {
//       return res.status(400).json({ message: 'Invalid or expired OTP' });
//     }

//     driver.otp = null;
//     driver.otpExpiry = null;
//     await driver.save();

//     const token = jwt.sign({ id: driver._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

//     res.cookie('token', token, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === 'production',
//       sameSite: 'strict',
//       maxAge: 24 * 60 * 60 * 1000,
//     });

//     return res.status(200).json({ message: 'Login successful', token });
//   } catch (error) {
//     console.error('OTP verification failed:', error.message);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// };

// // ✅ Admin status update
// exports.updateDriverStatus = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { status } = req.body;

//     if (!['approved', 'rejected'].includes(status)) {
//       return res.status(400).json({ error: 'Invalid status' });
//     }

//     const driver = await DriverAuth.findByIdAndUpdate(id, { status }, { new: true });

//     if (!driver) {
//       return res.status(404).json({ error: 'Driver not found' });
//     }

//     res.status(200).json({ message: `Driver ${status} successfully`, driver });
//   } catch (error) {
//     console.error('Status update failed:', error);
//     res.status(500).json({ error: 'Failed to update driver status' });
//   }
// };
