const chatModel = require('../models/chats.js')
const userModel = require('../models/users.js')

// Associations
userModel.hasMany(chatModel, { foreignKey: 'userId' })
chatModel.belongsTo(userModel, { foreignKey: 'userId', allowNull: false })

async function checkChats() {
    try {
        const list = await chatModel.findAll({
            include: [userModel]
        })

        list.forEach(c => {

        })
    } catch (error) {
        console.error('Error:', error)
    }
}

checkChats()
