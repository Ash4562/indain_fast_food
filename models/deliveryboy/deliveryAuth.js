const mongoose = require('mongoose');

const DeliveryboySchema = new mongoose.Schema({
  Name: String,
  email: { type: String, unique: true },
  address:{type:String},
  contactNo: String,
  VehicleType:{type:String},
  VehicleName:{type:String},
  VehicleNumber:{type:String},
  RCbookNumber:{type:String},
  DrivingLicenceNo: String,
  IDProofNo: String,
  IDProofImage: String,
  DrivingLicenceImage: String,
  ProfileImage:{type:String},
  RCbookImage:{type:String},
  deliveryBoyAvailable: { type: String, enum: ["Available", "Notavailable"], default: "Available" },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
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
  isVerified: { type: Boolean, default: false },
  otp: String,     
  otpExpiry: Date,  

}, {
  timestamps: true 
});

module.exports = mongoose.model('DeliveryBoy', DeliveryboySchema);