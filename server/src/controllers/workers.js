// Workers Controller
const workers = require('../models/mockData').workers;

exports.getAll = async (req, res) => {
  try {
    res.json({ success: true, data: workers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const worker = workers.find(w => w.id === parseInt(req.params.id));
    if (!worker) {
      return res.status(404).json({ success: false, error: 'Worker not found' });
    }
    res.json({ success: true, data: worker });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const newWorker = {
      id: workers.length + 1,
      ...req.body,
      isActive: true,
      createdAt: new Date().toISOString()
    };
    workers.push(newWorker);
    res.status(201).json({ success: true, data: newWorker });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const index = workers.findIndex(w => w.id === parseInt(req.params.id));
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Worker not found' });
    }
    workers[index] = { ...workers[index], ...req.body, updatedAt: new Date().toISOString() };
    res.json({ success: true, data: workers[index] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const index = workers.findIndex(w => w.id === parseInt(req.params.id));
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Worker not found' });
    }
    workers.splice(index, 1);
    res.json({ success: true, message: 'Worker deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.toggleStatus = async (req, res) => {
  try {
    const index = workers.findIndex(w => w.id === parseInt(req.params.id));
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Worker not found' });
    }
    workers[index].isActive = !workers[index].isActive;
    res.json({ success: true, data: workers[index] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
