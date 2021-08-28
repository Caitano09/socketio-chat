const express = require('express')
const app = express()
const mongoose = require('mongoose')
mongoose.Promise = global.Promise
const bodyParser = require('body-parser')
const session = require('express-session')
const sharedSession = require('express-socket.io-session')
const http = require('http').Server(app)
const io = require('socket.io')(http)
const redis = require('socket.io-redis')
io.adapter(redis())
const jwt = require('jsonwebtoken')
const cors = require('cors')
const port = process.env.PORT || 3001
const jwtSecret = process.env.JWT_SECRET || 'socketio-com-react'


const Room = require('./models/room')
const Message = require('./models/message')

app.use(express.static('public'))
app.use(bodyParser.urlencoded())
app.use(bodyParser.json())
app.use(cors())

const ExpressSession = session({
    secret: 'socketio',
    cookie: {
        maxAge: 10 * 60 * 1000
    }
})

app.use(ExpressSession)
io.use(sharedSession(ExpressSession, {autoSave: true}))
    io.use(async(socket, next) =>{
        const isValid = await jwt.verify(socket.handshake.query.token, jwtSecret)
        if(!socket.handshake.query.token || !isValid){
            next(new error('auth failed.'))
        }else{
            next()
        }
    /*const session = socket.handshake.session
    if(!session.user){
        next(new error('auth failed.'))
    }else{
        next()
    }*/

})

app.set('view engine', 'ejs')

app.get('/', (req, res) => {
    res.render('home')
})

app.post('/auth', async(req, res) => {
    // auth entraria aqui
    /*req.session.user = {
        name: req.body.name
    }
    res.redirect('/room')*/
    const token = await jwt.sign({
        name: req.body.name
    }, jwtSecret)
    res.send({token})
})

app.get('/room', (req, res) => {
    if (!req.session.user) {
        res.redirect('/')
    }
    else {
        res.render('room', {
            name: req.session.user.name
        })
    }
})

io.on('connection', socket=>{

    //salas iniciais
    Room.find({}, (err, rooms)=>{
        socket.emit('roomList', rooms)
    })
    
    // adicionar nova sala
    socket.on('addRoom', roomName =>{
        const room = new Room({
            name: roomName
        })
        room
            .save()
            .then(()=>{
                io.emit('newRoom', room)
            })
        //console.log('addRoom', roomName)
    })
    //join na sala

    socket.on('join', roomId=>{
        socket.join(roomId)
     
        Message
            .find({room: roomId})
            .then(msgs => {
                socket.emit('msgsList', msgs)
            })
    })

    socket.on('sendMsg', async msg=>{
        const decoded = await jwt.decode(socket.handshake.query.token, jwtSecret)
        const message = new Message({
            author: decoded.name,
            when: new Date(),
            msgType: 'text',
            message: msg.msg,
            room: msg.room
        })
        message
            .save()
            .then(()=>{
                io.to(msg.room).emit('newMsg', message)
            })
    })

    socket.on('sendAudio', async audio =>{
        const decoded = await jwt.decode(socket.handshake.query.token, jwtSecret)
        const message = new Message({
            author: decoded.name,
            when: new Date(),
            msgType: 'audio',
            message: audio.data,
            room: audio.room
        })
        message
            .save()
            .then(()=>{
                io.to(audio.room).emit('newAudio', message)
            })
    })
})

mongoose
    .connect('mongodb://localhost/chat-socketio', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        http.listen(port, () => console.log('chat running...', port))
    })
