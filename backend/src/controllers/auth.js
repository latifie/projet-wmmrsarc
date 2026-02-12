const status = require('http-status')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const has = require('has-keys')
const CodeError = require('../util/CodeError.js')
const userModel = require('../models/users.js')
const refreshTokenModel = require('../models/refreshToken.js')
const { verifyRefreshToken } = require('../middleware/auth.js')

require('mandatoryenv').load([
  'ACCESS_TOKEN_SECRET',
  'REFRESH_TOKEN_SECRET',
  'ACCESS_TOKEN_EXPIRY',
  'REFRESH_TOKEN_EXPIRY'
])

const {
  ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET,
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY
} = process.env

// Fonction de validation du mot de passe
// Fonction de validation du mot de passe
function validPassword(password) {
  return password.length >= 8
}

// Générer un access token
function generateAccessToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      isAdmin: user.isAdmin
    },
    ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  )
}

// Générer un refresh token
function generateRefreshToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      random: Math.random().toString(36).substring(7)
    },
    REFRESH_TOKEN_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  )
}

// Calculer la date d'expiration du refresh token
function getRefreshTokenExpiry() {
  const expiry = REFRESH_TOKEN_EXPIRY
  const days = parseInt(expiry.replace('d', ''))
  const expiryDate = new Date()
  expiryDate.setDate(expiryDate.getDate() + days)
  return expiryDate
}

module.exports = {
  /**
   * Register - Inscription d'un nouvel utilisateur
   * POST /api/auth/register
   */
  async register(req, res) {
    // #swagger.tags = ['Authentication']
    // #swagger.summary = 'Register a new user'

    if (!has(req.body, ['name', 'email', 'password'])) {
      throw new CodeError('Name, email and password are required', status.BAD_REQUEST)
    }

    const { name, email, password, isAdmin = false } = req.body

    // Validation du mot de passe
    if (!validPassword(password)) {
      throw new CodeError(
        'Password must be at least 8 characters',
        status.BAD_REQUEST
      )
    }

    // Vérifier si l'email existe déjà
    const existingUser = await userModel.findOne({ where: { email } })
    if (existingUser) {
      throw new CodeError('Email already registered', status.CONFLICT)
    }

    // Hash du mot de passe avec 10 rounds (au lieu de 2)
    const passhash = await bcrypt.hash(password, 10)

    // Créer l'utilisateur
    const user = await userModel.create({
      name,
      email,
      passhash,
      isAdmin: isAdmin || false
    })

    // Générer les tokens
    const accessToken = generateAccessToken(user)
    const refreshToken = generateRefreshToken(user)

    // Stocker le refresh token en base
    await refreshTokenModel.create({
      token: refreshToken,
      userId: user.id,
      expiresAt: getRefreshTokenExpiry()
    })

    res.status(status.CREATED).json({
      status: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin
        },
        accessToken,
        refreshToken
      }
    })
  },

  /**
   * Login - Connexion d'un utilisateur
   * POST /api/auth/login
   */
  async login(req, res) {
    // #swagger.tags = ['Authentication']
    // #swagger.summary = 'Login with email and password'

    if (!has(req.body, ['email', 'password'])) {
      throw new CodeError('Email and password are required', status.BAD_REQUEST)
    }

    const { email, password } = req.body

    // Chercher l'utilisateur
    const user = await userModel.findOne({ where: { email } })

    if (!user) {
      return res.status(status.UNAUTHORIZED).json({
        status: false,
        message: 'Invalid email or password'
      })
    }

    // Vérifier le mot de passe
    const validPassword = await bcrypt.compare(password, user.passhash)

    if (!validPassword) {
      return res.status(status.UNAUTHORIZED).json({
        status: false,
        message: 'Invalid email or password'
      })
    }

    // Générer les tokens
    const accessToken = generateAccessToken(user)
    const refreshToken = generateRefreshToken(user)

    // Stocker le refresh token
    await refreshTokenModel.create({
      token: refreshToken,
      userId: user.id,
      expiresAt: getRefreshTokenExpiry()
    })

    res.json({
      status: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin
        },
        accessToken,
        refreshToken
      }
    })
  },

  /**
   * Refresh - Rafraîchir l'access token
   * POST /api/auth/refresh
   */
  async refresh(req, res) {
    // #swagger.tags = ['Authentication']
    // #swagger.summary = 'Refresh access token'

    if (!has(req.body, 'refreshToken')) {
      throw new CodeError('Refresh token is required', status.BAD_REQUEST)
    }

    const { refreshToken } = req.body

    try {
      // Vérifier le refresh token
      const decoded = await verifyRefreshToken(refreshToken)

      // Récupérer l'utilisateur
      const user = await userModel.findOne({
        where: { email: decoded.email }
      })

      if (!user) {
        throw new CodeError('User not found', status.UNAUTHORIZED)
      }

      // Générer un nouveau access token
      const newAccessToken = generateAccessToken(user)

      res.json({
        status: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: newAccessToken
        }
      })
    } catch (error) {
      return res.status(status.UNAUTHORIZED).json({
        status: false,
        message: 'Invalid or expired refresh token'
      })
    }
  },

  /**
   * Logout - Déconnexion
   * POST /api/auth/logout
   */
  async logout(req, res) {
    // #swagger.tags = ['Authentication']
    // #swagger.summary = 'Logout and invalidate refresh token'

    if (!has(req.body, 'refreshToken')) {
      throw new CodeError('Refresh token is required', status.BAD_REQUEST)
    }

    const { refreshToken } = req.body

    try {
      // Supprimer le refresh token de la base
      const deleted = await refreshTokenModel.destroy({
        where: { token: refreshToken }
      })

      if (deleted === 0) {
        return res.status(status.NOT_FOUND).json({
          status: false,
          message: 'Refresh token not found'
        })
      }

      res.json({
        status: true,
        message: 'Logout successful'
      })
    } catch (error) {
      throw new CodeError('Logout failed', status.INTERNAL_SERVER_ERROR)
    }
  },

  /**
   * Me - Informations de l'utilisateur connecté
   * GET /api/auth/me
   */
  async me(req, res) {
    // #swagger.tags = ['Authentication']
    // #swagger.summary = 'Get current user information'

    // req.user est déjà attaché par le middleware verifyToken
    res.json({
      status: true,
      message: 'User information retrieved',
      data: {
        user: req.user
      }
    })
  }
}