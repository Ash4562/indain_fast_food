

// const client = require("../../config/twilio");
const DriverAuth = require("../../models/deliveryboy/deliveryAuth");
const jwt = require("jsonwebtoken");
const sendOTP = require("../../utils/sendOTP");
exports.registerDriver = async (req, res) => {
  try {
    const {
      Name,
      email,
      address,
      contactNo,
      VehicleType,
      VehicleName,
      VehicleNumber,
      RCbookNumber,
      DrivingLicenceNo,
      IDProofNo,
      latitude,
      longitude
    } = req.body;

    const {
      DrivingLicenceImage,
      RCbookImage,
      ProfileImage,
      IDProofImage
    } = req.files;
console.log("body",req.body);
    const newDriver = new DriverAuth({
      Name,
      email,
      address,
      contactNo,
      VehicleType,
      VehicleName,
      VehicleNumber,
      RCbookNumber,
      DrivingLicenceNo,
      IDProofNo,

   
      DrivingLicenceImage:DrivingLicenceImage[0].path,
      RCbookImage:RCbookImage[0].path,
      ProfileImage:ProfileImage[0].path,
      IDProofImage:IDProofImage[0].path,
    
      locations: {
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null
      },
    });

    await newDriver.save();

    res.status(201).json({ message: 'Driver registered successfully', driver: newDriver });
  } catch (error) {
    console.error('Driver registration failed:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

const otpStore = {}; // Or use DB/session in production

exports.updateDriverStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const driver = await DriverAuth.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!driver) return res.status(404).json({ error: 'Driver not found' });

    res.status(200).json({ message: `Driver ${status} successfully`, driver });
  } catch (error) {
    console.error('Status update failed:', error);
    res.status(500).json({ error: 'Failed to update driver status' });
  }
};


exports.login = async (req, res) => {
    try {
      const { email } = req.body;
  
      if (!email) {
        return res.status(400).json({ message: 'Please provide a valid  email .' });
      }
  
      const driver = await DriverAuth.findOne({ email });
      if (!driver) {
        return res.status(404).json({ message: 'Driver not found' });
      }
  
      if (driver.status !== 'approved') {
        return res.status(403).json({ message: 'Not approved by admin yet.' });
      }
  
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      otpStore[driver.email] = otp;
  
      await DriverAuth.findByIdAndUpdate(driver._id, {
        otp,
        otpExpiry: new Date(Date.now() + 5 * 60 * 1000),
      });
  
      await sendOTP(driver.email, otp);
  
      res.status(200).json({
        message: 'OTP sent to registered email',
        driverId: driver._id
      });
    } catch (error) {
      console.error('Login failed:', error);
      res.status(500).json({ message: 'Failed to login' });
    }
  };
  
  // ✅ OTP Verification
  exports.verifyOTP = async (req, res) => {
    try {
      const { driverId, otp } = req.body;
  
      if (!driverId || !otp) {
        return res.status(400).json({ message: 'Missing driverId or OTP' });
      }
  
      const driver = await DriverAuth.findById(driverId);
      if (!driver) {
        return res.status(400).json({ message: 'Driver not found' });
      }
  
      // Debug log
      console.log("DB OTP:", driver.otp, "| Received OTP:", otp);
      console.log("OTP Expiry:", driver.otpExpiry, "| Current Time:", new Date());
  
      if (driver.otp !== String(otp) || new Date() > driver.otpExpiry) {
        return res.status(400).json({ message: 'Invalid or expired OTP' });
      }
  
      // Clear OTP info and mark verified
      driver.otp = null;
      driver.otpExpiry = null;
      driver.isVerified = true;
      await driver.save();
  
      const token = jwt.sign({ id: driver._id }, 'mysecretkey', { expiresIn: '1d' });
  
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000,
      });
  
      return res.status(200).json({ message: 'Login successful', token });
    } catch (error) {
      console.error('OTP verification failed:', error.message);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
  
  
  exports.sendDriverOTP = async (req, res) => {
    try {
      const { email } = req.body;
  
      if (!email) return res.status(400).json({ message: 'Email is required' });
  
      const driver = await DriverAuth.findOne({ email });
      if (!driver) return res.status(404).json({ message: 'Driver not found' });
  
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
  
      driver.otp = otp;
      driver.otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 mins expiry
      await driver.save();
  
      await sendOTP(email, otp);
  
      res.status(200).json({ message: 'OTP sent successfully', driverId: driver._id });
    } catch (error) {
      console.error('Sending OTP failed:', error);
      res.status(500).json({ message: 'Failed to send OTP' });
    }
  };
  
  exports.updateDriverProfile = async (req, res) => {
    try {
      const { driverId } = req.params;
      const updateData = req.body;
  
      console.log("Driver ID:", driverId);
      console.log("Update Data:", updateData);
  
      if (!Object.keys(updateData).length) {
        return res.status(400).json({ message: 'No data provided for update' });
      }
  
      const updatedDriver = await DriverAuth.findByIdAndUpdate(driverId, updateData, {
        new: true,
        runValidators: true,
      });
  
      if (!updatedDriver) {
        return res.status(404).json({ message: 'Driver not found' });
      }
  
      res.status(200).json({ message: 'Profile updated successfully', driver: updatedDriver });
    } catch (error) {
      console.error('Update profile failed:', error);
      res.status(500).json({ message: 'Failed to update profile' });
    }
  };
  

  exports.getDriverById = async (req, res) => {
    try {
      const { driverId } = req.params;
  
      const driver = await DriverAuth.findById(driverId);
  
      if (!driver) {
        return res.status(404).json({ message: 'Driver not found' });
      }
  
      res.status(200).json({ driver });
    } catch (error) {
      console.error('Get driver by ID failed:', error);
      res.status(500).json({ message: 'Failed to fetch driver' });
    }
  };

  exports.getAllDrivers = async (req, res) => {
    try {
      const drivers = await DriverAuth.find().sort({ createdAt: -1 }); // Optional sorting
  
      res.status(200).json({ drivers });
    } catch (error) {
      console.error('Get all drivers failed:', error);
      res.status(500).json({ message: 'Failed to fetch drivers' });
    }
  };
  
  exports.deleteDriver = async (req, res) => {
    try {
      const { driverId } = req.params;
  
      const deletedDriver = await DriverAuth.findByIdAndDelete(driverId);
  
      if (!deletedDriver) {
        return res.status(404).json({ message: 'Driver not found' });
      }
  
      res.status(200).json({ message: 'Driver deleted successfully', driver: deletedDriver });
    } catch (error) {
      console.error('Delete driver failed:', error);
      res.status(500).json({ message: 'Failed to delete driver' });
    }
  };
  




























// exports.login = async (req, res) => {
//   const { phone } = req.body;

//   try {
//     if (!phone || phone.length !== 10) {
//       return res.status(400).json({ message: 'Please provide a valid 10-digit phone number.' });
//     }

//     const driver = await DriverAuth.findOne({ phone });

//     if (!driver) {
//       return res.status(404).json({ message: 'No driver found. Please enter a registered phone number.' });
//     }

//     if (driver.status !== 'approved') {
//       return res.status(403).json({ message: 'Your registration is not approved yet.' });
//     }

//     const otp = Math.floor(1000 + Math.random() * 9000);
//     const fullPhone = `+91${phone}`;

//     console.log("Sending OTP to:", fullPhone, "| OTP:", otp);

//     await client.messages.create({
//       body: `Your OTP for login is: ${otp}`,
//       from: process.env.TWILIO_PHONE_NUMBER,
//       to: fullPhone,
//     });

//     // ✅ Store OTP temporarily
//     otpStore[driver._id] = otp;

//     res.status(200).json({ message: 'OTP sent successfully', driverId: driver._id });
//   } catch (error) {
//     console.error('Error sending OTP:', error);
//     res.status(500).json({ message: 'Failed to send OTP' });
//   }
// };


// exports.verifyOTP = async (req, res) => {
//   try {
//     const { driverId, otp } = req.body;

//     if (!driverId || !otp) {
//       console.log("Missing driverId or OTP");
//       return res.status(400).json({ message: 'Missing driverId or OTP' });
//     }

//     console.log("Verifying OTP for driverId:", driverId, " | OTP:", otp);

//     const storedOtp = otpStore[driverId];
//     console.log("Stored OTP:", storedOtp);

//     if (!storedOtp || parseInt(otp) !== storedOtp) {
//       console.log("Invalid or expired OTP");
//       return res.status(400).json({ message: 'Invalid or expired OTP' });
//     }

//     // Generate token
//     const token = jwt.sign({ id: driverId }, process.env.JWT_SECRET, { expiresIn: '1d' });

//     res.cookie('token', token, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === 'production',
//       sameSite: 'strict',
//       maxAge: 24 * 60 * 60 * 1000,
//     });

//     delete otpStore[driverId];

//     return res.status(200).json({ message: 'Login successful' });

//   } catch (error) {
//     console.error('OTP verification failed:', error.message);
//     console.error(error.stack); // 🔍 print full trace
//     res.status(500).json({ message: 'Internal server error' });
//   }
// };
