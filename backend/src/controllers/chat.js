const status = require('http-status')
const chatModel = require('../models/chats.js')
const userModel = require('../models/users.js')
const container = require('../util/chatManager.js')
const CodeError = require('../util/CodeError.js')

module.exports = {
  async newChat(req, res) {
    // #swagger.tags = ['Chats']
    // #swagger.summary = 'New chat'
    // #swagger.parameters['obj'] = { in: 'body', schema: { $model: 'llama3', oneOf: [$userId: 67, $userEmail: 'eeee@example.com'] } }
    if (!req.body.model || !(req.body.userId || req.body.userEmail)) throw new CodeError('You must specify the model and the user id/email', status.BAD_REQUEST)
    const { model, userId, userEmail } = req.body
    if (userId) {
      user = await userModel.findOne({ where: { id: userId } })
    } else {
      user = await userModel.findOne({ where: { email: userEmail } })
    }
    if (!user) throw new CodeError('User does not exist', status.BAD_REQUEST)
    console.log(`Creating chat (userId = ${user.id}, model = ${model})`)
    chat = await chatModel.create({ model, userId: user.id })
    url = await container.createInstance(chat.id)
    await chatModel.update({ url }, { where: { id: chat.id } })
    data = { url: url }
    res.json({ status: true, message: 'Chat created' }, data)
  },
}
