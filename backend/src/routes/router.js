const router = require('express').Router()

// This middleware adds the json header to every response
router.use('/', (req, res, next) => {
  res.setHeader('Content-Type', 'application/json')
  next()
})

// API ROUTES (sous /api)
// Authentication routes
router.use('/api/auth', require('./auth'))

// User routes  
router.use('/api/users', require('./user'))

// Request routes (LLM)
router.use('/api/requests', require('./requests'))

// LEGACY ROUTES (compatibilité)
// Legacy login route
router.post('/api/login', require('../controllers/user').login)

module.exports = router