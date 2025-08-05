const jwt = require('jsonwebtoken');
const sendOTP = require('../../utils/sendOTP')
const Service = require('../../models/shop/Service');
const Gallery = require('../../models/shop/Gallery');
const shopAuthModel = require('../../models/shop/shopAuthModel');

const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

const tempRegistrations = new Map(); // key: email, value: { data + otp }


exports.registerShop = async (req, res) => {
  try {
    const {
      ownerName,
      ownerEmail,
      ownerAddress,
      ownerNumber,
      hotelName,
      hotelEmail,
      hotelAddress,
      hotelAvable,
      hotelType,
      hotelNumber,
      enterGSTNumber,
      shopActLicenseNo,
      foodDrugLicenseNo,
      clerkLicenseNo,
      latitude,
      longitude
    } = req.body;

    if (
      !ownerName || !ownerEmail || !ownerAddress || !ownerNumber ||
      !hotelName || !hotelEmail || !hotelAddress || !hotelNumber || !hotelAvable ||
      !hotelType
    ) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }

    // Get uploaded file URLs from Cloudinary
    const files = req.files;

    const shop = new shopAuthModel({
      ownerName,
      ownerEmail: ownerEmail.toLowerCase().trim(),
      ownerAddress,
      ownerNumber,
      hotelName,
      hotelAvable,
      hotelType,
      hotelEmail: hotelEmail.toLowerCase().trim(),
      hotelAddress,
      hotelNumber,
      hotelImage: files?.hotelImage?.[0]?.path || '',
      locations: {
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null
      },
      enterGSTNumber,
      enterGSTImage: files?.enterGSTImage?.[0]?.path || '',
      shopActLicenseNo,
      shopActLicenseImage: files?.shopActLicenseImage?.[0]?.path || '',
      foodDrugLicenseNo,
      foodDrugLicenseImage: files?.foodDrugLicenseImage?.[0]?.path || '',
      clerkLicenseNo,
      clerkLicenseImage: files?.clerkLicenseImage?.[0]?.path || ''
    });

    await shop.save();
    res.status(201).json({ message: 'Shop registered successfully, pending approval.', shop });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register shop' });
  }
};

exports.updateShopStatus = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("sdsdsdsddid", id);
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const reporter = await shopAuthModel.findByIdAndUpdate(
      id,
      { isApproved: status },
      { new: true }
    );

    if (!reporter) return res.status(404).json({ error: 'Reporter not found' });

    res.status(200).json({ message: `Reporter ${status} successfully`, reporter });
  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
};


exports.login = async (req, res) => {
  try {
    const { hotelEmail } = req.body;
    // console.log("hotelEmail",hotelEmail);

    if (!hotelEmail) return res.status(400).json({ message: 'Hotel email is required' });

    const shop = await shopAuthModel.findOne({ hotelEmail: hotelEmail.toLowerCase().trim() });

    if (!shop) return res.status(404).json({ message: 'Shop not found' });

    if (shop.isApproved !== 'approved') {
      return res.status(403).json({ message: 'Shop is not approved yet' });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    shop.otp = otp;
    shop.otpExpiry = otpExpiry;
    await shop.save();

    await sendOTP(hotelEmail, otp);

    res.status(200).json({ message: 'OTP sent successfully', shopId: shop._id });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
};


exports.verifyOTP = async (req, res) => {
  try {
    const { shopId, otp } = req.body;

    if (!shopId || !otp) {
      return res.status(400).json({ message: 'Shop ID and OTP are required' });
    }

    const shop = await shopAuthModel.findById(shopId);

    if (!shop || shop.otp !== otp || new Date() > shop.otpExpiry) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    shop.otp = null;
    shop.otpExpiry = null;
    shop.isLogin = true;
    await shop.save();

    const token = jwt.sign({ id: shop._id }, process.env.JWT_KEY, { expiresIn: '1d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: 'Login successful',
      token,
      shop: {
        _id: shop._id,
        ownerName: shop.ownerName,
        ownerEmail: shop.ownerEmail,
        ownerAddress: shop.ownerAddress,
        ownerNumber: shop.ownerNumber,
        hotelName: shop.hotelName,
        hotelEmail: shop.hotelEmail,
        hotelAddress: shop.hotelAddress,
        hotelNumber: shop.hotelNumber,
        hotelImage: shop.hotelImage,
        latitude: shop.latitude,
        longitude: shop.longitude,

        enterGSTNumber: shop.enterGSTNumber,
        enterGSTImage: shop.enterGSTImage,
        shopActLicenseNo: shop.shopActLicenseNo,
        shopActLicenseImage: shop.shopActLicenseImage,
        foodDrugLicenseNo: shop.foodDrugLicenseNo,
        foodDrugLicenseImage: shop.foodDrugLicenseImage,
        clerkLicenseNo: shop.clerkLicenseNo,
        clerkLicenseImage: shop.clerkLicenseImage,

        isApproved: shop.isApproved,
        isLogin: shop.isLogin,
        createdAt: shop.createdAt,
        updatedAt: shop.updatedAt
      }
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'OTP verification failed' });
  }
};



exports.resendOtp = async (req, res) => {
  const { hotelEmail } = req.body;
  try {
    const shop = await shopAuthModel.findOne({ hotelEmail }); // Corrected model name
    if (!shop) return res.status(404).json({ error: 'hotelEmail not found' });

    const otp = generateOTP();
    shop.otp = otp;
    shop.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
    await shop.save();

    await sendOTP(hotelEmail, otp);
    res.status(200).json({ message: 'OTP resent successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Resend OTP failed' });
  }
};

exports.getShopDetails = async (req, res) => {
  const { shopId } = req.params;

  try {
    const shop = await shopAuthModel.findById(shopId);
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    res.status(200).json({ shop });
  } catch (err) {
    console.error('Get shop error:', err);
    res.status(500).json({ error: 'Failed to fetch shop details' });
  }
};

exports.getShopWithServicesGallery = async (req, res) => {
  const { shopId } = req.params;

  try {
    const shop = await shopAuthModel.findById(shopId);
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    // Fetch services for this shop
    const services = await Service.find({ shopId });

    // Fetch gallery for this shop
    const gallery = await Gallery.find({ shopId });

    res.status(200).json({
      shop,
      services,
      gallery
    });
  } catch (err) {
    console.error('Get shop error:', err);
    res.status(500).json({ error: 'Failed to fetch shop details' });
  }
};

exports.updateShopDetails = async (req, res) => {
  const { shopId } = req.params;
  const {
    ownerName,
    ownerEmail,
    ownerAddress,
    ownerNumber,
    hotelName,
    hotelEmail,
    hotelAddress,
    hotelNumber,
    enterGSTNumber,
    shopActLicenseNo,
    foodDrugLicenseNo,
    clerkLicenseNo,
    hotelAvable,
hotelType,
    latitude,
    longitude
  } = req.body;

  try {
    const shop = await shopAuthModel.findById(shopId);
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    // Text field updates
    if (ownerName) shop.ownerName = ownerName.trim();
    if (ownerEmail) shop.ownerEmail = ownerEmail.toLowerCase().trim();
    if (ownerAddress) shop.ownerAddress = ownerAddress.trim();
    if (ownerNumber) shop.ownerNumber = ownerNumber.trim();
    if (hotelAvable) shop.hotelAvable = hotelAvable.trim();
    if (hotelType) shop.hotelType = hotelType.trim();

    if (hotelName) shop.hotelName = hotelName.trim();
    if (hotelEmail) shop.hotelEmail = hotelEmail.toLowerCase().trim();
    if (hotelAddress) shop.hotelAddress = hotelAddress.trim();
    if (hotelNumber) shop.hotelNumber = hotelNumber.trim();
    if (latitude) shop.latitude = latitude.trim();
    if (longitude) shop.longitude = longitude.trim();

    if (enterGSTNumber) shop.enterGSTNumber = enterGSTNumber.trim();
    if (shopActLicenseNo) shop.shopActLicenseNo = shopActLicenseNo.trim();
    if (foodDrugLicenseNo) shop.foodDrugLicenseNo = foodDrugLicenseNo.trim();
    if (clerkLicenseNo) shop.clerkLicenseNo = clerkLicenseNo.trim();

    // Image updates if files are uploaded
    const files = req.files;

    if (files?.enterGSTImage?.[0]) {
      shop.enterGSTImage = files.enterGSTImage[0].path;
    }
    if (files?.shopActLicenseImage?.[0]) {
      shop.shopActLicenseImage = files.shopActLicenseImage[0].path;
    }
    if (files?.foodDrugLicenseImage?.[0]) {
      shop.foodDrugLicenseImage = files.foodDrugLicenseImage[0].path;
    }
    if (files?.clerkLicenseImage?.[0]) {
      shop.clerkLicenseImage = files.clerkLicenseImage[0].path;
    }
    if (files?.hotelImage?.[0]) {
      shop.hotelImage = files.hotelImage[0].path;
    }

    await shop.save();

    res.status(200).json({ message: 'Shop updated successfully', shop });
  } catch (err) {
    console.error('Update shop error:', err);
    res.status(500).json({ error: 'Failed to update shop' });
  }
};


exports.getAllShops = async (req, res) => {
  try {
    const shops = await shopAuthModel.find().sort({ createdAt: -1 }); // newest first
    res.status(200).json({ shops });
  } catch (err) {
    console.error('Get all shops error:', err);
    res.status(500).json({ error: 'Failed to fetch shops' });
  }
};



exports.deleteShop = async (req, res) => {
  const { shopId } = req.params;

  try {
    const deletedShop = await shopAuthModel.findByIdAndDelete(shopId);

    if (!deletedShop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    res.status(200).json({ message: 'Shop deleted successfully' });
  } catch (err) {
    console.error('Delete shop error:', err);
    res.status(500).json({ error: 'Failed to delete shop' });
  }
};

exports.getApprovedShops = async (req, res) => {
  try {
    const approvedShops = await shopAuthModel.find({ isApproved: 'approved' });

    if (!approvedShops || approvedShops.length === 0) {
      return res.status(404).json({ message: 'No approved shops found' });
    }

    res.status(200).json({ shops: approvedShops });
  } catch (error) {
    console.error('Error getting approved shops:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
exports.getShopsByStatus = async (req, res) => {
  try {
    const { status } = req.params;

    const validStatuses = ['pending', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const shops = await shopAuthModel.find({ isApproved: status });

    if (!shops || shops.length === 0) {
      return res.status(404).json({ message: `No ${status} shops found` });
    }

    res.status(200).json({ status, shops });
  } catch (error) {
    console.error(`Error getting ${req.params.status} shops:`, error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
