module.exports = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ msg: 'Access denied. Please log in.' });
  }
  next();
};
