const express = require('express');
const router = express.Router();
const clientsController = require('../controllers/clients');
const auth = require('../middleware/auth');

router.get('/', auth.optional, clientsController.getAll);
router.get('/:id', auth.optional, clientsController.getById);
router.get('/segment/:type', auth.optional, clientsController.segment);
router.post('/', clientsController.create);
router.put('/:id', auth.required, clientsController.update);
router.delete('/:id', auth.required, clientsController.delete);

module.exports = router;
