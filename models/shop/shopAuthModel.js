// const mongoose = require('mongoose');

// const shopSchema = new mongoose.Schema({
//   ownerName: String,
//   ownerEmail: { type: String, unique: true },
//   ownerAddress: String,
//   ownerNumber: String,

//   HotelName: String,
//   HotelEmail:  { type: String, unique: true },
//   HotelAddress: String,
//   HotelNumber: String,


//   EnterGSTNumber:String,
//   EnterGSTImage:String,
//   ShopActLicenseNo:String,
//   ShopActLicenseImage:String,
//   FoodDrugLicenseNo: String,
//   FoodDrugLicenseImage: String,
//   ClerkLicenseNo :String,
//   ClerkLicenseImage :String,
//   otp: String,       // Should be String
//   otpExpiry: Date,  
// }, {
//   timestamps: true 
// });

// module.exports = mongoose.model('Shop', shopSchema);
const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
  ownerName: { type: String, required: true, trim: true },
  ownerEmail: { type: String, required: true, unique: true, lowercase: true, trim: true },
  ownerAddress: { type: String, required: true },
  ownerNumber: { type: String, required: true },  // Add regex if you want strict validation

  hotelName: { type: String, required: true },
  hotelEmail: { type: String, required: true, unique: true, lowercase: true, trim: true },
  hotelAddress: { type: String, required: true },
  hotelNumber: { type: String, required: true },
  hotelImage: { type: String },

  enterGSTNumber: { type: String },
  enterGSTImage: { type: String },
  shopActLicenseNo: { type: String },
  shopActLicenseImage: { type: String },
  foodDrugLicenseNo: { type: String },
  foodDrugLicenseImage: { type: String },
  clerkLicenseNo: { type: String },
  clerkLicenseImage: { type: String },
  locations: {
    latitude: {
      type: Number,
      required: false
    },
    longitude: {
      type: Number,
      required: false
    }
  },
  otp: { type: String },
  otpExpiry: { type: Date },
  isApproved: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  isLogin: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('Shop', shopSchema);
