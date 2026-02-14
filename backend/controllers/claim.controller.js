const mongoose = require('mongoose');
const Claim = require('../models/claim.model');
const Item = require('../models/item.model');

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/**
 * Create a claim (non-owner, item must be FOUND)
 */
const createClaim = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { itemId, message } = req.body;

    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      throw new HttpError(400, 'Invalid item id');
    }

    let createdClaim;

    await session.withTransaction(async () => {
      const item = await Item.findById(itemId).session(session);

      if (!item) {
        throw new HttpError(404, 'Item not found');
      }

      if (!['LOST', 'FOUND'].includes(item.status)) {
        throw new HttpError(400, 'Claims allowed only when item is LOST or FOUND');
      }

      if (item.createdBy.toString() === req.user.id) {
        throw new HttpError(403, 'Owner cannot claim their own item');
      }

      const existingClaim = await Claim.findOne({
        itemId: item._id,
        claimantId: req.user.id,
      }).session(session);

      if (existingClaim) {
        throw new HttpError(409, 'You already claimed this item');
      }

      const [claim] = await Claim.create(
        [
          {
            itemId: item._id,
            claimantId: req.user.id,
            message: message || '',
            status: 'PENDING',
            previousItemStatus: item.status,
          },
        ],
        { session }
      );

      item.status = 'PENDING';
      await item.save({ session });
      createdClaim = claim;
    });

    res.status(201).json(createdClaim);
  } catch (error) {
    console.error('createClaim error:', error);

    if (error instanceof HttpError) {
      return res.status(error.status).json({ message: error.message });
    }

    res.status(500).json({ message: 'Failed to create claim' });
  } finally {
    session.endSession();
  }
};

/**
 * Get all claims for an item (ONLY OWNER)
 */
const getClaimsForItem = async (req, res) => {
  try {
    const { itemId } = req.query;

    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ message: 'Invalid item id' });
    }

    const item = await Item.findById(itemId);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (item.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only owner can view claims' });
    }

    const claims = await Claim.find({ itemId })
      .populate('claimantId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json(claims);
  } catch (error) {
    console.error('getClaimsForItem error:', error);
    res.status(500).json({ message: 'Failed to fetch claims' });
  }
};

/**
 * Approve / Reject claim (OWNER only)
 */
const reviewClaim = (decision) => async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { id: claimId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(claimId)) {
      throw new HttpError(400, 'Invalid claim id');
    }

    let reviewedClaim;
    let reviewedItem;

    await session.withTransaction(async () => {
      const claim = await Claim.findById(claimId).session(session);

      if (!claim) {
        throw new HttpError(404, 'Claim not found');
      }

      const item = await Item.findById(claim.itemId).session(session);

      if (!item) {
        throw new HttpError(404, 'Item not found');
      }

      if (item.createdBy.toString() !== req.user.id) {
        throw new HttpError(403, 'Only owner can review claims');
      }

      if (claim.status !== 'PENDING') {
        throw new HttpError(400, 'Claim already reviewed');
      }

      if (!['LOST', 'FOUND', 'PENDING'].includes(item.status)) {
        throw new HttpError(400, 'Item cannot be reviewed in current state');
      }

      if (decision === 'APPROVED') {
        claim.status = 'APPROVED';
      } else {
        claim.status = 'REJECTED';
        item.status = claim.previousItemStatus;
      }

      await claim.save({ session });
      await item.save({ session });

      reviewedClaim = claim;
      reviewedItem = item;
    });

    res.status(200).json({ claim: reviewedClaim, item: reviewedItem });
  } catch (error) {
    console.error('reviewClaim error:', error);

    if (error instanceof HttpError) {
      return res.status(error.status).json({ message: error.message });
    }

    res.status(500).json({ message: 'Failed to review claim' });
  } finally {
    session.endSession();
  }
};

const getMyClaims = async (req, res) => {
  try {
    const claims = await Claim.find({ claimantId: req.user.id })
      .populate('itemId')
      .sort({ createdAt: -1 });

    res.status(200).json(claims);
  } catch (error) {
    console.error('getMyClaims error:', error);
    res.status(500).json({ message: 'Failed to fetch your claims' });
  }
};

const getReceivedClaims = async (req, res) => {
  try {
    const myItems = await Item.find({ createdBy: req.user.id }).select('_id');

    const itemIds = myItems.map((i) => i._id);

    const claims = await Claim.find({ itemId: { $in: itemIds } })
      .populate('claimantId', 'name email')
      .populate('itemId', 'title status')
      .sort({ createdAt: -1 });

    res.status(200).json(claims);
  } catch (error) {
    console.error('getReceivedClaims error:', error);
    res.status(500).json({ message: 'Failed to fetch received claims' });
  }
};

module.exports = {
  createClaim,
  getClaimsForItem,
  getMyClaims,
  getReceivedClaims,
  approveClaim: reviewClaim('APPROVED'),
  rejectClaim: reviewClaim('REJECTED'),
};
