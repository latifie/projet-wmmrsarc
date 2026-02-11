// Load Enviroment Variables to process.env (if not present take variables defined in .env file)
require('mandatoryenv').load(['DB'])
const { DB } = process.env

const Sequelize = require('sequelize')
let db;
if (DB.includes('sqlite')) {
    db = new Sequelize({
        dialect: 'sqlite',
        storage: DB,
        logging: false
    })
} else {
    db = new Sequelize(DB, {
        logging: false
    })
}
module.exports = db
