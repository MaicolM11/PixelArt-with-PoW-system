const path = require('path');
const htmlWebpack = require('html-webpack-plugin');

module.exports={
    entry:'./src/client.js',
    output:{
        path: path.join(__dirname,'public'),
        filename: 'bundle.js'
    },
    module:{
        rules:[
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use:['babel-loader']
            }
        ]
    },
    plugins:[
        new htmlWebpack({
            template:'./src/index.html'
        })
    ]
}