const chatModel = require('../models/chats.js')
const userModel = require('../models/users.js')
const bcrypt = require('bcrypt')
const refreshTokenModel = require('../models/refreshToken.js')
const aiModelModel = require('../models/aiModels.js')
const requestModel = require('../models/requests.js')
const db = require('../models/database.js')

async function updatedb() {
  try {
    userModel.hasMany(chatModel, { foreignKey: 'userId' })
    chatModel.belongsTo(userModel, { foreignKey: 'userId', allowNull: false })

    userModel.hasMany(requestModel, { foreignKey: 'userId' })
    requestModel.belongsTo(userModel, { foreignKey: 'userId', allowNull: false })

    aiModelModel.hasMany(requestModel, { foreignKey: 'aiModelId' })
    requestModel.belongsTo(aiModelModel, { foreignKey: 'aiModelId', allowNull: false })



    await db.sync({ force: true })




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

    await userModel.create({
      name: 'Sebastien Viardot',
      email: 'Sebastien.Viardot@grenoble-inp.fr',
      passhash,
      isAdmin: false
    })

    await userModel.create({
      name: 'xephi32',
      email: 'xephi32@example.com',
      passhash: await bcrypt.hash('Admin@123', 10),
      isAdmin: true
    })

    await userModel.create({
      name: 'Test User',
      email: 'test@example.com',
      passhash: await bcrypt.hash('User@123', 10),
      isAdmin: false
    })


    // Check if models exist first to avoid duplicates if running multiple times without force:true
    const count = await aiModelModel.count()
    if (count === 0) {
      await aiModelModel.bulkCreate([
        { name: 'Llama 2', description: 'Meta open source LLM', dockerImage: 'llama2' },
        { name: 'Mistral 7B', description: 'Powerful 7B model by Mistral AI', dockerImage: 'mistral' },
        { name: 'CodeLlama', description: 'Code specialized model', dockerImage: 'codellama' },
        { name: 'Phi-2', description: 'Small but mighty 2.7B model', dockerImage: 'phi' },
        { name: 'Gemma 2B', description: 'Google lightweight model', dockerImage: 'gemma:2b' },
        { name: 'TinyLlama', description: 'Ultra-fast 1.1B model', dockerImage: 'tinyllama' },
        { name: 'Qwen 2.5', description: 'Alibaba multilingual model', dockerImage: 'qwen2.5' },
        { name: 'DeepSeek Coder', description: 'Specialized coding assistant', dockerImage: 'deepseek-coder' },
        { name: 'Llama 3.2', description: 'Latest Meta model', dockerImage: 'llama3.2' }
      ])
    }








    await db.close()

  } catch (error) {
    console.error('Error updating database:', error)
    process.exit(1)
  }
}

updatedb()