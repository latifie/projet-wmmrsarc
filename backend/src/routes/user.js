const express = require('express')
const router = express.Router()
const user = require('../controllers/user.js')
const { verifyToken, isAdmin, isOwnerOrAdmin } = require('../middleware/auth.js')

/**
 * Legacy routes for backward compatibility
 * WARNING: These routes are deprecated
 */
router.post('/login', user.login)
router.post('/users', user.newUser)

/**
 * Protected routes - require authentication
 */

// Get all users - requires authentication
router.get('/users', verifyToken(), user.getUsers)

// Update user - requires to be the owner or admin
router.put('/users/:id', verifyToken(), isOwnerOrAdmin(), user.updateUser)

// Delete user - requires admin privileges
router.delete('/users/:id', verifyToken(), isAdmin(), user.deleteUser)

module.exports = router