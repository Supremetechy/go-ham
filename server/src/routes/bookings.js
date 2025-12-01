const express = require('express');
const router = express.Router();
const bookingsController = require('../controllers/bookings');
const auth = require('../middleware/auth');

router.get('/', auth.optional, bookingsController.getAll);
router.get('/:id', auth.optional, bookingsController.getById);
router.post('/', bookingsController.create);
router.put('/:id', auth.required, bookingsController.update);
router.delete('/:id', auth.required, bookingsController.delete);
router.patch('/:id/status', auth.required, bookingsController.updateStatus);

module.exports = router;
