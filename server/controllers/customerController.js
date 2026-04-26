const Student = require('../models/Student');

exports.createCustomer = async (req, res) => {
  try {
    const { userId, fullName, email, phone, faculty, enrolledYear } = req.body;
    const newStudent = new Student({ userId, fullName, email, phone, faculty, enrolledYear });
    await newStudent.save();
    res.status(201).json(newStudent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllCustomers = async (req, res) => {
  try {
    const { search } = req.query;
    const query = search ? { fullName: { $regex: search, $options: 'i' } } : {};
    const students = await Student.find(query);
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const id = req.params.id;
    const data = req.body;
    const updatedStudent = await Student.findByIdAndUpdate(id, data, { new: true });
    res.json(updatedStudent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    const id = req.params.id;
    await Student.findByIdAndDelete(id);
    res.json({ msg: 'Student deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
