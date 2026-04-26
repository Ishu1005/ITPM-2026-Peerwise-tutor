const mongoose = require('mongoose');
const TutorRequest = require('../models/TutorRequest');
const Tutor = require('../models/Tutor');

exports.createTutorRequest = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { tutorId, subject, message, preferredDate, preferredTime, flowMode } = req.body;

    if (!tutorId || !mongoose.Types.ObjectId.isValid(tutorId)) {
      return res.status(400).json({ msg: 'Valid tutorId is required.' });
    }
    if (!subject || !String(subject).trim()) {
      return res.status(400).json({ msg: 'Subject / module is required.' });
    }
    if (!message || !String(message).trim()) {
      return res.status(400).json({ msg: 'Message is required.' });
    }

    const tutor = await Tutor.findById(tutorId);
    if (!tutor) return res.status(404).json({ msg: 'Tutor not found.' });

    const allowedModes = ['search', 'request', 'online'];
    const mode = allowedModes.includes(flowMode) ? flowMode : 'search';

    let prefDate;
    if (preferredDate) {
      prefDate = new Date(preferredDate);
      if (Number.isNaN(prefDate.getTime())) prefDate = undefined;
    }

    const doc = await TutorRequest.create({
      tutorId,
      studentUserId: userId,
      subject: String(subject).trim(),
      message: String(message).trim(),
      preferredDate: prefDate,
      preferredTime: preferredTime ? String(preferredTime).trim() : '',
      flowMode: mode
    });

    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
