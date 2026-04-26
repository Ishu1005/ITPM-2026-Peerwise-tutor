const LearningModule = require('../models/Module');

const DEFAULT_MODULES = [
  { title: 'Java', code: 'JAVA', sortOrder: 10 },
  { title: 'React', code: 'REACT', sortOrder: 20 },
  { title: 'Python', code: 'PYTHON', sortOrder: 30 },
  { title: 'DBMS', code: 'DBMS', sortOrder: 40 },
  { title: 'JavaScript', code: 'JS', sortOrder: 50 },
  { title: 'Data Structures', code: 'DSA', sortOrder: 60 },
  { title: 'ITPM', code: 'ITPM', sortOrder: 70 },
  { title: 'Machine Learning', code: 'ML', sortOrder: 80 },
  { title: 'Web Development', code: 'IWT', sortOrder: 90 },
  { title: 'Object Oriented Programming', code: 'OOP', sortOrder: 100 }
];

exports.seedModulesIfEmpty = async function seedModulesIfEmpty() {
  try {
    const n = await LearningModule.countDocuments();
    if (n === 0) {
      await LearningModule.insertMany(DEFAULT_MODULES);
      console.log('Seeded default learning modules.');
    }
  } catch (e) {
    console.warn('Module seed skipped:', e.message);
  }
};

exports.getModules = async (req, res) => {
  try {
    const list = await LearningModule.find({ active: true }).sort({ sortOrder: 1, title: 1 }).lean();
    const payload =
      list.length > 0
        ? list.map(m => ({ title: m.title, code: m.code || m.title, _id: m._id }))
        : DEFAULT_MODULES.map(m => ({ title: m.title, code: m.code }));
    res.json(payload);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
