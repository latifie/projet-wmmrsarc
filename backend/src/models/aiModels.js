const Sequelize = require('sequelize')
const db = require('./database.js')

const aiModels = db.define('ai_models', {
    id: {
        primaryKey: true,
        type: Sequelize.INTEGER,
        autoIncrement: true
    },
    name: {
        type: Sequelize.STRING(128),
        allowNull: false
    },
    description: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    dockerImage: {
        type: Sequelize.STRING(128),
        allowNull: false,
        defaultValue: 'ollama/ollama'
    }
}, { timestamps: false })

module.exports = aiModels
