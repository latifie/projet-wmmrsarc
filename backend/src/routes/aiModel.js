const express = require('express')
const router = express.Router()
const aiModel = require('../controllers/aiModel.js')
const { verifyToken } = require('../middleware/auth.js')

router.get('/', verifyToken(), aiModel.getAll)
router.post('/', verifyToken(), aiModel.create)

module.exports = router
