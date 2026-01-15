const app = require('../app')
const request = require('supertest')

test('Test if user can log in and list users with JWT', async () => {
  // Test login avec la route /api/login (retourne un JWT)
  let response = await request(app)
    .post('/api/login')
    .send({ email: 'Sebastien.Viardot@grenoble-inp.fr', password: '123456' })
  expect(response.statusCode).toBe(200)
  expect(response.body).toHaveProperty('token')
  
  // Test récupération des users avec le token JWT (header Authorization Bearer)
  response = await request(app)
    .get('/api/users')
    .set('Authorization', `Bearer ${response.body.token}`)
  expect(response.statusCode).toBe(200)
  expect(response.body.message).toBe('Returning users')
  expect(response.body.data.length).toBeGreaterThan(0)
})
