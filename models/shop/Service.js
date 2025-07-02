
// const mongoose = require('mongoose');

// const serviceSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   image: { type: String,  }, // Cloudinary URL or file path
//   shopId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Shop',
//     required: true,
//   },
// }, { timestamps: true });

// module.exports = mongoose.model('Service', serviceSchema);
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  preparationTime: { type: Number, required: true },
  foodCategory: {
    type: String,
    enum: ['Veg', 'Non-Veg'],
    default: 'Veg',
  },
  available: {
    type: String,
    enum: ['Available', 'Unavailable'],
    default: 'Available',
  },
  image: { type: String }
}, { _id: true });

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String },
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true,
  },
  products: [productSchema] // ⬅️ Add products array here
}, { timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);
