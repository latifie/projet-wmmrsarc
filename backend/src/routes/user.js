const express = require('express')
const router = express.Router()
const user = require('../controllers/user.js')
const { verifyToken, isAdmin, isOwnerOrAdmin } = require('../middleware/auth.js')

/**
 * Protected routes - require authentication
 */

// Get all users - requires authentication
router.get('/', verifyToken(), user.getUsers)

// Update user - requires to be the owner or admin
router.put('/:id', verifyToken(), isOwnerOrAdmin(), user.updateUser)

// Delete user - requires admin privileges
router.delete('/:id', verifyToken(), isAdmin(), user.deleteUser)

module.exports = router