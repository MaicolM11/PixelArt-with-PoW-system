const route = require('express').Router()
const upload = require('./multer')
const urls = ["http://172.17.0.1:3000", "http://172.17.0.1:3001", "http://172.17.0.1:3002", "http://172.17.0.1:3003"];
const TIMES_WRITE = 20;
const axios = require('axios')
const FormData = require('form-data');
const fs = require('fs')
const logger = require('./logger')


route.post('/editPixel', async (req, res) => {
    logger.info(`Recibe solicitud por parte de ${req.body.url} para pintar un pixel en (${req.body.pixel.x},${req.body.pixel.y}) con color ${req.body.color}`)
    let consensus = false, maxKey
    logger.info(`Inicia el concenso para asignar tarea`)
    while (!consensus) {
        let info = await getElectionsEditPixel(req.body.url)
        let votes = info[0]
        logger.info(`Se reunen todos los votos de los servidores así: ${votes}`)
        console.log('VOTES', votes);
        maxKey = Object.keys(votes).reduce((a, b) => votes[a] > votes[b] ? a : b);
        consensus = votes[maxKey] > info[1] / 2;
    }
    logger.info(`Se llega a un concenso para escribir la palabra ${maxKey}`)
    assignTask(maxKey, req.body, res);
})

async function getElectionsEditPixel(url_req) {
    let election = {}, count = 0;
    logger.info(`Solicita a todas las instancias el voto para la palabra`)
    for (let i = 0; i < urls.length; i++) {
        if(urls[i] == url_req) continue
        try {
            let info = await axios.get(urls[i] + "/vow")
            logger.info(`${urls[i]} vota por la palabra ${info.data.word}`)
            election[info.data.word] = (election[info.data.word] || 0) + 1;
            count++;
        } catch (error) { console.log(error)}
    }
    return [election, count];
}

// Enviar la tarea a los participantes
route.post('/task', upload.single('task'), (req, res) => {
    logger.info(`Recibe la tarea de ${req.body.url}`)
    res.sendStatus(200)
    let consensus = {}, response = 0;
    logger.info(`Envia la tarea a todas las instancias para revisarla`)
    urls.filter(x => req.body.url != x).forEach(x => {
        var formData = new FormData()
        formData.append('url', String(req.body.url))
        formData.append('task', fs.createReadStream(req.file.path));
        axios.post(`${x}/checkTask`, formData, { headers: formData.getHeaders() })
            .then(info => {
                consensus[info.data.response] = (consensus[info.data.response] || 0) + 1
                response++;
                logger.info(`${x} responde ${info.data.response}`)
                if (response == urls.length - 1) pixelRegister(consensus, req.body.url)
            }).catch((error) => console.log('Error to send file', error))
    })
})

async function pixelRegister(result, url) {
    logger.info(`Votacion PoW, ${result}`);
    let maxKey = Object.keys(result).reduce((a, b) => result[a] > result[b] ? a : b);
    var accept = maxKey && result[false] != result[maxKey]
    if (accept) {
        var codes = []
        logger.info(`Solicita código para guardar la imagen a cada instancia`)
        for (let i = 0; i < urls.length; i++) {
            let res = await axios.get(urls[i] + '/code')
            logger.info(`${urls[i]} responde con el código ${code}`)
            codes.push(res.data.code)
        }
        codes = codes.join('-')
        logger.info(`Envia a todas las instancias el pixel que se debe guardar`)
        urls.forEach(x => axios.post(x + '/savePixel', { url: url, cod: codes }))
    }
    axios.post(url + '/response', { response: accept })
}

route.post('/validate', upload.single('file'), (req, res) => {
    logger.info(`Se recibe el archivo de ${req.body.url} para validar`)
    let consensus = {}, response = 0
    logger.info(`Se envia el archivo a todas las instancias para que lo validen`)
    urls.filter(x => x != req.body.url).forEach(x => {
        var formData = new FormData()
        formData.append('file', fs.createReadStream(req.file.path));
        axios.post(x + '/validateCertificate', formData, { headers: formData.getHeaders() })
            .then(() => {
                consensus[info.data.response] = (consensus[info.data.response] || 0) + 1
                response++;
                if (response == urls.length - 1)
                    logger.info(`Se obtiene un consenso asi: ${consensus}`)
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
        color: info.color
    }
    logger.info(`Envia a las instancias la tarea asignada: ${task}`)
    urls.forEach(url => axios.post(url + "/saveTask", task));
    logger.info(`Responde con la tarea asignada: ${{ word: word, times: TIMES_WRITE }}`)
    res.send({ word: word, times: TIMES_WRITE })
}
module.exports = route