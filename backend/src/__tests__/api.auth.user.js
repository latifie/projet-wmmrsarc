const app = require('../app')
const request = require('supertest')

// Use existing users created by updatedb.js
const regularUser = {
  email: 'john.doe@example.com',
  password: 'User@123'
}

const adminUser = {
  email: 'admin@example.com',
  password: 'Admin@123'
}

const newTestUser = {
  name: 'New Test User',
  email: 'newtest@example.com',
  password: 'TestP@ss123'
}

let userAccessToken
let userRefreshToken
let adminAccessToken
let newUserAccessToken

describe('Authentication API Tests', () => {
  // REGISTRATION TESTS
  describe('POST /api/auth/register', () => {
    test('Should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(newTestUser)
      
      expect(response.statusCode).toBe(201)
      expect(response.body.status).toBe(true)
      expect(response.body.message).toBe('User registered successfully')
      expect(response.body.data).toHaveProperty('user')
      expect(response.body.data).toHaveProperty('accessToken')
      expect(response.body.data).toHaveProperty('refreshToken')
      expect(response.body.data.user.email).toBe(newTestUser.email)
      expect(response.body.data.user.name).toBe(newTestUser.name)
      expect(response.body.data.user.isAdmin).toBe(false)
      
      newUserAccessToken = response.body.data.accessToken
    })

    test('Should register an admin user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test Admin',
          email: 'testadmin@example.com',
          password: 'Admin@123',
          isAdmin: true
        })
      
      expect(response.statusCode).toBe(201)
      expect(response.body.data.user.isAdmin).toBe(true)
    })

    test('Should fail with duplicate email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(newTestUser)
      
      expect(response.statusCode).toBe(409)
      expect(response.body.status).toBe(false)
      expect(response.body.message).toBe('Email already registered')
    })

    test('Should fail with weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Weak Pass User',
          email: 'weak@example.com',
          password: 'weak'
        })
      
      expect(response.statusCode).toBe(400)
      expect(response.body.status).toBe(false)
      expect(response.body.message).toContain('Password must be at least 8 characters')
    })

    test('Should fail with missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'incomplete@example.com'
        })
      
      expect(response.statusCode).toBe(400)
      expect(response.body.status).toBe(false)
    })
  })

  // LOGIN TESTS
  describe('POST /api/auth/login', () => {
    test('Should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send(regularUser)
      
      expect(response.statusCode).toBe(200)
      expect(response.body.status).toBe(true)
      expect(response.body.message).toBe('Login successful')
      expect(response.body.data).toHaveProperty('user')
      expect(response.body.data).toHaveProperty('accessToken')
      expect(response.body.data).toHaveProperty('refreshToken')
      
      userAccessToken = response.body.data.accessToken
      userRefreshToken = response.body.data.refreshToken
    })

    test('Should login admin successfully', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send(adminUser)
      
      expect(response.statusCode).toBe(200)
      expect(response.body.data.user.isAdmin).toBe(true)
      
      adminAccessToken = response.body.data.accessToken
    })

    test('Should fail with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: regularUser.password
        })
      
      expect(response.statusCode).toBe(401)
      expect(response.body.status).toBe(false)
      expect(response.body.message).toBe('Invalid email or password')
    })

    test('Should fail with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: regularUser.email,
          password: 'WrongPassword@123'
        })
      
      expect(response.statusCode).toBe(401)
      expect(response.body.status).toBe(false)
      expect(response.body.message).toBe('Invalid email or password')
    })

    test('Should fail with missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: regularUser.email
        })
      
      expect(response.statusCode).toBe(400)
      expect(response.body.status).toBe(false)
    })
  })

  // GET CURRENT USER TESTS
  describe('GET /api/auth/me', () => {
    test('Should get current user info with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${userAccessToken}`)
      
      expect(response.statusCode).toBe(200)
      expect(response.body.status).toBe(true)
      expect(response.body.data.user.email).toBe(regularUser.email)
    })

    test('Should fail without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
      
      expect(response.statusCode).toBe(401)
      expect(response.body.status).toBe(false)
      expect(response.body.message).toBe('No token provided or invalid format. Use: Authorization: Bearer <token>')
    })

    test('Should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
      
      expect(response.statusCode).toBe(401)
      expect(response.body.status).toBe(false)
      expect(response.body.message).toBe('Invalid token')
    })
  })

  // REFRESH TOKEN TESTS
  describe('POST /api/auth/refresh', () => {
    test('Should refresh access token with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: userRefreshToken
        })
      
      expect(response.statusCode).toBe(200)
      expect(response.body.status).toBe(true)
      expect(response.body.message).toBe('Token refreshed successfully')
      expect(response.body.data).toHaveProperty('accessToken')
      
      userAccessToken = response.body.data.accessToken
    })

    test('Should fail with invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'invalid-refresh-token'
        })
      
      expect(response.statusCode).toBe(401)
      expect(response.body.status).toBe(false)
      expect(response.body.message).toBe('Invalid or expired refresh token')
    })

    test('Should fail without refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({})
      
      expect(response.statusCode).toBe(400)
      expect(response.body.status).toBe(false)
    })
  })

  // PROTECTED ROUTES TESTS
  describe('Protected Routes', () => {
    test('Should access protected route with valid token', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${userAccessToken}`)
      
      expect(response.statusCode).toBe(200)
      expect(response.body.status).toBe(true)
    })

    test('Should fail to access protected route without token', async () => {
      const response = await request(app)
        .get('/api/users')
      
      expect(response.statusCode).toBe(401)
      expect(response.body.status).toBe(false)
    })

    test('Admin should be able to delete user', async () => {
      // Use the newly registered user to delete
      const allUsers = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
      
      const userToDelete = allUsers.body.data.find(u => u.email === 'testadmin@example.com')
      
      if (userToDelete) {
        const response = await request(app)
          .delete(`/api/users/${userToDelete.id}`)
          .set('Authorization', `Bearer ${adminAccessToken}`)
        
        expect(response.statusCode).toBe(200)
        expect(response.body.status).toBe(true)
      }
    })

    test('Regular user should not be able to delete user', async () => {
      const response = await request(app)
        .delete('/api/users/1')
        .set('Authorization', `Bearer ${userAccessToken}`)
      
      expect(response.statusCode).toBe(403)
      expect(response.body.status).toBe(false)
      expect(response.body.message).toBe('Admin access required')
    })
  })

  // LOGOUT TESTS
  describe('POST /api/auth/logout', () => {
    test('Should logout successfully with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .send({
          refreshToken: userRefreshToken
        })
      
      expect(response.statusCode).toBe(200)
      expect(response.body.status).toBe(true)
      expect(response.body.message).toBe('Logout successful')
    })

    test('Should fail to refresh with logged out token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: userRefreshToken
        })
      
      expect(response.statusCode).toBe(401)
      expect(response.body.status).toBe(false)
    })

    test('Should fail to logout with already logged out token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .send({
          refreshToken: userRefreshToken
        })
      
      expect(response.statusCode).toBe(404)
      expect(response.body.status).toBe(false)
    })
  })

  // LEGACY ROUTES TESTS
  describe('Legacy Routes', () => {
    test('Legacy login should still work', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          email: 'Sebastien.Viardot@grenoble-inp.fr',
          password: '123456'
        })
      
      expect(response.statusCode).toBe(200)
      expect(response.body).toHaveProperty('token')
    })
  })
})