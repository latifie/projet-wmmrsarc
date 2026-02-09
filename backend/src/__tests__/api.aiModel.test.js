const request = require('supertest')
const app = require('../app')
const aiModelModel = require('../models/aiModels')
const axios = require('axios')

jest.mock('axios')

describe('AI Model Controller', () => {
    let adminToken
    let userToken
    let adminId

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
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('GET /api/models', () => {
        it('Should return all models when authenticated', async () => {
            const res = await request(app)
                .get('/api/models')
                .set('Authorization', `Bearer ${userToken}`)

            expect(res.statusCode).toBe(200)
            expect(res.body.status).toBe(true)
            expect(Array.isArray(res.body.data)).toBe(true)
        })

        it('Should fail when not authenticated', async () => {
            const res = await request(app)
                .get('/api/models')

            expect(res.statusCode).toBe(401)
        })
    })

    describe('GET /api/models/search', () => {
        it('Should return search results for admin', async () => {
            // Mock Axios response for Ollama Search
            const html = `
                <ul>
                    <li>
                        <a href="/library/llama2">
                            <h2>Llama 2</h2>
                            <p>Meta open source LLM</p>
                        </a>
                    </li>
                </ul>
             `
            axios.get.mockResolvedValue({ data: html })

            const res = await request(app)
                .get('/api/models/search?q=llama')
                .set('Authorization', `Bearer ${adminToken}`)

            expect(res.statusCode).toBe(200)
            expect(res.body.status).toBe(true)
            expect(res.body.data).toHaveLength(1)
            expect(res.body.data[0].name).toBe('Llama 2')
        })

        it('Should fail for non-admin', async () => {
            const res = await request(app)
                .get('/api/models/search?q=llama')
                .set('Authorization', `Bearer ${userToken}`)

            expect(res.statusCode).toBe(403)
        })
    })

    describe('POST /api/models', () => {
        it('Should create a new model for admin', async () => {
            // Mock Axios response for Ollama Library check (success)
            axios.get.mockResolvedValue({ status: 200 })

            const res = await request(app)
                .post('/api/models')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'test-model',
                    description: 'A test model'
                })

            expect(res.statusCode).toBe(200)
            expect(res.body.status).toBe(true)
            expect(res.body.data.name).toBe('test-model')

            // Cleanup
            await aiModelModel.destroy({ where: { name: 'test-model' } })
        })

        it('Should fail if model does not exist in Ollama', async () => {
            // Mock Axios response for Ollama Library check (404)
            const error = new Error('Not Found')
            error.response = { status: 404 }
            axios.get.mockRejectedValue(error)

            const res = await request(app)
                .post('/api/models')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'non-existent-model'
                })

            expect(res.statusCode).toBe(400)
        })

        it('Should fail for non-admin', async () => {
            const res = await request(app)
                .post('/api/models')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    name: 'test-model'
                })

            expect(res.statusCode).toBe(403)
        })
    })

    describe('DELETE /api/models/:id', () => {
        let modelId

        beforeAll(async () => {
            // Create a dummy model to delete
            const model = await aiModelModel.create({
                name: 'delete-me',
                description: 'To be deleted',
                dockerImage: 'delete-me'
            })
            modelId = model.id
        })

        afterAll(async () => {
            await aiModelModel.destroy({ where: { name: 'delete-me' } })
        })

        it('Should allow admin to delete model', async () => {
            const res = await request(app)
                .delete(`/api/models/${modelId}`)
                .set('Authorization', `Bearer ${adminToken}`)

            expect(res.statusCode).toBe(200)
            expect(res.body.status).toBe(true)

            const check = await aiModelModel.findByPk(modelId)
            expect(check).toBeNull()
        })

        it('Should fail for non-admin', async () => {
            const res = await request(app)
                .delete(`/api/models/${modelId}`) // Already deleted but check auth first usually
                .set('Authorization', `Bearer ${userToken}`)

            expect(res.statusCode).toBe(403)
        })
    })
})
