// Multer config
const multer = require('multer');
const path = require('path');

var storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '/task')),
    filename: (req, file, cb) => {
        var ext = file.originalname.split('.')
        cb(null, `${Date.now()}.${ext[ext.length - 1]}`)
    }
})

var upload = multer({ storage: storage })

module.exports = upload