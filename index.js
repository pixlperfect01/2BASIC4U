process.argv.splice(1, 1);
var argv = process.argv;
const fs = require("fs");
const sm = require("./string-math");

let script = fs.readFileSync(argv[1], 'utf-8');

let lines = script.split("\n");

let tree = [];

let t = [];
let t1 = "";
lines.forEach((e)=>{
    if(e.charAt(e.length-1)=="\\"){
        t1 += e.substr(0, e.length-1)+" ";
    } else if(t1!=""){
        t.push(t1+e);
        t1 = "";
    } else {
        t.push(e);
    }
});
console.log(t);
lines = t;

var outFileData = "";

lines.forEach((e, i)=>{
    params = e.split(/[. ,]/);
    params = params.filter((e1)=>{
        return e1 != "";
    });
    command = params.shift();
    args = params;
    console.log(command, args);
    tree.push({
        cmd: command,
        args: args
    });
});

var operators = ["+","-","*","/"];
tree1 = [];
tree.forEach((e) => {
    var a = e.args;
    tree1.push(e);
    a.forEach((e1, i1) => {
        if(operators.some(v => e1.includes(v))){
            tree1[tree1.length-1].args[i1] = sm(e1)+"";
        }
    });
});

tree = tree1;
console.log(tree);