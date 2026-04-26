module.exports = (req, res, next) => {
  if (req.session.user?.role === 'admin') {
    next();
  } else {
    res.status(403).json({ msg: 'Forbidden: Admins only' });
  }
};
