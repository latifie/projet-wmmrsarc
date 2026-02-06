const Sequelize = require('sequelize');
const db = require('./database.js');

const aiModels = db.define('ai_models', {
  id: {
    primaryKey: true,
    type: Sequelize.INTEGER,
    autoIncrement: true
  },
  name: {
    type: Sequelize.STRING(128),
    allowNull: false,
    unique: true
  },
  description: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  version: {
    type: Sequelize.STRING(64),
    allowNull: true
  },
  dockerImage: {
    type: Sequelize.STRING(255),
    defaultValue: 'ollama/ollama:latest',
    allowNull: false
  },
  isActive: {
    type: Sequelize.BOOLEAN,
    defaultValue: true,
    allowNull: false
  }
}, { 
  timestamps: true,
  updatedAt: 'updatedAt',
  createdAt: 'createdAt'
});

module.exports = aiModels;