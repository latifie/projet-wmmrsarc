const request = require('supertest')
const app = require('../app')
const chatModel = require('../models/chats')
const aiModelModel = require('../models/aiModels')
const container = require('../util/chatManager')
const progressCache = require('../util/downloadProgressCache')
const axios = require('axios')

// Mocks
jest.mock('../util/chatManager', () => ({
    createInstance: jest.fn(),
    pullModel: jest.fn()
}))

jest.mock('../util/downloadProgressCache', () => ({
    getProgress: jest.fn()
}))

jest.mock('axios')

describe('Chat Controller', () => {
    let adminToken
    let userToken
    let adminId
    let userId

    beforeAll(async () => {
        // Initialize associations
        require('../models/init')()

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
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('POST /api/chats', () => {
        it('Should create a new chat for admin', async () => {
            container.createInstance.mockResolvedValue('http://localhost:11434')

            const res = await request(app)
                .post('/api/chats')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    model: 'llama2',
                    userId: userId
                })

            expect(res.statusCode).toBe(200)
            expect(res.body.status).toBe(true)
            expect(res.body.data.url).toBe('http://localhost:11434')

            // Verify chat created
            const chat = await chatModel.findOne({ where: { userId, model: 'llama2' } })
            expect(chat).toBeTruthy()
        })

        it('Should fail for non-admin', async () => {
            const res = await request(app)
                .post('/api/chats')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    model: 'llama2',
                    userId: userId
                })

            expect(res.statusCode).toBe(403)
        })
    })

    describe('GET /api/chats', () => {
        it('Should return user chats', async () => {
            const res = await request(app)
                .get('/api/chats')
                .set('Authorization', `Bearer ${userToken}`)

            expect(res.statusCode).toBe(200)
            expect(res.body.status).toBe(true)
            expect(Array.isArray(res.body.data)).toBe(true)
        })
    })

    describe('GET /api/chats/:id/status', () => {
        let chatId

        beforeEach(async () => {
            const chat = await chatModel.create({
                userId,
                model: 'llama2',
                url: 'http://localhost:11434'
            })
            chatId = chat.id
        })

        afterEach(async () => {
            if (chatId) await chatModel.destroy({ where: { id: chatId } })
        })

        it('Should return status when model is loaded', async () => {
            // Mock Axios response from Ollama /api/tags
            axios.get.mockResolvedValue({
                data: {
                    models: [{ name: 'llama2:latest' }]
                }
            })

            const res = await request(app)
                .get(`/api/chats/${chatId}/status`)
                .set('Authorization', `Bearer ${userToken}`)

            expect(res.statusCode).toBe(200)
            expect(res.body.data.modelLoaded).toBe(true)
        })

        it('Should return status when downloading', async () => {
            // Mock Axios response from Ollama /api/tags (model missing)
            axios.get.mockResolvedValue({
                data: {
                    models: []
                }
            })
            // Mock progress
            progressCache.getProgress.mockReturnValue({ percent: 50, status: 'downloading' })

            const res = await request(app)
                .get(`/api/chats/${chatId}/status`)
                .set('Authorization', `Bearer ${userToken}`)

            expect(res.statusCode).toBe(200)
            expect(res.body.data.modelLoaded).toBe(false)
            expect(res.body.data.downloadInProgress).toBe(true)
            expect(res.body.data.downloadProgress.percent).toBe(50)
        })
    })

    describe('POST /api/chats/:id/message', () => {
        let chatId

        beforeEach(async () => {
            const chat = await chatModel.create({
                userId,
                model: 'llama2',
                url: 'http://localhost:11434'
            })
            chatId = chat.id

            // Ensure AI Model exists for tag resolution
            await aiModelModel.create({
                name: 'llama2',
                dockerImage: 'llama2',
                description: 'test'
            }).catch(() => { }) // Ignore if exists
        })

        afterEach(async () => {
            if (chatId) await chatModel.destroy({ where: { id: chatId } })
        })

        it('Should send message and return response', async () => {
            // Mock Axios response from Ollama /api/chat
            axios.post.mockResolvedValue({
                data: {
                    message: { content: 'Hello human!' }
                }
            })

            const res = await request(app)
                .post(`/api/chats/${chatId}/message`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ message: 'Hi' })

            expect(res.statusCode).toBe(200)
            expect(res.body.data.response).toBe('Hello human!')
        })

        it('Should fail if user does not own chat', async () => {
            // Create admin chat
            const adminChat = await chatModel.create({
                userId: adminId,
                model: 'llama2',
                url: 'http://localhost:11434'
            })

            const res = await request(app)
                .post(`/api/chats/${adminChat.id}/message`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ message: 'Hi' })

            expect(res.statusCode).toBe(403)

            await adminChat.destroy()
        })
    })
})
