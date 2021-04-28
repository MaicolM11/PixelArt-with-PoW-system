const express = require('express')
const axios = require('axios')
const fs = require('fs');
const cors = require('cors');
const path = require('path');
const LineReaderSync = require('line-reader-sync');
const FormData = require('form-data');
const jimp = require('jimp');
const upload = require('./multer')
const leader = require('./leader')
const logger = require('./logger')

var app = express()
var port = process.env.PORT || 3000
var http = require('http').createServer(app);
const io = require('socket.io')(http);

var image = [];
const homeworks = [];
const myUrl = "http://172.17.0.1:" + port
const words = ["hola", "mundo", "feliz"];
const urlLeader = "http://172.17.0.1:3000"
var path_work = './task' + port + '.txt'
global.socket = io.sockets

for (var i = 0; i < 10; i++) image[i] = new Array(10)

io.sockets.on('connection', (socket) => socket.emit('image', image))

app.use(cors())
app.use(express.json())
app.use(express.static('public'))
app.use('/leader', leader)

// vista
app.post('/validate',upload.single('file'), (req, res) => {
    logger.info("Solicitud para validar la imagen")
    var formdata= new FormData()
    formdata.append('url',req.body.myUrl)
    formdata.append('file', fs.createReadStream(req.file.path))
    logger.info(`Envia el archivo para validar al lider ${urlLeader}`)
    axios.post(urlLeader + '/leader/validate', formdata, {headers:formdata.getHeaders()} )
    .then((info)=> {
        logger.info(`Se obtiene respuesta de la validación asi: ${info.data.valid}`)
        res.send({res: info.data.valid})})
    .catch((error)=> res.send({res: false}))
})

// vista {pixel: {x:1,y:1}, color:"#ffffff"}
app.post('/editPixel', async (req, res) => {
    logger.info(`${myUrl} solicita pintar un pixel en coordenadas (${req.body.pixel.x},${req.body.pixel.y}) con color ${req.body.color}`)
    req.body.url = myUrl;
    axios.post(urlLeader + "/leader/editPixel", req.body)
        .then((task) => {
            res.sendStatus(200)
            logger.info(`${urlLeader} Ha asignado como tarea escribir ${task.data.word}, ${task.data.times} veces`)
            writeOnFile(task.data);
        })
        .catch((error) =>{ 
            res.sendStatus(500)
            logger.info(`Error al editar pixel x57_index`)
        });
})

function writeOnFile(info) {
    let word = info.word;
    for (let i = 0; i < info.times; i++) {
        fs.appendFileSync(path_work, `${word}\n`);
    }
    var formData = new FormData()
    formData.append('url', myUrl)
    formData.append('task', fs.createReadStream(path_work));
    logger.info(`Envia la tarea hecha para el lider`)
    axios.post(`${urlLeader}/leader/task`, formData, { headers: formData.getHeaders() })
        .then(() => fs.unlinkSync(path_work))
        .catch((error) => console.log('no'))
}

// download certificate
app.get('/certificate', (req, res) => {
    logger.info(`Solicitud de descarga del certificado`)
    let result = []
    for (let i = 0; i < image.length; i++) {
        result.push(image[i].map(x => x.cod).join(';'))
    }
    let name_file = './' + Date.now() + '.csv';
    fs.writeFileSync(name_file, result.join('\n'))
    res.download(name_file, (err) => {
        fs.unlinkSync(name_file)
    });
})

app.get('/image', (req, res) => {
    logger.info(`Solicitud de descarga de imagen`)
    new jimp((image[0].length * 100), (image.length * 100), (err, img) => {
        for (let i = 0; i < image.length; i++) {
            for (let j = 0; j < image[i].length; j++) {
                for (let k = 0; k < 100; k++) {
                    for (let l = 0; l < 100; l++) {
                        let c = (image[i][j]) ? image[i][j].color.replace('#', '') : 'ffffff'
                        img.setPixelColor(jimp.cssColorToHex(c), ((j * 100) + l), ((i * 100) + k))
                    }
                }
            }
        }
        img.write('pixel.png', (err) => {
            res.download(path.join(__dirname, '/pixel.png'), (err) => {
                fs.unlinkSync(path.join(__dirname, '/pixel.png'))
            })
        })
    })  
})

app.get('/vow', (req, res) => {
    logger.info(`llega solicitud de voto para tarea`)
    let indexWord = Math.floor(Math.random() * (words.length));
    res.send({ word: words[indexWord] });
})

app.get('/code', (req, res) => {
    logger.info(`llega solicitud de código para imagen`)
    let number = Math.floor(Math.random() * (101));
    res.send({ code: number })
})

app.post('/saveTask', (req, res) => {
    homeworks.push(req.body);
    logger.info(`Se ha almacenado una tarea: ${req.body}`)
    res.sendStatus(200);
})

app.post('/savePixel', (req, res) => {
    let task = homeworks.reverse().find(x => req.body.url == x.who)
    image[task.pixel.x][task.pixel.y] = { cod: req.body.cod, color: task.color }
    logger.info(`Se guarda el pixel con código ${req.bodu.cod} y color ${task.color}`)
    res.sendStatus(200)
})

// response of edit pixel
app.post('/response', (req, res) => {
    logger.info(`Obtiene respuesta por parte del lider para editar un pixel`)
    global.socket.emit('response', req.body.response)
    res.sendStatus(200);
})

// participante
app.post('/validateCertificate', upload.single('file'), (req, res) => {
    logger.info(`Solicitud para validar la imagen`)
    let values = fs.readFileSync(req.file.path, { encoding: "utf-8" });
    let result = []
    for (let i = 0; i < image.length; i++) {
        result.push(image[i].map(x => x.cod).join(';'))
    }
    let response = values == result.join('\n');
    res.send({ response: response })
})

// participante
app.post('/checkTask', upload.single('task'), (req, res) => {
    logger.info(`Recibe tarea para validar`)
    let task = homeworks.reverse().find(x => x.who == req.body.url)
    let word = task.word, times = task.times, line, numberWords = 0
    let lrs = new LineReaderSync(req.file.path)
    while ((line = lrs.readline()) != null) {
        if (line == word) numberWords++;
    }
    fs.unlinkSync(req.file.path)
    res.send({ response: numberWords == times })
})

http.listen(port, async () => {
    console.log('Server listening on port ', port);
    if (!fs.existsSync(path.join(__dirname,'/task'))) fs.mkdirSync(path.join(__dirname,'/task'))
});