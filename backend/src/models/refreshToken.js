const Sequelize = require('sequelize')
const db = require('./database.js')

const refreshTokens = db.define('refresh_tokens', {
  id: {
    primaryKey: true,
    type: Sequelize.INTEGER,
    autoIncrement: true
  },
  token: {
    type: Sequelize.STRING(500),
    allowNull: false,
    unique: true
  },
  userId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  expiresAt: {
    type: Sequelize.DATE,
    allowNull: false
  },
  createdAt: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW
  }
}, { 
  timestamps: false
})

module.exports = refreshTokens