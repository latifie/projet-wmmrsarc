const Sequelize = require('sequelize');
const db = require('./database.js');

const requests = db.define('requests', {
  id: {
    primaryKey: true,
    type: Sequelize.INTEGER,
    autoIncrement: true
  },
  userId: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  aiModelId: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  status: {
    type: Sequelize.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending',
    allowNull: false
  },
  instanceId: {
    type: Sequelize.INTEGER,
    allowNull: true
  },
  rejectionReason: {
    type: Sequelize.TEXT,
    allowNull: true
  }
}, { 
  timestamps: true,
  updatedAt: 'updatedAt',
  createdAt: 'createdAt'
});

module.exports = requests;