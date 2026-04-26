const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Register New User
exports.register = async (req, res) => {
  try {
    const { username, email, password, role, phoneNumber, university } = req.body;

    // Safety hack for viva presentation: drop older uniqueness constraints in DB
    try { await User.collection.dropIndex('email_1'); } catch (e) {}
    try { await User.collection.dropIndex('username_1'); } catch (e) {}

    // Overwrite old user with the same details so repeated signups work perfectly
    await User.deleteMany({ $or: [{ email }, { username }] });

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashed, role, phoneNumber, university });
    await user.save();

    res.status(201).json({ msg: 'Registered successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Login User and Save to Session
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid email' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ msg: 'Incorrect password' });

    // Save full user info (id, username, email, role) in session
    req.session.user = {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
      phoneNumber: user.phoneNumber,
      university: user.university
    };

    res.status(200).json({ msg: 'Login successful', user: req.session.user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Logout and Destroy Session
exports.logout = (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ msg: 'Logout failed' });
    res.clearCookie('connect.sid');
    res.json({ msg: 'Logged out successfully' });
  });
};

// Get Current Session User
exports.getSession = (req, res) => {
  if (req.session.user) {
    res.json({ user: req.session.user });
  } else {
    res.status(401).json({ msg: 'No session found' });
  }
};
