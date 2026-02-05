const Sequelize = require('sequelize')
const db = require('./database.js')
const users = require('./users.js')
const aiModels = require('./aiModels.js')

const requests = db.define('requests', {
    id: {
        primaryKey: true,
        type: Sequelize.INTEGER,
        autoIncrement: true
    },
    status: {
        type: Sequelize.STRING(20),
        defaultValue: 'pending', // pending, approved, rejected
        allowNull: false
    },
    rejectionReason: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
    }
}, { timestamps: true })

requests.belongsTo(users, { foreignKey: 'userId', as: 'user' })
requests.belongsTo(aiModels, { foreignKey: 'aiModelId', as: 'aiModel' })

module.exports = requests
