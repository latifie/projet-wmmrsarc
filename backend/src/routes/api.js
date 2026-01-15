const router = require('express').Router()

// This middleware adds the json header to every response for the api
router.use('/', (req, res, next) => {
  res.setHeader('Content-Type', 'application/json')
  next()
})

// Authentication routes
router.use('/auth', require('./auth'))

// User routes
router.use('/users', require('./user'))

module.exports = router