const router = require('express').Router()

// This middleware adds the json header to every response for the api
router.use('/', (req, res, next) => {
  res.setHeader('Content-Type', 'application/json')
  next()
})

// Health check route
router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' })
})

// Authentication routes
router.use('/auth', require('./auth'))

// User routes
router.use('/users', require('./user'))

// Chat routes
router.use('/chats', require('./chat'))
router.use('/models', require('./aiModel'))
router.use('/requests', require('./request'))

module.exports = router