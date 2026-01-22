const status = require('http-status')
const chatModel = require('../models/chats.js')
const userModel = require('../models/users.js')
const container = require('../util/chatManager.js')
const CodeError = require('../util/CodeError.js')
const { isOwnerOrAdmin } = require('../middleware/auth.js')

module.exports = {
  async newChat(req, res) {
    // #swagger.tags = ['Chats']
    // #swagger.summary = 'New chat'
    // #swagger.parameters['obj'] = { in: 'body', description: 'Either userId or userEmail', schema: { $model: 'llama3', $userId: 67, $userEmail: 'eeee@example.com' } }
    if (!req.body.model || !(req.body.userId || req.body.userEmail)) throw new CodeError('You must specify the model and the user id/email', status.BAD_REQUEST)
    const { model, userId, userEmail } = req.body
    if (userId) {
      user = await userModel.findOne({ where: { id: userId } })
    } else {
      user = await userModel.findOne({ where: { email: userEmail } })
    }
    if (!user) throw new CodeError('User does not exist', status.BAD_REQUEST)
    console.log(`Creating chat (userId = ${user.id}, model = ${model})`)
    const chat = await chatModel.create({ model, userId: user.id })
    const url = await container.createInstance(chat.id, model)
    await chatModel.update({ url }, { where: { id: chat.id } })
    const data = { url: url }
    res.json({ status: true, message: 'Chat created', data })
  },

  async getChats(req, res) {
    // #swagger.tags = ['Chats']
    // #swagger.summary = 'Get all chats'
    const data = await chatModel.findAll()
    res.json({ status: true, message: 'Returning chats', data })
  },

  async getMyChats(req, res) {
    // #swagger.tags = ['Chats']
    // #swagger.summary = "Get current user's chats"
    const data = await chatModel.findAll({ where: { userId: req.user.id } })
    res.json({ status: true, message: 'Returning chats', data })
  },

  async getChat(req, res) {
    // #swagger.tags = ['Chats']
    // #swagger.summary = "Get chat by id"
    const data = await chatModel.findOne({ where: { id: req.params.id } })
    if (!data) throw new CodeError('Chat does not exist', status.BAD_REQUEST)
    if (!isOwnerOrAdmin(data.userId)) throw new CodeError('Unauthorized', status.UNAUTHORIZED)
    res.json({ status: true, message: 'Returning chat', data })
  },

  async sendMessage(req, res) {
    // #swagger.tags = ['Chats']
    // #swagger.summary = "Send message in chat by id"
    // #swagger.parameters['obj'] = { in: 'body', schema: { $message: 'Hi!' } }
    const data = await chatModel.findOne({ where: { id: req.params.id } })
    if (!data) throw new CodeError('Chat does not exist', status.BAD_REQUEST)
    if (!isOwnerOrAdmin(data.userId)) throw new CodeError('Unauthorized', status.UNAUTHORIZED)

    const messageObj = { role: "user", content: req.body.message }
    json = await fetch(data.url + "/api/chat", {
      method: 'POST',
      body: new URLSearchParams({ model: data.model, messages: data.history + [messageObj] })
    })
    const answerObj = { role: "assistant", content: json.message.content }

    chatModel.update({ history: data.history + [messageObj, answerObj] }, { where: { id: data.id } })
    res.json({ status: true, message: 'Returning answer', data: { message: json.message } })
  },
}
