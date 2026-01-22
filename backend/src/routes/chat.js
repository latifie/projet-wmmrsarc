const express = require('express')
const router = express.Router()
const chat = require('../controllers/chat.js')
const { verifyToken, isAdmin } = require('../middleware/auth.js')

router.get('/all', verifyToken(), isAdmin(), chat.getChats)
router.get('/me', verifyToken(), chat.getMyChats)

router.post('/new', verifyToken(), isAdmin(), chat.newChat)

router.get('/:id', verifyToken(), chat.getChat)
router.post('/:id/send', verifyToken(), chat.sendMessage)

module.exports = router