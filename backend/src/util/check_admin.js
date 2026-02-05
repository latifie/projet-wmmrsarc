const userModel = require('../models/users.js')

async function checkUser() {
    try {
        const user = await userModel.findOne({ where: { name: 'xephi32' } })
        if (user) {
            console.log(`User: ${user.name}, Email: ${user.email}, IsAdmin: ${user.isAdmin} (Type: ${typeof user.isAdmin})`)
        } else {
            console.log('User xephi32 not found')
        }
    } catch (error) {
        console.error('Error:', error)
    }
}

checkUser()
