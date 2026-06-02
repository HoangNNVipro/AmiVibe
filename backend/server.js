import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import http from 'http'
import { Server } from 'socket.io'
import connectDB from './config/mongodb.js'
import connectCloudinary from './config/cloudinary.js'
import userRouter from './routes/userRoute.js'
import productRouter from './routes/productRoute.js'
import cartRouter from './routes/cartRoute.js'
import orderRouter from './routes/orderRoute.js'
import chatRouter from './routes/chatRoute.js'
import socketAuth from './middleware/socketAuth.js'
import chatHandler from './socket/chatHandler.js'

// App Config
const app = express()
const port = process.env.PORT || 4000
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['token', 'Authorization', 'Content-Type'],
    credentials: true
  },
  pingTimeout: 20000,
  pingInterval: 25000
})

// Connect to MongoDB
connectDB()
connectCloudinary()

// middlewares
app.use(express.json())
app.use(cors())

// api endpoints
app.use('/api/user', userRouter)    
app.use('/api/product', productRouter)
app.use('/api/cart', cartRouter)
app.use('/api/order', orderRouter)
app.use('/api/chat', chatRouter)
app.get('/', (req, res) => {
  res.send("API Working")
})

// socket.io middleware
io.use(socketAuth)

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id, 'userId:', socket.userId, 'isAdmin:', socket.isAdmin);
  chatHandler(io, socket);

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', socket.id, 'reason:', reason);
  });

  socket.on('error', (err) => {
    console.log('Socket error on', socket.id, err);
  });
})

server.listen(port, () => {
  console.log('Server started on port: '+ port)
})
