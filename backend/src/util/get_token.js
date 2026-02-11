const jwt = require('jsonwebtoken')
require('mandatoryenv').load(['ACCESS_TOKEN_SECRET'])
const { ACCESS_TOKEN_SECRET } = process.env

const token = jwt.sign(
    { email: 'xephi32@example.com' },
    ACCESS_TOKEN_SECRET,
    { expiresIn: '1h' }
)


