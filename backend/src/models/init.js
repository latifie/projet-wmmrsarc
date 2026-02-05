const userModel = require('./users.js')
const chatModel = require('./chats.js')
const requestModel = require('./requests.js')
const aiModelModel = require('./aiModels.js')

module.exports = () => {
    // Define associations
    userModel.hasMany(chatModel, { foreignKey: 'userId' })
    chatModel.belongsTo(userModel, { foreignKey: 'userId', allowNull: false })

    userModel.hasMany(requestModel, { foreignKey: 'userId' })
    requestModel.belongsTo(userModel, { foreignKey: 'userId', allowNull: false })

    aiModelModel.hasMany(requestModel, { foreignKey: 'aiModelId' })
    requestModel.belongsTo(aiModelModel, { foreignKey: 'aiModelId', allowNull: false })
}
