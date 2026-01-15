const express = require('express')
const router = express.Router()
const authController = require('../controllers/auth.js')
const { verifyToken } = require('../middleware/auth.js')

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', authController.register)

/**
 * @route POST /api/auth/login
 * @desc Login user and return tokens
 * @access Public
 */
router.post('/login', authController.login)

/**
 * @route POST /api/auth/refresh
 * @desc Refresh access token using refresh token
 * @access Public
 */
router.post('/refresh', authController.refresh)

/**
 * @route POST /api/auth/logout
 * @desc Logout user and invalidate refresh token
 * @access Public
 */
router.post('/logout', authController.logout)

/**
 * @route GET /api/auth/me
 * @desc Get current user information
 * @access Private (requires valid access token)
 */
router.get('/me', verifyToken(), authController.me)

module.exports = router