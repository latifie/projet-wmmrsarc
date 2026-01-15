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
  dockerHost: {
    type: Sequelize.STRING(128),
    default: "localhost"
  },
  url: {
    type: Sequelize.STRING(128)
  }
}, { timestamps: false })
module.exports = chats
