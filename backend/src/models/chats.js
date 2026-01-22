const Sequelize = require('sequelize')
const db = require('./database.js')
const chats = db.define('chats', {
  id: {
    primaryKey: true,
    type: Sequelize.INTEGER,
    autoIncrement: true
  },
  model: {
    type: Sequelize.STRING(128),
    allowNull: false
  },
  history: {
    type: Sequelize.JSON,
    defaultValue: [],
    allowNull: false
  },
  dockerHost: {
    type: Sequelize.STRING(128),
    defaultValue: "localhost",
    allowNull: false
  },
  url: {
    type: Sequelize.STRING(128)
  },
  userId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, { timestamps: false })
module.exports = chats
