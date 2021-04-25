const express = require('express')
const axios = require('axios')
const FormData = require('form-data');
const path = require('path');
const myUrl = "http://172.17.0.1:4000"
const urls = ["http://172.17.0.1:4000","http://172.17.0.1:3001","http://172.17.0.1:3002","http://172.17.0.1:3003"];
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const LineReaderSync = require("line-reader-sync")

var TIMES_WRITE = 20;

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

// {cell: {x:2,y:3}, color: "#FCB212", url:"http://172.17.0.1:300?"}
app.post('/editPixel', async (req, res) => {
    console.log("[lider] solicitud editar pixel");
    let consensus = false;
    let maxKey;
    while(!consensus){
        let info = await getElectionsEditPixel(req.body.url)
        let votes = info[0]
        console.log('VOTES',votes);
        maxKey = Object.keys(votes).reduce((a, b) => votes[a] > votes[b] ? a : b );
        consensus = votes[maxKey] > info[1] / 2;    
    }
    assignTask(maxKey, req.body, res);
})

function assignTask(word, info, res){
    let task = {who: info.url, which: `write ${word} ${TIMES_WRITE} times`, word : word, times: TIMES_WRITE, pixel: info.cell, color : info.color }
    console.log('Task saved!', task);
    homeworks.push(task);
    urls.filter(x=> x != myUrl).forEach(url => axios.post(url+"/saveTask", task).then().catch());
    res.send({word : word, times: TIMES_WRITE})
}

async function getElectionsEditPixel(url_req){
    let election = {}, count=0;
    for (let i = 0; i < urls.length; i++) {
        try{
            let info = await axios.get(urls[i]+"/vow")
            election[info.data.word] = (election[info.data.word] || 0) + 1;
            count++;
        } catch(error){ }
    }
    return [election, count];
}

app.post('/checkTask', upload.single('task'), (req, res) => {
    //req.file.path=> path donde se guada
    let task = homeworks.reverse().find(x=>x.who == req.body.url)
    let word = task.word, times = task.times, line, numberWords = 0
    let lrs = new LineReaderSync(req.file.path)
    while((line=lrs.readline())!= null) {
        if(line == word)  numberWords++;
    }
    fs.unlinkSync(req.file.path)
    res.send({response:numberWords == times})
})


app.get('/vow', (req, res) => {
    let indexWord = Math.floor(Math.random() * (words.length));
    res.send({word:words[indexWord]});
})

app.post('/task', upload.single('task'), async (req,res)=>{
    //req.file.path=> path donde se guada    req.body.url => server de donde viene
    res.sendStatus(200)
    let checkTask = {};
    let filter = urls.filter(x=> req.body.url != x)
    let response = 0;
    for (let i = 0; i < filter.length; i++) {
        var formData = new FormData()
        formData.append('url', String(req.body.url))
        formData.append('task', fs.createReadStream(req.file.path));
        axios.post(`${filter[i]}/checkTask`, formData, { headers: formData.getHeaders() })
            .then(data => {
                checkTask[data.response] = (checkTask[data.response] || 0) + 1
                response++;
            })
            .catch((error)=>  console.log('no'))        
    }
    while(response != urls.length-1) continue       // sleppp
    // pixelRegister(checkTask, req.body.url)
})

function pixelRegister(result, url){
    let maxKey = Object.keys(result).reduce((a, b) => result[a] > result[b] ? a : b ); 
    if(maxKey) {
        let cod = [];
        urls.forEach(x=> {
            axios.get(x+'/code')
                .then(data => cod.push(data.code) )
                .catch((error)=> console.log(error))
        })
        cod = cod.join('-')
        let task = homeworks.reverse().find(x=> url == x.who)
        image[task.pixel.x][task.pixel.y] = {cod: cod, color: task.color }
        urls.filter(x=> x != myUrl).forEach(x=>{
            axios.post(x + '/savePixel', {url: url, cod: cod} )
                    .then()
                    .catch()
        })
    } 
    axios.post(url + '/response', {response: maxKey}).then().catch()
}


http.listen(port, async () => {
    console.log('Server listening on port ', port);
    if (!fs.existsSync(path.join(__dirname,'/task'))) {
        fs.mkdirSync(path.join(__dirname,'/task'))
    }
});