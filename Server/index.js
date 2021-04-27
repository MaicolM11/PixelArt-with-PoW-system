const express = require('express')
const axios = require('axios')
const fs = require('fs');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const lineReader = require('line-reader-sync');
const jimp = require('jimp');
var app = express()
app.use(cors())
var port = process.env.PORT || 3000
const myUrl = "http://172.17.0.1:" + port
var image = [];
var homeworks = [];
var http = require('http').createServer(app);
const io = require('socket.io')(http);

var words = ["hola", "mundo","feliz"];

const urlLeader = "http://172.17.0.1:4000"
const FormData = require('form-data');

var path_work = './task' + port + '.txt'

global.socket = io.sockets

io.sockets.on('connection', (socket) => {
    socket.emit('image', image)
})

// Multer config
var storage = multer.diskStorage({
    destination: (req, file, cb) =>  cb(null, path.join(__dirname, '/task')) ,
    filename: (req, file, cb) => {
        var ext = file.originalname.split('.')
        cb(null, `${Date.now()}.${ext[ext.length - 1]}`)
    }
})

var upload = multer({ storage: storage })

for (var i = 0; i < 10; i++) {
    image[i] = new Array(10);
}

image[4][5]={color:'#ff1234'}

app.use(express.json())
app.use(express.static('public'))

app.get('/code', (req, res) => {
    let number = Math.floor(Math.random() * (101));
    res.send({code:number})
})

// {cell: {x:2,y:3}, color: "#FCB212"}
app.post('/editPixel', async (req, res) => {
    req.body.url = myUrl;
    axios.post(urlLeader + "/editPixel", req.body)
            .then((task)=> {
                res.sendStatus(200)
                writeOnFile(task.data);
            })
            .catch((error) => res.sendStatus(500));
})

function writeOnFile(info) {
    let word = info.word;
    for (let i = 0; i < info.times; i++) {
        fs.appendFileSync(path_work, `${word}\n`);
    }
    var formData = new FormData()
    formData.append('url', myUrl)
    formData.append('task', fs.createReadStream(path_work));
    axios.post(`${urlLeader}/task`, formData, { headers: formData.getHeaders() })
        .then(() => fs.unlinkSync(path_work))
        .catch((error) =>  console.log('no') )
}

app.get('/vow', (req, res) => {
    let indexWord = Math.floor(Math.random() * (words.length));
    res.send({word: words[indexWord]});
})

app.post('/saveTask', (req, res) => {
    homeworks.push(req.body);
    res.sendStatus(200);
})

app.post('/checkTask', upload.single('task'), (req, res) => {
    //req.file.path=> path donde se guada
    let task = homeworks.reverse().find( x=>x.who == req.body.url)
    let word = task.word, times = task.times, line, numberWords = 0
    let lrs = new lineReader(req.file.path)
    while((line=lrs.readline())!= null) {
        if(line == word)  numberWords++;
    }
    fs.unlinkSync(req.file.path)
    res.send({response:numberWords == times})
})

// {url, cod}
app.post('/savePixel', (req, res)=>{
    let task = homeworks.reverse().find(x => req.body.url == x.who)
    image[task.pixel.x][task.pixel.y] = {cod: req.body.cod, color: task.color }
    console.log(image);
    global.sockets.emit('image',image)
    res.sendStatus(200)
})

app.post('/response', (req, res)=>{
    // send response view with ws, req.body.response = bool
    console.log(req.body.response);
    global.sockets.emit('response',req.body.response)
    res.sendStatus(200);
})

app.get('/certificate', (req,res)=>{
    let result = []
    for (let i = 0; i < image.length; i++) {
        result.push(image[i].map(x=> x.cod).join(';'))
    }
    let name_file = './' + Date.now() + '.csv';
    fs.writeFileSync(name_file, result.join('\n'))
    res.download(name_file, (err)=>{
        fs.unlinkSync(name_file)
    });
})

app.get('/image', (req,res)=>{
    writeImage(res)
})

function writeImage(res) {
    var imageFile = new jimp( (image[0].length*100),(image.length*100), (err, img) =>{
        if (err) throw err
        for (let i = 0; i < image.length; i++) {
            for (let j = 0; j < image[i].length; j++) {
                for (let k = 0; k < 100; k++) {
                    for (let l = 0; l < 100; l++) {
                        let c=(image[i][j])?image[i][j].color.replace('#',''): 'ffffff'
                        img.setPixelColor(jimp.cssColorToHex(c),((j*100)+l),((i*100)+k))
                    }
                }
            }
        }
        img.write('pixel.png', (err) => {
            if (err) {throw err}
            else {
                res.download(path.join(__dirname,'/pixel.png'), (err)=>{
                    fs.unlinkSync(path.join(__dirname,'/pixel.png'))
                })
            }
        })
    })
}

// vista
app.post('/validate',upload.single('file'), (req,res)=> {
    // add myurl to form data like url
    var formdata= new FormData()
    formdata.append('url',req.body.myUrl)
    formdata.append('file', fs.createReadStream(req.file.path))
    axios.post(urlLeader + '/validate',formdata, {headers:formdata.getHeaders()} )
})

// lider
app.post('/validateCertificate', upload.single('file'), (req,res)=>{
    let values = fs.readFileSync(req.file.path, { encoding: "utf-8"});
    let result = []
    for (let i = 0; i < image.length; i++) {
        result.push(image[i].map(x=> x.cod).join(';'))
    }
    let response = values == result.join('\n'); 
    res.send({response: response})
})

http.listen(port, async () => {
    console.log('Server listening on port ', port);
    if (!fs.existsSync(path.join(__dirname, '/task'))) {
        fs.mkdirSync(path.join(__dirname, '/task'))
    }
});