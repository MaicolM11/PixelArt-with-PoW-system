const express = require('express')
const axios = require('axios')
const FormData = require('form-data');
const path = require('path');
const myUrl = "http://172.17.0.1:4000"
const urls = ["http://172.17.0.1:4000", "http://172.17.0.1:3001", "http://172.17.0.1:3002", "http://172.17.0.1:3003"];
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const LineReaderSync = require("line-reader-sync")

var TIMES_WRITE = 20;

// Multer config
var storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '/task'))
    },
    filename: (req, file, cb) => {
        var ext = file.originalname.split('.')
        cb(null, `${Date.now()}.${ext[ext.length - 1]}`)
    }
})

var upload = multer({ storage: storage })

var app = express()
app.use(cors())
var port = 4000
var image = [];
var words = ["hola", "mundo", "feliz"];
var homeworks = [];
var http = require('http').createServer(app);

for (var i = 0; i < 10; i++) {
    image[i] = new Array(10);
}

app.use(express.json())
app.use(express.static('public'))

// {cell: {x:2,y:3}, color: "#FCB212", url:"http://172.17.0.1:300?"}
app.post('/editPixel', async (req, res) => {
    console.log("[lider] solicitud editar pixel");
    let consensus = false;
    let maxKey;
    while (!consensus) {
        let info = await getElectionsEditPixel(req.body.url)
        let votes = info[0]
        console.log('VOTES', votes);
        maxKey = Object.keys(votes).reduce((a, b) => votes[a] > votes[b] ? a : b);
        consensus = votes[maxKey] > info[1] / 2;
    }
    assignTask(maxKey, req.body, res);
})

function assignTask(word, info, res) {
    let task = { who: info.url, which: `write ${word} ${TIMES_WRITE} times`, word: word, times: TIMES_WRITE, pixel: info.cell, color: info.color }
    console.log('Task saved!', task);
    homeworks.push(task);
    urls.filter(x => x != myUrl).forEach(url => axios.post(url + "/saveTask", task).then().catch());
    res.send({ word: word, times: TIMES_WRITE })
}

async function getElectionsEditPixel(url_req) {
    let election = {}, count = 0;
    for (let i = 0; i < urls.length; i++) {
        try {
            let info = await axios.get(urls[i] + "/vow")
            election[info.data.word] = (election[info.data.word] || 0) + 1;
            count++;
        } catch (error) { }
    }
    return [election, count];
}

app.post('/checkTask', upload.single('task'), (req, res) => {
    //req.file.path=> path donde se guada
    let task = homeworks.reverse().find(x => x.who == req.body.url)
    let word = task.word, times = task.times, line, numberWords = 0
    let lrs = new LineReaderSync(req.file.path)
    while ((line = lrs.readline()) != null) {
        if (line == word) numberWords++;
    }
    fs.unlinkSync(req.file.path)
    res.send({ response: numberWords == times })
})

app.get('/vow', (req, res) => {
    let indexWord = Math.floor(Math.random() * (words.length));
    res.send({ word: words[indexWord] });
})

app.post('/task', upload.single('task'), (req, res) => {
    //req.file.path=> path donde se guada    req.body.url => server de donde viene
    res.sendStatus(200)
    let consensus = {};
    let response = 0;
    urls.filter(x => req.body.url != x).forEach(x => {
        var formData = new FormData()
        formData.append('url', String(req.body.url))
        formData.append('task', fs.createReadStream(req.file.path));
        axios.post(`${x}/checkTask`, formData, { headers: formData.getHeaders() })
            .then(info => {
                consensus[info.data.response] = (consensus[info.data.response] || 0) + 1
                response++;
                if (response == urls.length - 1) pixelRegister(consensus, req.body.url)
            }).catch((error) => console.log('Error to send file', error))
    })
})


app.get('/code', (req, res) => {
    let number = Math.floor(Math.random() * (101));
    res.send({ code: number })
})

async function pixelRegister(result, url) {
    console.log("Votacion PoW", result);
    let maxKey = Object.keys(result).reduce((a, b) => result[a] > result[b] ? a : b);
    var codes = [], accept = maxKey && result[false] != result[maxKey]
    if (accept) {
        for (let i = 0; i < urls.length; i++) {
            let res = await axios.get(urls[i] + '/code')
            codes.push(res.data.code)
        }
        codes = codes.join('-')
        let task = await homeworks.reverse().find(x => url == x.who)
        image[task.pixel.x][task.pixel.y] = { cod: codes, color: task.color }
        urls.filter(x => x != myUrl).forEach(x => {
            axios.post(x + '/savePixel', { url: url, cod: codes })
        })
    }
    axios.post(url + '/response', { response: accept })
}

app.post('/validate', upload.single('file'), (req, res) => {
    let consensus = {}, response = 0
    urls.filter(x => x != req.body.url).forEach(x => {
        var formData = new FormData()
        formData.append('url', String(req.body.url))
        formData.append('file', fs.createReadStream(req.file.path));
        axios.post(x + '/validateCertificate', formData, { headers: formData.getHeaders() })
            .then(() => {
                consensus[info.data.response] = (consensus[info.data.response] || 0) + 1
                response++;
                if (response == urls.length - 1)
                    res.send({ valid: consensus[true] > consensus[false] })
            })
            .catch((error) => console.log("Error al validar certificado"));
    })
})

app.post('/validateCertificate', upload.single('task'), (req, res) => {
    let values = fs.readFileSync(req.file.path, { encoding: "utf-8" });
    let result = []
    for (let i = 0; i < image.length; i++) {
        result.push(image[i].map(x => x.cod).join(';'))
    }
    let response = values == result.join('\n');
    res.send({ response: response })
})

http.listen(port, async () => {
    console.log('Server listening on port ', port);
});