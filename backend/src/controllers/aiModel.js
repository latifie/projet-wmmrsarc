const status = require('http-status')
const aiModelModel = require('../models/aiModels.js')
const CodeError = require('../util/CodeError.js')
const axios = require('axios')
const cheerio = require('cheerio')

module.exports = {
    async getAll(req, res) {
        // #swagger.tags = ['AI Models']
        // #swagger.summary = 'Get all available AI models'
        const data = await aiModelModel.findAll()
        res.json({ status: true, message: 'Returning AI models', data })
    },

    async search(req, res) {
        // #swagger.tags = ['AI Models']
        // #swagger.summary = 'Search models in Ollama Library'
        const { q } = req.query
        if (!q) throw new CodeError('Query parameter "q" is required', status.BAD_REQUEST)

        try {
            const response = await axios.get(`https://ollama.com/search?q=${encodeURIComponent(q)}`)
            const $ = cheerio.load(response.data)
            const models = []

            // Scrape results from Ollama search page
            // Logic based on current Ollama search page structure (subject to change by Ollama)
            // As of 2025, usually list items with links to /library/modelname

            // Selector might need adjustment if Ollama changes layout. 
            // Looking for generic list items.
            $('li a[href^="/library/"]').each((i, el) => {
                const name = $(el).find('h2').text().trim()
                const description = $(el).find('p').text().trim()
                // Image/tags might be available but name is key
                if (name) {
                    models.push({ name, description })
                }
            })

            res.json({ status: true, message: 'Search results', data: models })
        } catch (error) {
            console.error('Ollama search error:', error.message)
            // If scrape fails, return empty list or error
            res.json({ status: true, message: 'Search failed or no results', data: [] })
        }
    },

    async create(req, res) {
        // #swagger.tags = ['AI Models']
        // #swagger.summary = 'Create a new AI model'
        if (!req.body.name) throw new CodeError('Name is required', status.BAD_REQUEST)
        const { name } = req.body

        // 1. Check if already exists in DB
        const existing = await aiModelModel.findOne({ where: { name } })
        if (existing) throw new CodeError('Model already exists in database', status.CONFLICT)

        // 2. Validate against Ollama Library
        try {
            await axios.get(`https://ollama.com/library/${name}`)
        } catch (error) {
            if (error.response && error.response.status === 404) {
                throw new CodeError(`Model "${name}" not found in Ollama Library`, status.BAD_REQUEST)
            }
            // Other errors (network), we might allow or block. Let's block to be safe.
            throw new CodeError('Could not validate model with Ollama Library', status.SERVICE_UNAVAILABLE)
        }

        // 3. Create
        // Default description if not provided, or fetch from library page if we want to be fancy.
        // For now use provided or generic.
        const description = req.body.description || `Ollama model: ${name}`
        const dockerImage = name // For Ollama, the "dockerImage" field effectively holds the model tag name

        const data = await aiModelModel.create({ name, description, dockerImage })
        res.json({ status: true, message: 'AI model created', data })
    },

    async delete(req, res) {
        // #swagger.tags = ['AI Models']
        // #swagger.summary = 'Delete an AI model'
        const { id } = req.params
        const model = await aiModelModel.findByPk(id)
        if (!model) throw new CodeError('Model not found', status.NOT_FOUND)

        await model.destroy()
        res.json({ status: true, message: 'Model deleted' })
    }
}
