const route = require('express').Router()
const upload = require('./multer')
const urls = ["http://172.17.0.1:3000", "http://172.17.0.1:3001", "http://172.17.0.1:3002", "http://172.17.0.1:3003"];
const TIMES_WRITE = 20;
const axios = require('axios')
const FormData = require('form-data');
const fs = require('fs')
const logger = require('./logger')


route.post('/editPixel', async (req, res) => {
    logger.info(`[LEADER] Recibe solicitud por parte de ${req.body.url} para pintar un pixel en (${req.body.cell.x},${req.body.cell.y}) con color ${req.body.color}`)
    let consensus = false, maxKey
    logger.info(`[LEADER] Inicia el concenso solicitando la palabra para asignar tarea`)
    while (!consensus) {
        let votes = await getElectionsEditPixel(req.body.url)
        logger.info(`[LEADER] Se reunen todos los votos de los servidores así: ${JSON.stringify(votes)}`)
        maxKey = Object.keys(votes).reduce((a, b) => votes[a] > votes[b] ? a : b);
        consensus = votes[maxKey] > (urls.length - 1) / 2;
    }
    assignTask(maxKey, req.body, res);
})

async function getElectionsEditPixel(url_req) {
    let election = {};
    for (let i = 0; i < urls.length; i++) {
        if (urls[i] == url_req) continue
        try {
            let info = await axios.get(urls[i] + "/vow")
            logger.info(`[LEADER] ${urls[i]} vota por la palabra ${info.data.word}`)
            election[info.data.word] = (election[info.data.word] || 0) + 1;
        } catch (error) { }
    }
    return election;
}

// Enviar la tarea a los participantes
route.post('/task', upload.single('task'), (req, res) => {
    logger.info(`[LEADER] Recibe la tarea de ${req.body.url}`)
    res.sendStatus(200)
    let consensus = {}, response = 0;
    logger.info(`[LEADER] Envia la tarea a todas las instancias para revisarla`)
    urls.filter(x => req.body.url != x).forEach(x => {
        var formData = new FormData()
        formData.append('url', String(req.body.url))
        formData.append('task', fs.createReadStream(req.file.path));
        axios.post(`${x}/checkTask`, formData, { headers: formData.getHeaders() })
            .then(info => {
                consensus[info.data.response] = (consensus[info.data.response] || 0) + 1
                response++;
                logger.info(`[LEADER] ${x} responde ${info.data.response}`)
                if (response == urls.length - 1) pixelRegister(consensus, req.body.url)
            }).catch((error) => { })
    })
})

async function pixelRegister(result, url) {
    logger.info(`[LEADER] Votacion PoW, ${JSON.stringify(result)}`);
    let maxKey = Object.keys(result).reduce((a, b) => result[a] > result[b] ? a : b);
    var accept = maxKey && result[false] != result[maxKey]
    if (accept) {
        var codes = []
        for (let i = 0; i < urls.length; i++) {
            let res = await axios.get(urls[i] + '/code')
            codes.push(res.data.code)
        }
        codes = codes.join('-')
        logger.info(`[LEADER] El código del pixel es ${codes}, se le envia a las instancias.`)
        urls.forEach(x => axios.post(x + '/savePixel', { url: url, cod: codes }))
    }
    axios.post(url + '/response', { response: accept })
}

route.post('/validate', upload.single('file'), (req, res) => {
    logger.info(`[LEADER] Se recibe el archivo de ${req.body.url} para validar y lo envia a las instancias`)
    let consensus = {}, response = 0
    urls.filter(x => x != req.body.url).forEach(x => {
        let formData = new FormData()
        formData.append('file', fs.createReadStream(req.file.path));
        axios.post(x + '/validateCertificate', formData, { headers: formData.getHeaders() })
            .then((info) => {
                consensus[info.data.response] = (consensus[info.data.response] || 0) + 1
                response++;
                if (response == urls.length - 1) {
                    logger.info(`[LEADER] Se obtiene un consenso asi: ${JSON.stringify(consensus)}`)
                    let resp = consensus[true] > consensus[false];
                    res.send({ valid: resp })
                }
            })
            .catch(() => { });
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
    logger.info(`[LEADER] Envia a las instancias la tarea asignada`)
    urls.forEach(url => axios.post(url + "/saveTask", task));
    res.send({ word: word, times: TIMES_WRITE })
}
module.exports = route