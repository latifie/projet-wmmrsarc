const requestModel = require('../models/requests.js')
const userModel = require('../models/users.js')
const aiModelModel = require('../models/aiModels.js')

// Associations are defined in the models themselves


async function checkRequests() {
    try {
        const list = await requestModel.findAll({
            include: [
                { model: aiModelModel, as: 'aiModel' },
                { model: userModel, as: 'user', attributes: ['id', 'name', 'email'] }
            ]
        })
        console.log(`Found ${list.length} requests.`)
        list.forEach(r => {
            console.log(`ID: ${r.id}, User: ${r.user?.name}, Model: ${r.aiModel?.name}, Status: ${r.status}`)
        })
    } catch (error) {
        console.error('Error:', error)
    }
}

checkRequests()
