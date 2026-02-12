const app = require('../app')
const request = require('supertest')
const db = require('../models/database')

beforeAll(async () => {
    // Clean up test user if exists
    const userModel = require('../models/users')
    await userModel.destroy({ where: { email: 'testauth@example.com' } })
})

// Helper to clean up users
async function cleanupUser(email) {
    const userModel = require('../models/users')
    await userModel.destroy({ where: { email } })
}

afterAll(async () => {
    await db.close()
})

describe('Auth Controller', () => {
    let accessToken
    let refreshToken
    const user = {
        name: 'Test User',
        email: 'testauth@example.com',
        password: 'Password@123'
    }

    test('POST /api/auth/register - Should register a new user', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send(user)

        expect(res.statusCode).toBe(201)
        expect(res.body.status).toBe(true)
        expect(res.body.data.user.email).toBe(user.email)
        expect(res.body.data).toHaveProperty('accessToken')
        expect(res.body.data).toHaveProperty('refreshToken')

        // Save tokens for next tests
        accessToken = res.body.data.accessToken
        refreshToken = res.body.data.refreshToken
    })

    test('POST /api/auth/register - Should fail if email already exists', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send(user)

        expect(res.statusCode).toBe(409)
        expect(res.body.status).toBe(false)
    })

    test('POST /api/auth/register - Should register with simple password (8 chars)', async () => {
        const simpleUser = {
            name: 'Simple User',
            email: 'simple@example.com',
            password: 'password'
        }

        // Clean up before test
        const userModel = require('../models/users')
        await userModel.destroy({ where: { email: simpleUser.email } })

        const res = await request(app)
            .post('/api/auth/register')
            .send(simpleUser)

        expect(res.statusCode).toBe(201)
        expect(res.body.status).toBe(true)
    })

    test('POST /api/auth/register - Should register with only numbers (8 chars)', async () => {
        const numericUser = {
            name: 'Numeric User',
            email: 'numeric@example.com',
            password: '12345678'
        }

        const userModel = require('../models/users')
        await userModel.destroy({ where: { email: numericUser.email } })

        const res = await request(app)
            .post('/api/auth/register')
            .send(numericUser)

        expect(res.statusCode).toBe(201)
        expect(res.body.status).toBe(true)
    })

    test('POST /api/auth/register - Should register with only uppercase (8 chars)', async () => {
        const uppercaseUser = {
            name: 'Uppercase User',
            email: 'uppercase@example.com',
            password: 'PASSWORD'
        }

        const userModel = require('../models/users')
        await userModel.destroy({ where: { email: uppercaseUser.email } })

        const res = await request(app)
            .post('/api/auth/register')
            .send(uppercaseUser)

        expect(res.statusCode).toBe(201)
        expect(res.body.status).toBe(true)
    })

    test('POST /api/auth/register - Should register with only special chars (8 chars)', async () => {
        const specialUser = {
            name: 'Special User',
            email: 'special@example.com',
            password: '!!!!!!!!'
        }

        const userModel = require('../models/users')
        await userModel.destroy({ where: { email: specialUser.email } })

        const res = await request(app)
            .post('/api/auth/register')
            .send(specialUser)

        expect(res.statusCode).toBe(201)
        expect(res.body.status).toBe(true)
    })

    test('POST /api/auth/register - Should fail with short password (7 chars)', async () => {
        const shortUser = {
            name: 'Short User',
            email: 'short@example.com',
            password: 'passwor'
        }

        const res = await request(app)
            .post('/api/auth/register')
            .send(shortUser)

        expect(res.statusCode).toBe(400)
        expect(res.body.status).toBe(false)
        // Check for specific error message or valid bad request status
        expect(res.statusCode).toBe(400)
    })

    test('POST /api/auth/login - Should login successfully', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: user.email, password: user.password })

        if (res.statusCode !== 200) {

        }
        expect(res.statusCode).toBe(200)
        expect(res.body.status).toBe(true)
        expect(res.body.data).toHaveProperty('accessToken')
        expect(res.body.data).toHaveProperty('refreshToken')

        // Update tokens
        accessToken = res.body.data.accessToken
        refreshToken = res.body.data.refreshToken
    })

    test('POST /api/auth/login - Should fail with wrong password', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: user.email, password: 'WrongPassword@123' })

        expect(res.statusCode).toBe(401)
        expect(res.body.status).toBe(false)
    })

    test('GET /api/auth/me - Should return user info with valid token', async () => {
        const res = await request(app)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${accessToken}`)

        expect(res.statusCode).toBe(200)
        expect(res.body.data.user.email).toBe(user.email)
    })

    test('POST /api/auth/refresh - Should refresh access token', async () => {
        const res = await request(app)
            .post('/api/auth/refresh')
            .send({ refreshToken })

        expect(res.statusCode).toBe(200)
        expect(res.body.data).toHaveProperty('accessToken')

        // Use new token
        accessToken = res.body.data.accessToken
    })

    test('POST /api/auth/logout - Should logout successfully', async () => {
        const res = await request(app)
            .post('/api/auth/logout')
            .send({ refreshToken })

        expect(res.statusCode).toBe(200)
        expect(res.body.message).toBe('Logout successful')
    })

    test('POST /api/auth/refresh - Should fail with invalidated refresh token', async () => {
        const res = await request(app)
            .post('/api/auth/refresh')
            .send({ refreshToken })

        expect(res.statusCode).toBe(401)
    })
})
