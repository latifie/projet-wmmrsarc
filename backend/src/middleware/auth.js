const status = require('http-status')
const jwt = require('jsonwebtoken')
const CodeError = require('../util/CodeError.js')
const userModel = require('../models/users.js')
const refreshTokenModel = require('../models/refreshToken.js')

require('mandatoryenv').load(['ACCESS_TOKEN_SECRET', 'REFRESH_TOKEN_SECRET'])
const { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET } = process.env

/**
 * Middleware pour vérifier le token d'accès JWT
 */
const verifyToken = () => {
  return async (req, res, next) => {
    try {
      // Récupérer le token du header Authorization
      const authHeader = req.headers.authorization
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new CodeError('No token provided or invalid format', status.UNAUTHORIZED)
      }

      const token = authHeader.substring(7) // Enlever "Bearer "

      // Vérifier et décoder le token
      const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET)
      
      // Récupérer l'utilisateur
      const user = await userModel.findOne({ 
        where: { email: decoded.email },
        attributes: ['id', 'name', 'email', 'isAdmin']
      })

      if (!user) {
        throw new CodeError('User not found', status.UNAUTHORIZED)
      }

      // Attacher l'utilisateur à la requête
      req.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin
      }

      next()
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(status.UNAUTHORIZED).json({ 
          status: false, 
          message: 'Invalid token' 
        })
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(status.UNAUTHORIZED).json({ 
          status: false, 
          message: 'Token expired' 
        })
      }
      next(error)
    }
  }
}

/**
 * Middleware pour vérifier que l'utilisateur est admin
 */
const isAdmin = () => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(status.UNAUTHORIZED).json({ 
        status: false, 
        message: 'Authentication required' 
      })
    }

    if (!req.user.isAdmin) {
      return res.status(status.FORBIDDEN).json({ 
        status: false, 
        message: 'Admin access required' 
      })
    }

    next()
  }
}

/**
 * Middleware pour vérifier ownership ou admin
 */
const isOwnerOrAdmin = (userIdParam = 'id') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(status.UNAUTHORIZED).json({ 
        status: false, 
        message: 'Authentication required' 
      })
    }

    const requestedUserId = parseInt(req.params[userIdParam])
    
    if (req.user.isAdmin || req.user.id === requestedUserId) {
      return next()
    }

    return res.status(status.FORBIDDEN).json({ 
      status: false, 
      message: 'Access denied' 
    })
  }
}

/**
 * Fonction pour vérifier le refresh token
 */
const verifyRefreshToken = async (token) => {
  try {
    const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET)
    
    const storedToken = await refreshTokenModel.findOne({ 
      where: { token } 
    })

    if (!storedToken) {
      throw new Error('Refresh token not found')
    }

    if (new Date(storedToken.expiresAt) < new Date()) {
      await refreshTokenModel.destroy({ where: { token } })
      throw new Error('Refresh token expired')
    }

    return decoded
  } catch (error) {
    throw new Error('Invalid refresh token')
  }
}

module.exports = {
  verifyToken,
  verifyRefreshToken,
  isAdmin,
  isOwnerOrAdmin
}