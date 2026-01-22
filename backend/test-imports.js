// test-imports.js
console.log('Testing imports...')

try {
  const jwt = require('jsonwebtoken')
  console.log('jsonwebtoken imported')
  
  const userModel = require('./src/models/users.js')
  console.log('User model imported')
  
  const refreshTokenModel = require('./src/models/refreshToken.js')
  console.log('RefreshToken model imported')
  
  const authMiddleware = require('./src/middleware/auth.js')
  console.log('Auth middleware imported')
  console.log('   - verifyToken:', typeof authMiddleware.verifyToken)
  console.log('   - isAdmin:', typeof authMiddleware.isAdmin)
  
  console.log('\nAll imports successful!')
} catch (error) {
  console.error('Import error:', error.message)
  process.exit(1)
}