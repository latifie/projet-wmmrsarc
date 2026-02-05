const status = require('http-status')
const aiModelModel = require('../models/aiModels.js')
const CodeError = require('../util/CodeError.js')

module.exports = {
    async getAll(req, res) {
        // #swagger.tags = ['AI Models']
        // #swagger.summary = 'Get all available AI models'
        const data = await aiModelModel.findAll()
        res.json({ status: true, message: 'Returning AI models', data })
    },

    async create(req, res) {
        // #swagger.tags = ['AI Models']
        // #swagger.summary = 'Create a new AI model'
        if (!req.body.name) throw new CodeError('Name is required', status.BAD_REQUEST)
        const { name, description, dockerImage } = req.body
        const data = await aiModelModel.create({ name, description, dockerImage })
        res.json({ status: true, message: 'AI model created', data })
    }
}
