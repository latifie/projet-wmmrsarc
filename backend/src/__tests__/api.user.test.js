const request = require('supertest')
const app = require('../app')
const userModel = require('../models/users')
const { generateAccessToken } = require('../util/get_token') // We might need to mock this or use auth.js logic if get_token doesn't exist. 
// Actually, better to login to get tokens.

describe('User Controller', () => {
  let adminToken
  let userToken
  let user2Token
  let adminId
  let userId
  let user2Id

  beforeAll(async () => {
    // Login Admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'Admin@123'
      })
    adminToken = adminRes.body.data.accessToken
    adminId = adminRes.body.data.user.id

    // Login User
    const userRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'john.doe@example.com',
        password: 'User@123'
      })
    userToken = userRes.body.data.accessToken
    userId = userRes.body.data.user.id

    // Register a second user for testing owner permissions
    const user2Res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'User Two',
        email: 'user2@example.com',
        password: 'User2@123'
      })
    user2Token = user2Res.body.data.accessToken
    user2Id = user2Res.body.data.user.id
  })

  afterAll(async () => {
    // Clean up user2
    if (user2Id) {
      await userModel.destroy({ where: { id: user2Id } })
    }
  })

  describe('GET /api/users', () => {
    it('Should return all users when authenticated', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${userToken}`)

      expect(res.statusCode).toBe(200)
      expect(res.body.status).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
      expect(res.body.data.length).toBeGreaterThan(0)
      expect(res.body.data[0]).toHaveProperty('email')
      expect(res.body.data[0]).not.toHaveProperty('passhash') // Security check
    })

    it('Should fail when not authenticated', async () => {
      const res = await request(app)
        .get('/api/users')

      expect(res.statusCode).toBe(401)
    })
  })

  describe('PUT /api/users/:id', () => {
    it('Should allow user to update their own profile', async () => {
      const res = await request(app)
        .put(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'John Doe Updated'
        })

      expect(res.statusCode).toBe(200)
      expect(res.body.status).toBe(true)

      // Verify update
      const updatedUser = await userModel.findByPk(userId)
      expect(updatedUser.name).toBe('John Doe Updated')
    })

    it('Should allow admin to update any user profile', async () => {
      const res = await request(app)
        .put(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'John Doe Admin Update'
        })

      expect(res.statusCode).toBe(200)

      // Verify update
      const updatedUser = await userModel.findByPk(userId)
      expect(updatedUser.name).toBe('John Doe Admin Update')
    })

    it('Should deny user from updating another profile', async () => {
      const res = await request(app)
        .put(`/api/users/${adminId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Hacked'
        })

      expect(res.statusCode).toBe(403)
    })
  })

  describe('DELETE /api/users/:id', () => {
    it('Should deny non-admin from deleting a user', async () => {
      const res = await request(app)
        .delete(`/api/users/${user2Id}`)
        .set('Authorization', `Bearer ${userToken}`)

      expect(res.statusCode).toBe(403)
    })

    it('Should allow admin to delete a user', async () => {
      const res = await request(app)
        .delete(`/api/users/${user2Id}`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(res.statusCode).toBe(200)
      expect(res.body.status).toBe(true)

      // Verify deletion
      const deletedUser = await userModel.findByPk(user2Id)
      expect(deletedUser).toBeNull()
    })
  })
})
