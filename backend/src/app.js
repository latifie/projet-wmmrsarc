// Patches
const { inject, errorHandler } = require('express-custom-error')
inject() // Patch express in order to use async / await syntax
// Require Dependencies
const express = require('express')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const helmet = require('helmet')
const logger = require('./util/logger')
const path = require('path')

// Instantiate an Express Application
const app = express()

// Configure Express App Instance
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Configure custom logger middleware
app.use(logger.dev, logger.combined)
app.use(cookieParser())
app.use(cors())
app.use(helmet())

// 1. Serve Static Files (Frontend) - MUST BE BEFORE API ROUTES
// Serve potential frontend build artifacts from multiple locations to be safe
app.use(express.static(path.join(__dirname, '../../frontend/dist')));
app.use(express.static(path.join(__dirname, '../../frontend/public')));
app.use(express.static(path.join(__dirname, './frontend')));

// 2. Swagger Documentation
const swaggerUi = require('swagger-ui-express')
try {
    const swaggerFile = require('../swagger_output.json')
    app.use('/doc', swaggerUi.serve, swaggerUi.setup(swaggerFile))
} catch (e) {
    console.warn('Swagger file not found or invalid, /doc endpoint disabled.', e.message);
}

// 3. API Routes - Mount api.js directly at /api
// This handles /api/requests, /api/auth, etc. via routes/api.js
app.use('/api', require('./routes/api'))

// 4. API 404 Handler: Prevent unrecognized API requests from falling through to React
app.all('/api/*', (req, res) => {
    res.status(404).json({ error: 'API Endpoint Not Found' });
});

// 5. React Catch-All (Handle React Routing)
// Any request NOT starting with /api (and not a static file) returns index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/dist', 'index.html'));
});

// 6. Handle errors
app.use(errorHandler())

module.exports = app
