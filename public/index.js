// 프레임워크 준비 ---
const canvas = document.querySelector('canvas')
const ctx = canvas.getContext('2d')
ctx.imageSmoothingEnabled = false

// 게임 정의 ---
const images = {}

let entities

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

const updateGame = () => {
    // translate
    for (const entity of Object.values(entities)) {
        entity.velocity.x *= 0.95
        entity.velocity.y *= 0.95

        entity.position.x += entity.velocity.x
        entity.position.y += entity.velocity.y
    }

    // render
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    for (const entity of Object.values(entities)) {
        const image = images[entity.imageKey]
        ctx.save()
        ctx.translate(entity.position.x, entity.position.y)
        ctx.scale(entity.direction.x, 1)
        ctx.translate(-image.center.x, -image.center.y)
        ctx.drawImage(image, 0, 0)
        ctx.restore()
    }
}

const inputHandler = (event) => {
    const x = event.offsetX
    const y = event.offsetY

    const angle = Math.atan2(y - entities[socket.id].position.y, x - entities[socket.id].position.x)

    socket.emit('move', angle)
}

const startGame = () => {
    canvas.addEventListener('click', inputHandler)
}

const stopGame = () => {
    canvas.removeEventListener('click', inputHandler)
}

// 리소스 준비 ---
const imageResources = [
    {
        key: '슬라임',
        src: '/public/슬라임.png',
        center: {
            x: 17,
            y: 22
        }
    }
]

let imageLoadCount = 0
let targetLoadCount = imageResources.length

for (const imageResource of imageResources) {
    const { key, src, center } = imageResource
    const image = new Image()
    image.src = src
    image.center = center
    images[key] = image 
    image.onload = () => {
        imageLoadCount++
        if (imageLoadCount === targetLoadCount) {
            setTimeout(connectNetwork)
        }
    }
    image.onerror = () => {
        console.log('에러, 이미지 리소스 로드 실패')
    }
}

// io 준비 ---
let socket

const connectNetwork = () => {
    socket = io()

    socket.on('connect', () => {
        startGame()
    })

    socket.on('disconnect', () => {
        stopGame()
    })

    socket.on('welcome', (_entities) => {
        entities = _entities
    })

    socket.on('tick', () => {
        updateGame()
    })

    socket.on('join', (id) => {
        joinPlayer(id)
    })

    socket.on('left', (id) => {
        leftPlayer(id)
    })

    socket.on('move', (data) => {
        movePlayer(data.id, data.angle)
    })
}
