// Bookings Controller
const bookings = require('../models/mockData').bookings;

exports.getAll = async (req, res) => {
  try {
    res.json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const booking = bookings.find(b => b.id === parseInt(req.params.id));
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }
    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const newBooking = {
      id: bookings.length + 1,
      ...req.body,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    bookings.push(newBooking);
    
    // TODO: Alert workers
    res.status(201).json({ success: true, data: newBooking });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const index = bookings.findIndex(b => b.id === parseInt(req.params.id));
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }
    bookings[index] = { ...bookings[index], ...req.body, updatedAt: new Date().toISOString() };
    res.json({ success: true, data: bookings[index] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const index = bookings.findIndex(b => b.id === parseInt(req.params.id));
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }
    bookings.splice(index, 1);
    res.json({ success: true, message: 'Booking deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const index = bookings.findIndex(b => b.id === parseInt(req.params.id));
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }
    bookings[index].status = req.body.status;
    bookings[index].updatedAt = new Date().toISOString();
    res.json({ success: true, data: bookings[index] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
