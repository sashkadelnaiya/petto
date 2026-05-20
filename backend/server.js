const app = require('./app')
const http = require('http')
const { Server } = require('socket.io')
const jwt = require('jsonwebtoken')
const jwtConfig = require('./config/jwt')
const { setIo } = require('./socket')

const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: '*', // на проде сюда вставляем фронт
    methods: ['GET', 'POST'],
  },
})
setIo(io)

io.use((socket, next) => {
  const token = socket.handshake.auth?.token
  if (!token) return next(new Error('No token provided'))

  try {
    const payload = jwt.verify(token, jwtConfig.access.secret)
    socket.user = { id: payload.id }
    next()
  } catch (e) {
    next(new Error('Invalid token'))
  }
})

io.on('connection', (socket) => {
  console.log('User connected:', socket.user.id)
  socket.join(`user_${socket.user.id}`)

  socket.on('join_chat', (chatId) => {
    socket.join(`chat_${chatId}`)
    console.log(`User ${socket.user.id} joined chat ${chatId}`)
  })

  socket.on('send_message', async (data) => {
    const { chatId, text } = data
    try {
      const ChatService = require('./services/chatService')
      const message = await ChatService.sendMessage(
        socket.user.id,
        chatId,
        text,
      )

      io.to(`chat_${chatId}`).emit('new_message', message)
    } catch (e) {
      socket.emit('error', { message: e.message })
    }
  })

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.user.id)
  })
})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})
