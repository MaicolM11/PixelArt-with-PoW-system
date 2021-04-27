  
const path = require('path')

const { createLogger, format, transports } = require('winston')


var logger = createLogger({
    transports: [
        new transports.File({
            filename: path.join(__dirname, "logs/information.log"),
            format: format.combine(format.simple(), format.timestamp(), format.printf(info => `[${info.level.toUpperCase()}](${info.timestamp}): ${info.message}`))
        })
    ]
})

module.exports= logger;