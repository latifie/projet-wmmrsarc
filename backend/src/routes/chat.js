const express = require('express')
const router = express.Router()
const chat = require('../controllers/chat.js')
const { verifyToken, isAdmin } = require('../middleware/auth.js')

router.get('/all', verifyToken(), isAdmin(), chat.getChats)
router.post('/new', verifyToken(), isAdmin(), chat.newChat)

module.exports = router