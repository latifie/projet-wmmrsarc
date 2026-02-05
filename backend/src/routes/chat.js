const express = require('express')
const router = express.Router()
const chat = require('../controllers/chat.js')
const { verifyToken, isAdmin } = require('../middleware/auth.js')

router.get('/', verifyToken(), chat.getChats)
router.post('/', verifyToken(), isAdmin(), chat.newChat)
router.get('/:id/status', verifyToken(), chat.getModelStatus)
router.post('/:id/message', verifyToken(), chat.sendMessage)

module.exports = router