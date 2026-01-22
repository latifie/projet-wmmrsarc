const Sequelize = require('sequelize');
const db = require('./database.js');

const instances = db.define('instances', {
  id: {
    primaryKey: true,
    type: Sequelize.INTEGER,
    autoIncrement: true
  },
  userId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  aiModelId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: 'ai_models',
      key: 'id'
    }
  },
  serviceName: {
    type: Sequelize.STRING(255),
    allowNull: false,
    unique: true
  },
  status: {
    type: Sequelize.ENUM('running', 'stopped', 'error'),
    defaultValue: 'stopped',
    allowNull: false
  },
  port: {
    type: Sequelize.INTEGER,
    allowNull: true
  },
  containerId: {
    type: Sequelize.STRING(255),
    allowNull: true
  }
}, { 
  timestamps: true,
  updatedAt: 'updatedAt',
  createdAt: 'createdAt'
});

module.exports = instances;