const express = require('express');
const router = express.Router();
const workersController = require('../controllers/workers');
const auth = require('../middleware/auth');

router.get('/', auth.optional, workersController.getAll);
router.get('/:id', auth.optional, workersController.getById);
router.post('/', auth.required, workersController.create);
router.put('/:id', auth.required, workersController.update);
router.delete('/:id', auth.required, workersController.delete);
router.patch('/:id/toggle-status', auth.required, workersController.toggleStatus);

module.exports = router;
