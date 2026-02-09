const request = require('supertest')
const app = require('../app')
const requestModel = require('../models/requests')
const aiModelModel = require('../models/aiModels')
const chatModel = require('../models/chats')
const container = require('../util/chatManager')

// Mock chatManager
jest.mock('../util/chatManager', () => ({
    createInstance: jest.fn(),
    pullModel: jest.fn()
}))

describe('Request Controller', () => {
    let adminToken
    let userToken
    let adminId
    let userId
    let aiModelId

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

        // Get an AI Model ID
        const modelRes = await request(app)
            .get('/api/models')
            .set('Authorization', `Bearer ${userToken}`)

        aiModelId = modelRes.body.data[0].id
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('POST /api/requests', () => {
        it('Should create a request', async () => {
            const res = await request(app)
                .post('/api/requests')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    aiModelId
                })

            expect(res.statusCode).toBe(201)
            expect(res.body.status).toBe(true)
            expect(res.body.data.status).toBe('pending')
            expect(res.body.data.userId).toBe(userId)
            expect(res.body.data.aiModelId).toBe(aiModelId)
        })

        it('Should fail without aiModelId', async () => {
            const res = await request(app)
                .post('/api/requests')
                .set('Authorization', `Bearer ${userToken}`)
                .send({})

            expect(res.statusCode).toBe(400)
        })
    })

    describe('GET /api/requests', () => {
        it('Should return user requests', async () => {
            const res = await request(app)
                .get('/api/requests')
                .set('Authorization', `Bearer ${userToken}`)

            expect(res.statusCode).toBe(200)
            expect(res.body.status).toBe(true)
            expect(Array.isArray(res.body.data)).toBe(true)
            expect(res.body.data.length).toBeGreaterThan(0)
        })
    })

    describe('GET /api/requests/admin/all', () => {
        it('Should return all requests for admin', async () => {
            const res = await request(app)
                .get('/api/requests/admin/all')
                .set('Authorization', `Bearer ${adminToken}`)

            expect(res.statusCode).toBe(200)
            expect(res.body.status).toBe(true)
            expect(Array.isArray(res.body.data)).toBe(true)
        })

        it('Should fail for non-admin', async () => {
            const res = await request(app)
                .get('/api/requests/admin/all')
                .set('Authorization', `Bearer ${userToken}`)

            expect(res.statusCode).toBe(403)
        })
    })

    describe('POST /api/requests/:id/approve', () => {
        let requestId

        beforeEach(async () => {
            // Create a pending request
            const req = await requestModel.create({
                userId,
                aiModelId,
                status: 'pending'
            })
            requestId = req.id
        })

        it('Should approve request and trigger deployment', async () => {
            // Mock container success
            container.createInstance.mockResolvedValue('http://localhost:11434')
            container.pullModel.mockResolvedValue(true)

            const res = await request(app)
                .post(`/api/requests/${requestId}/approve`)
                .set('Authorization', `Bearer ${adminToken}`)

            expect(res.statusCode).toBe(200)
            expect(res.body.status).toBe(true)
            expect(res.body.message).toContain('approved')

            // Verify request status
            const updatedReq = await requestModel.findByPk(requestId)
            expect(updatedReq.status).toBe('approved')

            // Verify mocks
            expect(container.createInstance).toHaveBeenCalled()
            expect(container.pullModel).toHaveBeenCalled()
        })

        it('Should fail for non-admin', async () => {
            const res = await request(app)
                .post(`/api/requests/${requestId}/approve`)
                .set('Authorization', `Bearer ${userToken}`)

            expect(res.statusCode).toBe(403)
        })
    })

    describe('POST /api/requests/:id/reject', () => {
        let requestId

        beforeEach(async () => {
            // Create a pending request
            const req = await requestModel.create({
                userId,
                aiModelId,
                status: 'pending'
            })
            requestId = req.id
        })

        it('Should reject request', async () => {
            const res = await request(app)
                .post(`/api/requests/${requestId}/reject`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ reason: 'Not enough resources' })

            expect(res.statusCode).toBe(200)
            expect(res.body.status).toBe(true)

            // Verify request status
            const updatedReq = await requestModel.findByPk(requestId)
            expect(updatedReq.status).toBe('rejected')
            expect(updatedReq.rejectionReason).toBe('Not enough resources')
        })

        it('Should fail for non-admin', async () => {
            const res = await request(app)
                .post(`/api/requests/${requestId}/reject`)
                .set('Authorization', `Bearer ${userToken}`)

            expect(res.statusCode).toBe(403)
        })
    })
})
