// Clients Controller
const clients = require('../models/mockData').clients;

exports.getAll = async (req, res) => {
  try {
    res.json({ success: true, data: clients });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const client = clients.find(c => c.id === parseInt(req.params.id));
    if (!client) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }
    res.json({ success: true, data: client });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const newClient = {
      id: clients.length + 1,
      ...req.body,
      totalSpent: 0,
      tags: [],
      createdAt: new Date().toISOString()
    };
    clients.push(newClient);
    res.status(201).json({ success: true, data: newClient });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const index = clients.findIndex(c => c.id === parseInt(req.params.id));
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }
    clients[index] = { ...clients[index], ...req.body, updatedAt: new Date().toISOString() };
    res.json({ success: true, data: clients[index] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const index = clients.findIndex(c => c.id === parseInt(req.params.id));
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }
    clients.splice(index, 1);
    res.json({ success: true, message: 'Client deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.segment = async (req, res) => {
  try {
    const { type } = req.params;
    let filtered = [];
    
    switch(type) {
      case 'vip':
        filtered = clients.filter(c => c.totalSpent > 300);
        break;
      case 'new':
        filtered = clients.filter(c => c.tags?.includes('New Customer'));
        break;
      case 'inactive':
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        filtered = clients.filter(c => new Date(c.lastService) < threeMonthsAgo);
        break;
      default:
        filtered = clients;
    }
    
    res.json({ success: true, data: filtered });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
