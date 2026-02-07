const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['LOST', 'FOUND', 'CLAIMED', 'RETURNED'],
      default: 'LOST',
      required: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    images: {
      type: [String],
      default: [],
    },
    // Reference to the reporting user.
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);


itemSchema.index({ status: 1 });
itemSchema.index({ category: 1 });
itemSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Item', itemSchema);
