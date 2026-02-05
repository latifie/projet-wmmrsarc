const status = require('http-status')
const requestModel = require('../models/requests.js')
const aiModelModel = require('../models/aiModels.js')
const userModel = require('../models/users.js')
const chatModel = require('../models/chats.js')
const container = require('../util/chatManager.js')
const CodeError = require('../util/CodeError.js')
const has = require('has-keys')

module.exports = {
    async create(req, res) {
        // #swagger.tags = ['Requests']
        // #swagger.summary = 'Create a new deployment request'
        if (!has(req.body, 'aiModelId')) throw new CodeError('aiModelId is required', status.BAD_REQUEST)

        const { aiModelId } = req.body
        const userId = req.user.id

        // Verify model exists
        const model = await aiModelModel.findByPk(aiModelId)
        if (!model) throw new CodeError('AI Model not found', status.NOT_FOUND)

        const data = await requestModel.create({ userId, aiModelId, status: 'pending' })
        res.status(status.CREATED).json({ status: true, message: 'Request created', data })
    },

    async getMyRequests(req, res) {
        // #swagger.tags = ['Requests']
        // #swagger.summary = 'Get current user requests'
        const data = await requestModel.findAll({
            where: { userId: req.user.id },
            include: [
                { model: aiModelModel, as: 'aiModel' }
            ],
            order: [['createdAt', 'DESC']]
        })

        // Add instanceId if approved and chat exists
        // Ideally this should be a JOIN but for simplicity we iterate or add a relation Request -> Chat
        // For now let's just return key info
        // If we need instanceId, we might need to look up the chat created for this user/model

        // Simplification: In a real app we'd link Request <-> Chat. 
        // Here we can try to find if a chat exists for this model/user? 
        // Or just updating Request schema to have chatId might be cleaner but let's stick to simple flow.

        const enrichedData = await Promise.all(data.map(async (req) => {
            const plain = req.get({ plain: true })
            if (req.status === 'approved') {
                // Try to find the chat instance
                // This is a bit weak without direct foreign key, but works if 1 request = 1 chat
                const chat = await chatModel.findOne({
                    where: {
                        userId: req.userId,
                        model: req.aiModel.name // Assuming chat logic uses model name
                    }
                })
                if (chat) plain.instanceId = chat.id
            }
            return plain
        }))

        res.json({ status: true, message: 'Returning requests', data: enrichedData })
    },

    async getAllRequests(req, res) {
        // #swagger.tags = ['Requests']
        // #swagger.summary = 'Get all requests (Admin)'
        const data = await requestModel.findAll({
            include: [
                { model: aiModelModel, as: 'aiModel' },
                { model: userModel, as: 'user', attributes: ['id', 'name', 'email'] }
            ],
            order: [['createdAt', 'DESC']]
        })
        res.json({ status: true, message: 'Returning all requests', data })
    },

    async approve(req, res) {
        // #swagger.tags = ['Requests']
        // #swagger.summary = 'Approve a request'
        const { id } = req.params
        const request = await requestModel.findByPk(id, { include: ['aiModel', 'user'] })
        if (!request) throw new CodeError('Request not found', status.NOT_FOUND)
        if (request.status !== 'pending') throw new CodeError('Request is not pending', status.BAD_REQUEST)

        // Deploy Logic
        try {
            console.log(`Approving request ${id}. Deploying ${request.aiModel.name}...`)

            // Create Chat entry
            const chat = await chatModel.create({
                model: request.aiModel.name,
                userId: request.userId
            })

            // Deploy Container
            const url = await container.createInstance(chat.id)
            await chatModel.update({ url }, { where: { id: chat.id } })

            // Pull the AI model (async, don't wait for completion to avoid timeout)
            console.log(`Initiating model pull for ${request.aiModel.dockerImage}...`)
            container.pullModel(url, request.aiModel.dockerImage, chat.id).catch(err => {
                console.error(`Background model pull failed for chat ${chat.id}:`, err.message)
            })

            // Update Request
            await request.update({ status: 'approved' })

            res.json({ status: true, message: 'Request approved and deployed', data: { chatId: chat.id, url } })
        } catch (err) {
            console.error(err)
            throw new CodeError('Deployment failed', status.INTERNAL_SERVER_ERROR)
        }
    },

    async reject(req, res) {
        // #swagger.tags = ['Requests']
        // #swagger.summary = 'Reject a request'
        const { id } = req.params
        const { reason } = req.body

        const request = await requestModel.findByPk(id)
        if (!request) throw new CodeError('Request not found', status.NOT_FOUND)
        if (request.status !== 'pending') throw new CodeError('Request is not pending', status.BAD_REQUEST)

        await request.update({ status: 'rejected', rejectionReason: reason })
        res.json({ status: true, message: 'Request rejected' })
    }
}
