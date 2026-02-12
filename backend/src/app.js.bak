// Patches
const { inject, errorHandler } = require('express-custom-error')
inject() // Patch express in order to use async / await syntax
// Require Dependencies
const express = require('express')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const helmet = require('helmet')
const logger = require('./util/logger')
const requestRoutes = require('./routes/requests');


// Instantiate an Express Application
const app = express()

// Configure Express App Instance
// Configure Express App Instance
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Configure custom logger middleware
app.use(logger.dev, logger.combined)
app.use(cookieParser())
app.use(cors())
app.use(helmet())

// Swagger Documentation
const swaggerUi = require('swagger-ui-express')
const swaggerFile = require('../swagger_output.json')
app.use('/doc', swaggerUi.serve, swaggerUi.setup(swaggerFile))

// Assign Routes
app.use('/', require('./routes/router.js'))
// Handle errors
app.use(errorHandler())

if (process.env.PROXYREACT) {
  // if dev react server exists, serve all the others routes to
  const { createProxyMiddleware } = require('http-proxy-middleware')
  const reactProxy = createProxyMiddleware({
    target: 'http://localhost:5173/',
    changeOrigin: true,
    ws: true
  })
  app.use('/', reactProxy)
}

const path = require('path');

app.use(express.static(path.join(__dirname, '../../frontend/dist')));
app.use(express.static(path.join(__dirname, '../../frontend/public')));
app.use(express.static(path.join(__dirname, './frontend')));

app.use('/api/requests', requestRoutes);

// API 404 Handler: Prevent unrecognized API requests from falling through to React
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: 'API Endpoint Not Found' });
});

// Handle React Routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist', 'index.html'));
});

module.exports = app
