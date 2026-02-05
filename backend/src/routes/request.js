const express = require('express')
const router = express.Router()
const request = require('../controllers/request.js')
const { verifyToken, isAdmin } = require('../middleware/auth.js')

router.get('/', verifyToken(), request.getMyRequests)
router.post('/', verifyToken(), request.create)

// Admin routes
router.get('/admin/all', verifyToken(), isAdmin(), request.getAllRequests)
router.post('/:id/approve', verifyToken(), isAdmin(), request.approve)
router.post('/:id/reject', verifyToken(), isAdmin(), request.reject)

module.exports = router
