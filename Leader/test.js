const fs = require('fs')
const election = {
    "word" : 1,
    "io" : 2,
    "ss":2,
    "sds":1
}

let a = Date.now();
for (let index = 0; index < 19000; index++) {
    fs.appendFileSync("./prueba.txt", "hola\n");
}
let b = Date.now();
let time = b-a;

console.log(time);