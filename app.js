const express = require('express')
const app = express()
const favicon = require('serve-favicon')
const http = require('http').Server(app)
const io = require('socket.io')(http)
const port = process.env.PORT

app.use(favicon(__dirname + '/favicon.ico'))

app.use('/public', express.static('public'))

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html')
})

// -----------------
// 서버 요소는 고장 안난다고 가정하고 작성함

// -----------------
// 게임

const entities = {}

let oldTime
let deltaTime = 10

const gameIdle = () => {
    const newTime = Date.now()
    while (newTime - oldTime >= deltaTime) {
        oldTime += deltaTime
        io.emit('tick')

        // translate
        for (const entity of Object.values(entities)) {
            entity.velocity.x *= 0.95
            entity.velocity.y *= 0.95

            entity.position.x += entity.velocity.x
            entity.position.y += entity.velocity.y
        }
    }

    setTimeout(gameIdle)
}

const startGame = () => {
    oldTime = Date.now()
    setTimeout(gameIdle)
}

startGame()

const joinPlayer = (id) => {
    entities[id] = {
        type: '슬라임',
        imageKey: '슬라임',
        position: {
            x: 50,
            y: 50
        },
        velocity: {
            x: 0,
            y: 0
        },
        direction: {
            x: 1,
            y: 1
        },
        movePoint: 3
    }
}

const leftPlayer = (id) => {
    delete entities[id]
}

const movePlayer = (id, angle) => {
    const player = entities[id]

    if (Math.abs(angle) > Math.PI / 2) {
        player.direction.x = -1
    }
    else {
        player.direction.x = 1
    }

    if (angle < 0) {
        player.direction.y = -1
    }
    else {
        player.direction.y = 1
    }

    player.velocity.x += Math.cos(angle) * player.movePoint
    player.velocity.y += Math.sin(angle) * player.movePoint
}

// -----------------
// socket.io

io.on('connection', (socket) => {
    socket.broadcast.emit('join', socket.id)
    joinPlayer(socket.id)

    socket.emit('welcome', entities)

    socket.on('disconnect', () => {
        io.emit('left', socket.id)
        leftPlayer(socket.id)
    })

    socket.on('move', (angle) => {
        io.emit('move', { id: socket.id, angle })
        movePlayer(socket.id, angle)
    })
})

// -----------------

http.listen(port, () => {
    console.log('http 서버가 열렸습니다.')
})
