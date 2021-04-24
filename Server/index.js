const express = require('express')
const axios = require('axios')
const fs = require('fs');
const cors = require('cors');
const path = require('path');
const multer = require('multer');

// Multer config
var storage =multer.diskStorage({
    destination: (req,file,cb)=>{
        cb(null,path.join(__dirname,'/task'))
    },
    filename:(req,file,cb)=>{
        var ext=file.originalname.split('.')
        cb(null,`${Date.now()}.${ext[ext.length-1]}`)
    }
})

var upload=multer({storage:storage})

//http://172.17.0.1:4000
const urlLeader = "http://192.168.0.77:4000"
const FormData = require('form-data');

var app = express()
app.use(cors())
var port = process.env.PORT ||3000
const myUrl = "http://172.17.0.1:"+port
var image = [];
var homeworks = [];
var http = require('http').createServer(app);

for(var i=0; i<10; i++) {
    image[i] = new Array(10);
} 

app.use(express.json())
app.use(express.static('public'))

app.get('/', (req, res) => {
    
})
// {cell: {x:2,y:3}, color: "#FCB212"}
app.post('/editPixel', (req, res) => {
    let cell = req.body.cell;
    let color = req.body.color;
    req.body.url = myUrl;
    axios.post(urlLeader+ "/editPixel", req.body).then().catch();
    res.sendStatus(200)
})

app.get('/vow', (req, res) => {
    let indexWord = Math.floor(Math.random() * (word.length));
    res.send(words[indexWord]);
})

// {word : word, times: 19000}
app.post('/assignTask', async (req, res) => {
    writeOnFile(req.body);
    res.sendStatus(200);
})

function writeOnFile(info){
    let word = info.word;
    fs.writeFileSync("./prueba.txt","")
    for (let i = 0; i < info.times; i++) {
        fs.appendFileSync("./prueba.txt", `${word}\n`);
    }
    var formData=new FormData()
    var p=path.join(__dirname,'/prueba.txt')
    formData.append('url',myUrl)
    formData.append('task', fs.createReadStream(p));
    axios.post(`${urlLeader}/task`, 
        formData
        , { headers: formData.getHeaders() })
    .then(()=>{
        fs.unlinkSync(p)
    }).catch((error)=>{console.log('no')})
    //ENVIAR AL LIDER EL FILE para que el lider se lo envie a todos (menos a mi) para validar que se hizo la tarea
    //ESE POST ESTA SIN HACER
}

app.post('/saveTask', (req, res) => {
    homeworks.push(req.body);
    res.sendStatus(200);
})

app.post('/task',upload.single('task'),(req,res)=>{
     //req.file.path=> path donde se guada
     // comparar con la tarea
     //borrar el archivo ubicado en req.file.path
})

http.listen(port, async () => {
    console.log('Server listening on port ', port);
    if (!fs.existsSync(path.join(__dirname,'/task'))) {
        fs.mkdirSync(path.join(__dirname,'/task'))
    }
});