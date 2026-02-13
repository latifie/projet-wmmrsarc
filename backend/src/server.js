/* Pour info, ce point de départ est une adaptation de celui qui vous obtiendriez
en faisant npm create backend
issu du dépôt
<https://github.com/ChoqueCastroLD/create-backend/tree/master/src/template/js>
*/

// Load Enviroment Variables to process.env (if not present take variables defined in .env file)
require('mandatoryenv').load(['PORT'])
const { PORT } = process.env

// Instantiate an Express Application
// Initialize Database Associations
require('./models/init')()

// Instantiate an Express Application
const app = require('./app')

// Open Server on selected Port
const httpServer = app.listen(
  PORT,
  '0.0.0.0',
  () => console.info('Server listening on port ', PORT)
)

// Initialize Socket.IO
const socketUtil = require('./util/socket')
socketUtil.init(httpServer)

// Global Error Handlers to prevent crash and log reason
process.on('uncaughtException', (err) => {
  const fs = require('fs')
  const log = `[${new Date().toISOString()}] UNCAUGHT EXCEPTION: ${err.name}: ${err.message}\n${err.stack}\n`
  fs.appendFileSync('crash.log', log)
  console.error(log)
  process.exit(1)
})

process.on('unhandledRejection', (err) => {
  const fs = require('fs')
  const log = `[${new Date().toISOString()}] UNHANDLED REJECTION: ${err.name}: ${err.message}\n${err.stack}\n`
  fs.appendFileSync('crash.log', log)
  console.error(log)
  process.exit(1)
})

process.on('exit', (code) => {
  const fs = require('fs')
  fs.appendFileSync('crash.log', `[${new Date().toISOString()}] Process exited with code: ${code}\n`)
})
