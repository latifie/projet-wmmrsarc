const userModel = require('../models/users.js')

async function checkUser() {
    try {
        const user = await userModel.findOne({ where: { name: 'xephi32' } })
        if (user) {

        } else {

        }
    } catch (error) {
        console.error('Error:', error)
    }
}

checkUser()
