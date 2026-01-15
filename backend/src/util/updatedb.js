const userModel = require('../models/users.js')
const bcrypt = require('bcrypt')
const refreshTokenModel = require('../models/refreshToken.js')
const db = require('../models/database.js')

async function updatedb () {
  try {
    console.log('Synchronizing database...')
    
    await db.sync({ force: true })
    
    console.log('Base de donnees creee.')
    console.log('Creating default users...')
    
    await userModel.create({
      name: 'Admin User',
      email: 'admin@example.com',
      passhash: await bcrypt.hash('Admin@123', 10),
      isAdmin: true
    })
    
    await userModel.create({
      name: 'John Doe',
      email: 'john.doe@example.com',
      passhash: await bcrypt.hash('User@123', 10),
      isAdmin: false
    })
    
    const passhash = await bcrypt.hash('123456', 10)
    console.log(passhash)
    await userModel.create({
      name: 'Sebastien Viardot',
      email: 'Sebastien.Viardot@grenoble-inp.fr',
      passhash,
      isAdmin: false
    })
    
    console.log('Default users created:')
    console.log('   - admin@example.com (password: Admin@123) [ADMIN]')
    console.log('   - john.doe@example.com (password: User@123)')
    console.log('   - Sebastien.Viardot@grenoble-inp.fr (password: 123456)')
    console.log('')
    console.log('WARNING: Change these default passwords in production!')
    
    await db.close()
    console.log('Database initialization complete!')
  } catch (error) {
    console.error('Error updating database:', error)
    process.exit(1)
  }
}

updatedb()