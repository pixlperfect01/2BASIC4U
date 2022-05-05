process.argv.splice(1, 1);
var argv = process.argv;
const fs = require("fs");
const sm = require("./string-math");
const rl = require('readline-sync');
const compilationError = function(cmd, given, expected, line, data){
    var e = "COMPILATION ERROR ON LINE "+line;
    e += "\nGIVEN: " + given;
    e += "\nEXPECTED: " + expected;
    e += "\n" + data;
    console.error(e);
    process.exit(1);
}

const parseArg = function(a, info){
    if(a.charAt(0) == "\"" || a.charAt(0) == "'"){
        if(a.charAt(a.length-1) == a.charAt(0)){
            return a;
        } else {
            compilationError(info.cmd, info.cmd+" " + info.args.join(""), "REPLACE", curLine, "");
        }
    } else {
        a = replaceVars(a, prgm.globalVars);
        if(isNum(a)){
            return sm(a);
        } else {
            return a;
        }
   }
}

// var x11 = require('x11');

// var Exposure = x11.eventMask.Exposure;
// var PointerMotion = x11.eventMask.PointerMotion;

// x11.createClient(function(err, display) {
//   if (!err) {
//     var X = display.client;
//     var root = display.screen[0].root;
//     var wid = X.AllocID();
//     X.CreateWindow(
//       wid,
//       root, // new window id, parent
//       0,
//       0,
//       500,
//       500, // x, y, w, h
//       0,
//       0,
//       0,
//       0, // border, depth, class, visual
//       { eventMask: Exposure | PointerMotion } // other parameters
//     );
//     X.MapWindow(wid);
//     var gc = X.AllocID();
//     X.CreateGC(gc, wid);
//     var white = display.screen[0].white_pixel;
//     var black = display.screen[0].black_pixel;
//     cidBlack = X.AllocID();
//     cidWhite = X.AllocID();
//     X.CreateGC(cidBlack, wid, { foreground: black, background: white });
//     X.CreateGC(cidWhite, wid, { foreground: white, background: black });
//     X.on('event', function(ev) {
//       if (ev.type == 12) {
//         X.PolyFillRectangle(wid, cidWhite, [0, 0, 500, 500]);
//         X.PolyText8(wid, cidBlack, 50, 50, ['Hello, Node.JS!']);
//       }
//     });
//     X.on('error', function(e) {
//       console.log(e);
//     });
//   } else {
//     console.log(err);
//   }
// });




let script = fs.readFileSync(argv[1], 'utf-8');

let lines = script.split("\n");

// console.log(JSON.stringify(lines, null, 4));

function set(obj, path, value) {
    var schema = obj;  // a moving reference to internal objects within obj
    var pList = path.split('.');
    var len = pList.length;
    for(var i = 0; i < len-1; i++) {
        var elem = pList[i];
        if( !schema[elem] ) schema[elem] = {};
        schema = schema[elem];
    }

    schema[pList[len-1]] = value;
}


let tree = [];
function makeGroupings(s, typ){
    var out = typ=="{"?{}:[];
    function countClose(s, a, d){
        var tm = 0;
        var st = [];
        var i;
        var a1 = "";
        for(i = a; i < s.length; i++){
            if(s[i] == d){
                if(st.length == 0 || tm == 0){
                    return [i, a1];
                }
            }
            if("{[".split("").some(v => s[i].includes(v))){
                if(st == []){
                    a1 = s[i];
                }
                st.push(s[i]);
                tm++;
            }
            
            if("}]".split("").some(v => {return s[i].includes(v) && st[st.length-1] == "{" ? s[i] == "}" : s[i] == "]"})){
                st.pop();
                tm--;
            }
            
        }
        if(st.length != 0 || tm != 0){
            console.log(st, tm);
            throw "Invalid JSON!";
        }
        return [i, a1];
    }
    function isJson(s){
        var p = false;
        for(var i = 0; i < s.length; i++){
            if(s[i] == "\""){
                p ? s[i-1] != "\\" ? p = !p : p = p : p = true;
            }
            if("{[".split("").some(v => s[i].includes(v))){
                if(!p){
                    return true;
                }
            }
        }
        return false;
    }
    if(typ != "["){
        while(s != ""){
            if(s.charAt(0)==","){
                s = s.substr(1, s.length);
            }
            var v = s.split(":");
            var k = v.shift().trim();
            v = v.join(":").trim();
            var endOfVal = countClose(v, 0, ",")[0]+1;
            var typ1 =  v.substr(0, endOfVal).charAt(0);
            if(isJson(v.substr(0, endOfVal))){
                if(typ == "[")
                    out.push(parseJson(v.substr(0, endOfVal), typ1));
                else 
                    out[k] = parseJson(v.substr(0, endOfVal), typ1);
            } else {
                if(typ == "["){
                    out.push(v.substr(0, endOfVal));
                }
                else
                    out[k] = v.substr(0, endOfVal-1);
            }
            s = s.substr(endOfVal+2, s.length-1);
        }
    } else {
        while(s != ""){
            var d = countClose(s, 1, ",")[0];
            if(isJson(s.substr(0, d))){
                out.push(parseJson(s.substr(0, d), countClose(s, 0, ",")[1]));
            } else {
                out.push(s.substr(0, d));
            }
            s = s.substr(d+1, s.length-1);
        }
    }

    return out
}

function parseJson(j, t){
    var j1 = j;
    j = j.substr(1, j.length-2).trim();
    var o = makeGroupings(j, t||j1.charAt(0));
    return o;
}

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
lines = t;

lines = lines.filter((e)=>{
    return e.charAt(0) != "#"
});

function customTrim(s){
    var o = s.split("");
    for(var i = o.length-1; i >= 0; i--){
        var l = null, r = null;
        if(i != o.length-1){
            r = o[i+1];
        }
        if(i != 0){
            l = o[i-1];
        }
        if(o[i] == " "){
            if(r == " " || l == " "){
                o.splice(i, 1);
            }
        }
    }
    return o.join("");
}

var outFileData = "";

function splitWithQuotes(s, d){
    var o = [""];
    var p = false;
    s.split("").forEach((e, i)=>{
        if(e=="\""){
            if(!(s.charAt(i-1)=="\\")){
                p = !p;
                o[o.length-1] += e;
            } else {
                o[o.length-1] += e;
            }
        } else if(e == d){
            if(!p){
                o.push("");
            } else {
                o[o.length-1] += e; 
            }
        } else {
            o[o.length-1] += e;
        }
    });
    return o;
}
function splitWithQuotes1(s, d){
    var o = [""];
    var p = false;
    s.split("").forEach((e, i)=>{
        if(e=="\""){
            if(!(s.charAt(i-1)=="\\")){
                p = !p;
                o[o.length-1] += e;
            } else {
                o[o.length-1] += e;
            }
        } else if(e == d[0] || e == d[1]){
            if(!p){
                o.push("");
            } else {
                o[o.length-1] += e; 
            }
        } else {
            o[o.length-1] += e;
        }
    });
    return o;
}

lines.forEach((e, i)=>{
    var p1 = splitWithQuotes(e, " ");
    var params = splitWithQuotes1(e, " ,".split(""));
    p1.shift();
    p1 = p1.join(" ").split(/[,]/);
    p1.shift();
    p1 = p1.join(",").trim();
    params = params.filter((e1)=>{
        return e1 != "";
    });
    var command = params.shift();
    var args;
    switch(command){
        case 'set':
            if(!"{[".split("").some(v => p1.includes(v))){
                args = params;
            } else {
                args = [params[0]];
                args.push(parseJson(p1));
                
            }
            break;
        case 'push':
            if(!"{[".split("").some(v => p1.includes(v))){
                args = params;
            } else {
                args = [params[0]];
                args.push(parseJson(p1));
                
            }
            break;
        case 'prop':
            var t = p1.split(",");
            var tm = t.shift();
            t = t.join(",").trim();
            if(!"{[".split("").some(v => t.includes(v))){
                args = params;
            } else {
                args = [params[0]];
                args.push(tm);
                args.push(parseJson(t));
                
            }
            break;
        default:
            args = params;
    }

    tree.push({
        cmd: command,
        args: args
    });
});

var operators = ["+","-","*","/"];

function replaceVars(s, v){
    
    for(var i = 0; i < Object.keys(v).length; i++){
        var a = Object.keys(v)[i];
        s = s.replaceAll(a, v[a]+"");
    }
    return s;
}

// console.dir(tree, {depth: null});
var prgm = {};
prgm.globalVars = {};
prgm.labels = {
    "$end": tree.length+1
};
function isNum(v){
    try{
        v = sm(v);
        return true;
    } catch {
        return false;
    }
}
// console.log(tree);
// console.log("\n\n\n\n\n\n");
var curLine;
for(curLine = 0; curLine < tree.length; curLine++){
    var e = tree[curLine];
    var i = curLine;
    var arr = tree;
    switch(e.cmd){
        case 'set':
            // console.log(e.args);
            var v = e.args[1];
            if(e.args.length>2){
                v = JSON.parse(JSON.stringify(e.args))
                v.shift();
                v = v.filter((e) => {
                    return !operators.some(v1 => e.includes(v1))
                });
                var v1 = v;
                v.forEach((e, i) => {
                    if(prgm.globalVars[e]!=undefined){
                        v1[i] = prgm.globalVars[e];
                    }
                });
                // console.log(v1);
                v = v1.join("");
                prgm.globalVars[e.args[0]] = v;
            } else if("\"'".split("").some(v1 => v.includes(v1))){
                prgm.globalVars[e.args[0]] = v;
            } else if(prgm.globalVars[v]!=undefined){
                prgm.globalVars[e.args[0]] = prgm.globalVars[v];;
            } else if(typeof v == "string"){
                    if(operators.some(v1 => v.includes(v1))){
                        if("qwertyuiopasdfghjklzxcvbnm".split("").some(v1 => v.includes(v1))){
                            v = replaceVars(v, prgm.globalVars);
                        }
                        v = sm(v);
                    }
                prgm.globalVars[e.args[0]] = v;
            } else {
                prgm.globalVars[e.args[0]] = v;
            }
            break;
        case 'echo':
            e.args.forEach((e1)=>{
                var v = e1;
                var r = "";
                var tmp = splitWithQuotes(v, "+");
                tmp.forEach((e4)=>{
                    var e2 = e4;
    
                    // console.log(e2);
                    if("\"'".split("").some(v1 => e2.includes(v1))){
                        e2 = e2.replaceAll(/[\'\"]/g, '');
                        // console.log(0);
                    } else if("qwertyuiopasdfghjklzxcvbnm".split("").some(v1 => e2.includes(v1))){
                        e2 = replaceVars(e2, prgm.globalVars);
                        var r1 = "";
                        var e3 = e2;
                        if(isNum(e3)){
                            r1 += sm(e3);
                        } else {
                            r1 += e3;
                        }
                        e2 = r1;
                        if(!("\"'".split("").some(v1 => e2.includes(v1)))){
                            if(operators.some(v1 => e2.includes(v1))){
                                e2 = sm(e2);
                            }
                        }
                    }
                    r += e2;
                });
                v = r;
                if("\"'".split("").some(v1 => v.includes(v1))){
                    v = v.replaceAll(/[\'\"]/g, '');
                }
                if(typeof prgm.globalVars[e1] === "object")
                    v = JSON.stringify(prgm.globalVars[e1], null, 4);
                process.stdout.write(v+" ");
            });
            console.log();
            break;
        case 'goto':
            var l = e.args[0];
            if(l.charAt(0) == "$"){
                l = prgm.labels[l];
            } else if(operators.some(v => l.includes(v))){
                if("qwertyuiopasdfghjklzxcvbnm".split("").some(v => l.includes(v))){
                    l = replaceVars(l, prgm.globalVars);
                }
                l = sm(l);
            }
            curLine = l-2;
            break;
        case 'equ':
            var vA = e.args[0];
            var vB = e.args[1];
            if(prgm.globalVars[vA]!=undefined){
                vA = prgm.globalVars[vA];;
            } else {
                var v = vA;
                if(typeof v == "string"){
                    if("\"'".split("").some(v1 => v.includes(v1))){
                        v = v.replaceAll(/[\'\"]/g, '');
                    } else if("qwertyuiopasdfghjklzxcvbnm".split("").some(v1 => v.includes(v1))){
                        v = replaceVars(v, prgm.globalVars);
                    }
                }
            }
            if(prgm.globalVars[vB]!=undefined){
                vB = prgm.globalVars[vB];
            } else {
                v = vB;
                if(typeof v == "string"){
                    if("\"'".split("").some(v1 => v.includes(v1))){
                        v = v.replaceAll(/[\'\"]/g, '');
                    } else if("qwertyuiopasdfghjklzxcvbnm".split("").some(v1 => v.includes(v1))){
                        v = replaceVars(v, prgm.globalVars);
                        if(operators.some(v1 => v.includes(v1))){
                            v = sm(v);
                        }
                    }
                }
                vB = v;
            }
            if(vA != vB){
                curLine++;
            }
            break;
        case 'rdln':
            var r = null;
            r = rl.question(e.args[1]);
            prgm.globalVars[e.args[0]] = r;
            break;
        case 'push':
            var v = e.args[1];
            if(e.args.length>2){
                v = JSON.parse(JSON.stringify(e.args));
                v.shift();
                v = v.filter((e) => {
                    return !operators.some(v1 => e.includes(v1))
                });
                var v1 = v;
                v.forEach((e, i) => {
                    if(prgm.globalVars[e]!=undefined){
                        v1[i] = prgm.globalVars[e];
                    }
                });
                console.log(v1);
                v = v1.join("");
            } else if(prgm.globalVars[v]!=undefined){
                v = prgm.globalVars[v];;
            } else if(typeof v == "string"){
                if(operators.some(v1 => v.includes(v1))){
                    if("qwertyuiopasdfghjklzxcvbnm".split("").some(v1 => v.includes(v1))){
                        v = replaceVars(v, prgm.globalVars);
                    }
                    v = sm(v);
                }
            }
            prgm.globalVars[e.args[0]].push(JSON.parse(JSON.stringify(v)));
            break;
        case 'prop':
            var a = JSON.parse(JSON.stringify(e.args));
            var v1 = a.shift();
            var v3 = a.pop();
            var v2 = a.join(".");
            set(prgm.globalVars[v1], v2, v3);
            break;
        case 'lbl':
            prgm.labels["$"+e.args[0]] = curLine+1;
            break;
        case 'del':
            delete prgm.globalVars[e.args[0]];
            break;
        case 'exec':
            var f = e.args[0];
            if(e.args.length>0){
                f = parseArg(f);
                var tmp = require("./modules/"+f);
                if(e.args.length > 1){
                    if(e.args.length > 2){
                        var tmp2 = JSON.parse(JSON.stringify(e.args));
                        tmp2.pop();
                        tmp2.shift();
                        prgm.globalVars[e.args[e.args.length-1]] = tmp.runToCompletion(...tmp2);
                    } else {
                        var tmp1 = tmp.runToCompletion();
                    }
                } else {
                    var tmp1 = tmp.runToCompletion();
                }
            } else {
                compilationError(e.cmd, lines[curLine], " REPLACE", curLine, "(You need to specify a module to execute!)");
            }
            break;
        case 'ret':
            process.exit(parseArg(e.args[0]));
            break;
    }
}

// console.dir(tree, {depth: null});
                    
// console.log("\n\n\nProgram Data: "+JSON.stringify(prgm, null, 4));