module.exports = function requireStudent(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ msg: 'Login required' });
  }
  if (req.session.user.role !== 'student') {
    return res.status(403).json({ msg: 'This action is only available to students' });
  }
  next();
};
