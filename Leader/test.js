/*const fs = require('fs')
const election = {
    "word" : 1,
    "io" : 2,
    "ss":2,
    "sds":1
}

let a = Date.now();
for (let index = 0; index < 170000; index++) {
    fs.appendFileSync("./prueba.txt", "hola\n");
}
let b = Date.now();
let time = b-a;
*/

let result = {false: 12, true:12}
let maxKey = Object.keys(result).reduce((a, b) => result[a] > result[b] ? a : b );
let cod = []
cod.push(2)
if(maxKey && result[false] != result[maxKey]) {
    console.log("se registra", cod);
} else{
    console.log("se registra", cod);
}