// const mongoose = require('mongoose');

// const productSchema = new mongoose.Schema({
//   service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
//   name: { type: String, required: true },
//   Description: { type: String, required: true },
//   price: { type: Number, required: true },
//   PreparationTime: { type: Number, required: true },
//   FoodCategory: {
//     type: String,
//     enum: ['veg', 'non-veg'], default: 'veg'
//   },
//   Available: { type: String, enum: ['Available', 'Unavailable'], default: 'Available' },
//   image: { type: String }, // Cloudinary/local image path
// }, { timestamps: true });

// module.exports = mongoose.model('Product', productSchema);
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  // serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  // shopId: {type: mongoose.Schema.Types.ObjectId,ref: 'Shop',required: true},
  // name: { type: String, required: true },
  // description: { type: String, required: true },
  // price: { type: Number, required: true },
  // preparationTime: { type: Number, required: true },
  // foodCategory: {
  //   type: String,
  //   enum: ['Veg', 'Non-Veg'],
  //   default: 'Veg',
  // },
  // available: {
  //   type: String,
  //   enum: ['Available', 'Unavailable'],
  //   default: 'Available',
  // },
  image: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
