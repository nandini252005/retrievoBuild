const bcrypt = require('bcrypt');

const { User } = require('../models');

const SALT_ROUNDS = 10;

const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('_id name email');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({
      id: user._id,
      name: user.name,
      email: user.email,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch profile' });
  }
};

const updateMyProfile = async (req, res) => {
  try {
    const { name, password } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'name is required' });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.name = name.trim();

    if (password) {
      user.passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    }

    await user.save();

    return res.json({
      id: user._id,
      name: user.name,
      email: user.email,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update profile' });
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
};
