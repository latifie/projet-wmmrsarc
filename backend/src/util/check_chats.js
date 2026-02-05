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
        console.log(`Found ${list.length} chats.`)
        list.forEach(c => {
            console.log(`ID: ${c.id}, User: ${c.user?.email}, Model: ${c.model}, URL: '${c.url}'`)
        })
    } catch (error) {
        console.error('Error:', error)
    }
}

checkChats()
