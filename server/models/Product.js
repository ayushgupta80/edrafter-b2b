const mongoose = require('mongoose');


const productSchema = new mongoose.Schema({
  state: { type: String, required: true },
  serviceable: {type: Boolean, required: true}
}, { timestamps: true });


productSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    await User.updateMany(
      { "serviceCharges.product": doc._id },
      { $pull: { serviceCharges: { product: doc._id } } }
    );
  }
});


const Product = mongoose.model('Product', productSchema);

module.exports = Product;
