const socketIo = require('socket.io')
const jwt = require('jsonwebtoken')
require('mandatoryenv').load(['ACCESS_TOKEN_SECRET'])
const { ACCESS_TOKEN_SECRET } = process.env

let io
const onlineUsers = new Map() // userId -> socketId

module.exports = {
    init: (httpServer) => {
        io = socketIo(httpServer, {
            cors: {
                origin: '*', // Allow all origins for dev/prod simplicity
                methods: ['GET', 'POST']
            }
        })

        io.use((socket, next) => {
            const token = socket.handshake.auth.token
            if (!token) return next(new Error('Authentication error'))

            jwt.verify(token, ACCESS_TOKEN_SECRET, (err, decoded) => {
                if (err) return next(new Error('Authentication error'))
                socket.userId = decoded.id
                next()
            })
        })

        io.on('connection', (socket) => {
            console.log(`User connected: ${socket.userId}`)
            require('fs').appendFileSync('crash.log', `[${new Date().toISOString()}] User connected: ${socket.userId}\n`)

            onlineUsers.set(socket.userId, socket.id)

            // Broadcast online users list
            io.emit('online_users', Array.from(onlineUsers.keys()))

            socket.on('disconnect', () => {
                try {
                    const fs = require('fs')
                    const msg = `[${new Date().toISOString()}] User disconnected: ${socket.userId}`
                    // console.log(msg) // Causing EPIPE on PM2?
                    fs.appendFileSync('crash.log', msg + '\n')

                    // Only remove if this socket corresponds to the user (handle multi-tab)
                    if (onlineUsers.get(socket.userId) === socket.id) {
                        onlineUsers.delete(socket.userId)
                        io.emit('online_users', Array.from(onlineUsers.keys()))
                    }
                } catch (err) {
                    const fs = require('fs')
                    const errMsg = `[${new Date().toISOString()}] Socket disconnect error: ${err.message}\n${err.stack}\n`
                    // console.error('Socket disconnect error:', err)
                    fs.appendFileSync('crash.log', errMsg)
                }
            })
        })

        return io
    },

    getIO: () => {
        if (!io) {
            throw new Error('Socket.io not initialized!')
        }
        return io
    }
}
