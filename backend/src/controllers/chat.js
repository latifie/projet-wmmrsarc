const status = require('http-status')
const chatModel = require('../models/chats.js')
const userModel = require('../models/users.js')
const container = require('../util/chatManager.js')
const CodeError = require('../util/CodeError.js')

module.exports = {
  async newChat(req, res) {
    // #swagger.tags = ['Chats']
    // #swagger.summary = 'New chat'
    // #swagger.parameters['obj'] = { in: 'body', description: 'Either userId or userEmail', schema: { $model: 'llama3', $userId: 67, $userEmail: 'eeee@example.com' } }
    if (!req.body.model || !(req.body.userId || req.body.userEmail)) throw new CodeError('You must specify the model and the user id/email', status.BAD_REQUEST)
    const { model, userId, userEmail } = req.body
    let user
    if (userId) {
      user = await userModel.findOne({ where: { id: userId } })
    } else {
      user = await userModel.findOne({ where: { email: userEmail } })
    }
    if (!user) throw new CodeError('User does not exist', status.BAD_REQUEST)
    console.log(`Creating chat (userId = ${user.id}, model = ${model})`)
    const chat = await chatModel.create({ model, userId: user.id })
    const url = await container.createInstance(chat.id)
    await chatModel.update({ url }, { where: { id: chat.id } })
    const data = { url: url }
    res.json({ status: true, message: 'Chat created', data })
  },

  async getChats(req, res) {
    // #swagger.tags = ['Chats']
    // #swagger.summary = 'Get all chats'
    let where = {}
    if (!req.user.isAdmin) {
      where = { userId: req.user.id }
    }
    const data = await chatModel.findAll({ where, include: [userModel] })
    res.json({ status: true, message: 'Returning chats', data })
  },

  async sendMessage(req, res) {
    // #swagger.tags = ['Chats']
    // #swagger.summary = 'Send message to chat'
    const { id } = req.params
    const { message } = req.body

    const chat = await chatModel.findByPk(id)
    if (!chat) throw new CodeError('Chat not found', status.NOT_FOUND)

    // Verify user owns this chat (unless admin)
    if (!req.user.isAdmin && chat.userId !== req.user.id) {
      throw new CodeError('Unauthorized', status.FORBIDDEN)
    }

    try {
      const axios = require('axios')

      // Proxy request to Ollama
      const response = await axios.post(`${chat.url}/api/chat`, {
        model: chat.model.toLowerCase().replace(/\s+/g, ''),
        messages: [{ role: 'user', content: message }],
        stream: false
      }, {
        timeout: 120000 // 2 minutes timeout
      })

      res.json({
        status: true,
        message: 'Message sent',
        data: {
          response: response.data.message.content
        }
      })
    } catch (error) {
      console.error('Error sending message to Ollama:', error.message)
      throw new CodeError('Failed to communicate with AI model', status.INTERNAL_SERVER_ERROR)
    }
  },

  async getModelStatus(req, res) {
    // #swagger.tags = ['Chats']
    // #swagger.summary = 'Get model loading status'
    const { id } = req.params
    const progressCache = require('../util/downloadProgressCache');

    const chat = await chatModel.findByPk(id)
    if (!chat) throw new CodeError('Chat not found', status.NOT_FOUND)

    // Verify user owns this chat (unless admin)
    if (!req.user.isAdmin && chat.userId !== req.user.id) {
      throw new CodeError('Unauthorized', status.FORBIDDEN)
    }

    try {
      const axios = require('axios')

      // Check if model is loaded
      const response = await axios.get(`${chat.url}/api/tags`, {
        timeout: 5000
      })

      const modelName = chat.model.toLowerCase().replace(/\s+/g, '')
      // Check if model name matches (handles "tinyllama:latest" matching "tinyllama")
      const modelLoaded = response.data.models?.some(m => {
        const ollamaModelName = m.name.split(':')[0].toLowerCase()
        return ollamaModelName === modelName || modelName.includes(ollamaModelName)
      })

      // Get download progress from cache (parse ID to int as cache keys are integers)
      const downloadProgress = progressCache.getProgress(parseInt(id, 10));

      res.json({
        status: true,
        data: {
          modelLoaded,
          containerReady: true,
          downloadInProgress: !modelLoaded,
          downloadProgress
        }
      })
    } catch (error) {
      console.error('Error checking model status:', error.message)
      res.json({
        status: true,
        data: {
          modelLoaded: false,
          containerReady: false,
          downloadInProgress: false,
          downloadProgress: null
        }
      })
    }
  }
}
