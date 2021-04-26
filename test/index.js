const express = require('express')
const axios = require('axios')
const fs = require('fs');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const LineReaderSync = require('line-reader-sync');
const FormData = require('form-data');

var app = express()
var port = process.env.PORT || 3000
var http = require('http').createServer(app);

const image = [];
const homeworks = [];
const myUrl = "http://172.17.0.1:" + port
const words = ["hola", "mundo", "feliz"];
const urls = ["http://172.17.0.1:3000", "http://172.17.0.1:3001", "http://172.17.0.1:3002", "http://172.17.0.1:3003"];
const TIMES_WRITE = 20;
const urlLeader = "http://172.17.0.1:3000"

var path_work = './task' + port + '.txt'

for (var i = 0; i < 10; i++) image[i] = new Array(10)

// Multer config
var storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '/task')),
    filename: (req, file, cb) => {
        var ext = file.originalname.split('.')
        cb(null, `${Date.now()}.${ext[ext.length - 1]}`)
    }
})

var upload = multer({ storage: storage })

app.use(cors())
app.use(express.json())
app.use(express.static('public'))

// vista
app.post('/validate', (req, res) => {
    // add myurl to form data like url
    axios.post(urlLeader + '/validateLeader',)
})

// vista {pixel: {x:1,y:1}, color:"#ffffff"}
app.post('/editPixel', async (req, res) => {
    req.body.url = myUrl;
    axios.post(urlLeader + "/editPixelLeader", req.body)
        .then((task) => {
            res.sendStatus(200)
            writeOnFile(task.data);
        })
        .catch((error) => res.sendStatus(500));
})

// download certificate
app.get('/certificate', (req, res) => {
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
        .catch((error) => console.log('no'))
}

app.get('/vow', (req, res) => {
    let indexWord = Math.floor(Math.random() * (words.length));
    res.send({ word: words[indexWord] });
})

app.get('/code', (req, res) => {
    let number = Math.floor(Math.random() * (101));
    res.send({ code: number })
})

app.post('/saveTask', (req, res) => {
    homeworks.push(req.body);
    res.sendStatus(200);
})

app.post('/savePixel', (req, res) => {
    let task = homeworks.reverse().find(x => req.body.url == x.who)
    image[task.pixel.x][task.pixel.y] = { cod: req.body.cod, color: task.color }
    console.log(image);
    res.sendStatus(200)
})

// response of edit pixel
app.post('/response', (req, res) => {
    // send response view with ws, req.body.response = bool
    console.log(req.body.response);
    res.sendStatus(200);
})

// participante
app.post('/validateCertificate', upload.single('task'), (req, res) => {
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
    let task = homeworks.reverse().find(x => x.who == req.body.url)
    let word = task.word, times = task.times, line, numberWords = 0
    let lrs = new LineReaderSync(req.file.path)
    while ((line = lrs.readline()) != null) {
        if (line == word) numberWords++;
    }
    fs.unlinkSync(req.file.path)
    res.send({ response: numberWords == times })
})

// ===================== LEADER =======================0
app.post('/editPixelLeader', async (req, res) => {
    console.log("[lider] solicitud editar pixel");
    let consensus = false, maxKey
    while (!consensus) {
        let info = await getElectionsEditPixel(req.body.url)
        let votes = info[0]
        console.log('VOTES', votes);
        maxKey = Object.keys(votes).reduce((a, b) => votes[a] > votes[b] ? a : b);
        consensus = votes[maxKey] > info[1] / 2;
    }
    assignTask(maxKey, req.body, res);
})

// Enviar la tarea a los participantes
app.post('/task', upload.single('task'), (req, res) => {
    res.sendStatus(200)
    let consensus = {}, response = 0;
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

async function pixelRegister(result, url) {
    console.log("Votacion PoW", result);
    let maxKey = Object.keys(result).reduce((a, b) => result[a] > result[b] ? a : b);
    var accept = maxKey && result[false] != result[maxKey]
    if (accept) {
        var codes = []
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

app.post('/validateLeader', upload.single('task'), (req, res) => {
    let consensus = {}, response = 0
    urls.filter(x => x != req.body.url).forEach(x => {
        var formData = new FormData()
        formData.append('url', String(req.body.url))
        formData.append('task', fs.createReadStream(req.file.path));
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

function assignTask(word, info, res) {
    let task = { 
        who: info.url, 
        which: `write ${word} ${TIMES_WRITE} times`, 
        word: word, 
        times: TIMES_WRITE, 
        pixel: info.cell, 
        color: info.color }
    urls.forEach(url => axios.post(url + "/saveTask", task));
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

// =====


http.listen(port, async () => {
    console.log('Server listening on port ', port);
});