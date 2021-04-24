const express = require('express')
const axios = require('axios')
const fs = require('fs');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const lineReader = require('line-reader-sync');

var app = express()
app.use(cors())
var port = process.env.PORT || 3000
const myUrl = "http://172.17.0.1:" + port
var image = [];
var homeworks = [];
var http = require('http').createServer(app);

var words = ["hola", "mundo","feliz"];

const urlLeader = "http://172.17.0.1:4000"
const FormData = require('form-data');

var path_work = './task' + port

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
    let task = homeworks.reverse().find(x=>x.who == req.body.url)
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
    let task = homeworks.reverse().find(x => req,body.url == x.who)
    image[task.pixel.x][task.pixel.y] = {cod: req.body.cod, color: task.color }
    res.sendStatus(200)
})

app.post('/response', (req, res)=>{
    // req.body.response = bool
    // enviar a la vista la respuesta
    res.sendStatus(200);
})

http.listen(port, async () => {
    console.log('Server listening on port ', port);
    if (!fs.existsSync(path.join(__dirname, '/task'))) {
        fs.mkdirSync(path.join(__dirname, '/task'))
    }
});