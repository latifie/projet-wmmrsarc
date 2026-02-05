const Sequelize = require('sequelize')
const db = require('./database.js')
const users = db.define('users', {
  id: {
    primaryKey: true,
    type: Sequelize.INTEGER,
    autoIncrement: true
  },
  name: {
    type: Sequelize.STRING(128),
    validate: {
      is: /^[\w\s\-\'\u00C0-\u017F]{1,128}$/i
    }
  },
  email: {
    type: Sequelize.STRING(128),
    unique: true,
    validate: {
      isEmail: true
    }
  },
  passhash: {
    type: Sequelize.STRING(60),
    validate: {
      is: /^[0-9a-z\\/$.]{60}$/i
    }
  },
  isAdmin: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
    allowNull: false
  }
}, { timestamps: false })
module.exports = users
