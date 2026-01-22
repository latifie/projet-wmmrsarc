const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Routes utilisateur
router.get('/', verifyToken, requestController.getUserRequests);
router.post('/', verifyToken, requestController.createRequest);
router.get('/:id', verifyToken, requestController.getRequestById);

// Routes admin
router.get('/admin/all', verifyToken, isAdmin, requestController.getAllRequests);
router.post('/:id/approve', verifyToken, isAdmin, requestController.approveRequest);
router.post('/:id/reject', verifyToken, isAdmin, requestController.rejectRequest);

module.exports = router;