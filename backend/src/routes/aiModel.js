const express = require('express')
const router = express.Router()
const aiModel = require('../controllers/aiModel.js')
const { verifyToken, isAdmin } = require('../middleware/auth.js')

router.get('/', verifyToken(), aiModel.getAll)
router.get('/search', verifyToken(), isAdmin(), aiModel.search)
router.post('/', verifyToken(), isAdmin(), aiModel.create)
router.delete('/:id', verifyToken(), isAdmin(), aiModel.delete)

module.exports = router
