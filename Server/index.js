const express = require('express')
const axios = require('axios')
const fs = require('fs');
const urlLeader = "http://172.17.0.1:4000"


var app = express()
var port = process.env.PORT
const myUrl = "http://172.17.0.1:"+port
var image = [];
var homeworks = [];

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
    for (let i = 0; i < info.times; i++) {
        fs.appendFileSync("./prueba.txt", `${word}\n`);
    }
    //ENVIAR AL LIDER EL FILE para que el lider se lo envie a todos (menos a mi) para validar que se hizo la tarea
    //ESE POST ESTA SIN HACER
}

app.post('/saveTask', (req, res) => {
    homeworks.push(req.body);
    res.sendStatus(200);
})

http.listen(port, async () => {
    console.log('Server listening on port ', port);
});