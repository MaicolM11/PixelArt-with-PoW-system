const express = require('express')
const axios = require('axios')
const FormData = require('form-data');
const path = require('path');
const urlLeader = "http://172.17.0.1:4000"
const urls = ["http://172.17.0.1:4000","http://172.17.0.1:3001","http://172.17.0.1:3002","http://172.17.0.1:3003"];
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');

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

var app = express()
app.use(cors())
var port = 4000
var image = [];
var words = ["hola", "mundo","feliz"];
var homeworks = [];
var http = require('http').createServer(app);

for(var i=0; i<10; i++) {
    image[i] = new Array(10);
} 

app.use(express.json())
app.use(express.static('public'))

app.get('/', (req, res) => {
    
})
// {cell: {x:2,y:3}, color: "#FCB212", url:"http://172.17.0.1:300?"}
app.post('/editPixel', (req, res) => {
    let consensus = false;
    let valuesMajors;
    while(!consensus){
        valuesMajors = getMajors(getElectionsEditPixel());
        consensus = valuesMajors.length == 1 ;
    }
    assignTask(valuesMajors.pop(), req.body);
    res.sendStatus(200);
})

function getElectionsEditPixel(){
    let election = {};
    urls.filter(url => url != req.body.url).forEach(url => {
        axios.get(url+"/vow").then(data =>{
            election[data] = (election[data] || 0) + 1;
        }).catch();
    })
    return election;
}

function getMajors(election){
    let maxKey = Object.keys(election).reduce((a, b) => election[a] > election[b] ? a : b );
    let maxValue = election[maxKey];
    let values = [];
    for (const key in election) {
        if (election[key] == maxValue) values.push(key)
    }
    return values;
}

function assignTask(word, info){
    let task = {who: info.url, which: `write ${word} 19000 times`, pixel: info.cell, color : info.color }
    homeworks.push(task);
    urls.forEach(url => axios.post(url+"/saveTask", task).then().catch());
    axios.post(info.url+"/assignTask", {word : word, times: 19000});
}

app.get('/vow', (req, res) => {
    let indexWord = Math.floor(Math.random() * (word.length));
    res.send(words[indexWord]);
})

app.post('/task',upload.single('task'),(req,res)=>{
    //req.file.path=> path donde se guada
    //req.body.url => server de donde viene
    var formData= new FormData()
    formData.append('task', fs.createReadStream(req.file.path));
    /** 
    urls.map(url=>{
        axios.post(`${url}/task`, 
        formData
        , { headers: formData.getHeaders() })
        .then(()=>{
            console.log('si')
        }).catch((error)=>{
            console.log('no')
        })
    })
    */
    //borrar el archivo ubicado en req.file.path
    res.sendStatus(200)
})

http.listen(port, async () => {
    console.log('Server listening on port ', port);
    if (!fs.existsSync(path.join(__dirname,'/task'))) {
        fs.mkdirSync(path.join(__dirname,'/task'))
    }
});