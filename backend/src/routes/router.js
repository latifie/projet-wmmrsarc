const router = require('express').Router()

// This middleware adds the json header to every response for the api
router.use('/', (req, res, next) => {
  res.setHeader('Content-Type', 'application/json')
  next()
})

// Authentication routes (NOUVEAU)
router.use('/auth', require('./auth'))

// User routes (legacy + protected)
router.use(require('./user'))

module.exports = router