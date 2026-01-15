const swaggerAutogen = require('swagger-autogen')()

const outputFile = 'swagger_output.json'
const endpointsFiles = ['src/routes/router.js']

swaggerAutogen(outputFile, endpointsFiles, {
  securityDefinitions: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'JWT token de l\'utilisateur (format: Bearer <token>)'
    }
  }
})
