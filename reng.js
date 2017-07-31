// oollyfills
Array.from||(Array.from=function(){var r=Object.prototype.toString,n=function(n){return"function"==typeof n||"[object Function]"===r.call(n)},t=function(r){var n=Number(r);return isNaN(n)?0:0!==n&&isFinite(n)?(n>0?1:-1)*Math.floor(Math.abs(n)):n},e=Math.pow(2,53)-1,o=function(r){var n=t(r);return Math.min(Math.max(n,0),e)};return function(r){var t=this,e=Object(r);if(null==r)throw new TypeError("Array.from requires an array-like object - not null or undefined");var a,u=arguments.length>1?arguments[1]:void 0;if("undefined"!=typeof u){if(!n(u))throw new TypeError("Array.from: when provided, the second argument must be a function");arguments.length>2&&(a=arguments[2])}for(var i,f=o(e.length),c=n(t)?Object(new t(f)):new Array(f),h=0;f>h;)i=e[h],u?c[h]="undefined"==typeof a?u(i,h):u.call(a,i,h):c[h]=i,h+=1;return c.length=f,c}}());

// check if has DOM
var hasDOM = typeof document !== "undefined";

function ord(c) {
    return String.fromCharCode(c);
}

// some algorithms
function sep(s, n) {
    var r = [];
    for (var i = 0; i < n; i++) {
        for (var j = i; j < s.length; j += n) {
            r.push(s[j]);
        }
    }
    return r;
}

function zip(s, n) {
    var r = [],
        g = [];
    for (var i = 0, d = s.length / n; i < s.length; i += d) {
        r.push(s.slice(i, i + d));
    }
    var m = r.reduce(function(p, c) {
        return Math.max(p, c.length)
    }, 0);
    for (var j = 0; j < m; j++) {
        for (var i = 0; i < n; i++) {
            var e = r[i][j];
            if (typeof e !== "undefined") g.push(e);
        }
    }
    return g;
}

function upload() {
    if(hasDOM){
        var fr = new FileReader();
        fr.onload = function() {
            document.getElementById("code").value = fr.result
        };
        fr.readAsBinaryString(document.getElementById("upload").files[0]);
    }
}
function readFile(name, encoding){
    encoding = encoding || "utf8";
    return fs.readFileSync(name, encoding);
}
function Reng(code) {
    this.code = code.split("\n").map(function(e) {
        return e.split("");
    });
    this.input = [];
    this.input.shift = function() {
        var a = this[0];
        if (typeof a !== "undefined") {
            this.splice(0, 1);
            return a;
        } else return -1;
    }
    this.pos = {
        x: 0,
        y: 0
    };
    this.dir = {
        x: 1,
        y: 0
    };
    this.delay = 0;
    this.internal = {};
    this.depth = 1;
    this.mode = 1;
    this.ops = {};
    for (i in Reng.ops) {
        this.ops[i] = Reng.ops[i];
    }
    this.funcs = {
        "RAND": function(R) {
            R.stack.push(Math.random())
        },
        "TIME": function(R) {
            R.stack.push(+new Date())
        },
        "RANGE": function(R) {
            var b = R.stack.pop(),
                a = R.stack.pop();
            while (--b) R.stack.push(a++);
        },
        "SAVE": function(R) {
            var index = R.stack.pop();
            R.internal[index] = R.stack;
            R.stack = [];
        },
        "REST": function(R) {
            var retr = R.internal[R.stack.pop()];
            R.parentStacks.push(R.stack);
            R.stack = retr;
        },
        "DATE": function(R) {
            R.stack.push(new Date);
        },
        "CLEAR": function(R) {
            if(hasDOM) {
                document.getElementById("o").innerHTML = "";
            } else {
                // \e == escape
                process.stdout.write("\033c");
            }
        },
        "ENC": function(R) {

        },
        "DEC": function(R) {

        }
    }
    this.running = true;
    this.buildFunc = "";
    this.parentStacks = [];
    this.stack = []; // ugh another stack ;_;
    // popping off of empty stack yields 0
    this.defaultPop = 0;
    this.stack.pop = function(otherVal) {
        var val = this[this.length - 1];
        if (typeof val === "undefined") val = otherVal || 0;
        else this.splice(-1, 1);
        return val;
    }
    this.maxLen = this.code.reduce(function(x, y) {
        return Math.max(y.length, x);
    }, "");
    this.code = this.code.map(function(e) {
        while (e.length < this.maxLen) e.push(" ");
        return e;
    }.bind(this));
}
Reng.dirChange = function(nx, ny) {
    return function(R) {
        R.dir = {
            x: nx,
            y: ny
        }
    }
}
Reng.nullary = function(f) {
    return function(R) {
        var Q = f(R);
        if (typeof Q !== "undefined") R.stack.push(Q);
    }
}
Reng.nullaryC = function(f) {
    return function(R) {
        R.stack = R.stack.concat(f(R, R.stack.pop(R.defaultPop)));
    }
}
Reng.dropUse = function(f) {
    return function(R) {
        (f || function() {})(R, R.stack.pop(R.defaultPop));
    }
}
Reng.unary = function(f, g) {
    return function(R) {
        var val = R.stack.pop(R.defaultPop);
        var res = (val instanceof Reng.lambda ? g : f)(R, val);
        if (typeof res !== "undefined") R.stack.push(res);
    }
}
Reng.binary = function(f, g) {
    return function(R) {

        var top = R.stack.pop(),
            sec = R.stack.pop(R.defaultPop);
        top = typeof top === "undefined" ? R.defaultPop : top;
        sec = typeof sec === "undefined" ? R.defaultPop : sec;
        var res = (sec instanceof Reng.lambda ? g : f)(R, sec, top);
        if (typeof res !== "undefined") R.stack.push(res);
    }
}
Reng.ternary = function(f, g) {
    return function(R) {
        var top = R.stack.pop(R.defaultPop),
            sec = R.stack.pop(R.defaultPop),
            thi = R.stack.pop(R.defaultPop);
        R.stack.push(f(R, sec, top, thi));
    }
}
Reng.constant = function(v) {
    return function(R) {
        R.stack.push(v);
    }
}
Reng.mode = function(m) {
    return function(R) {
        R.mode = m;
    }
}
Reng.lambda = function(code) {
    this.body = code;
}
Reng.lambda.prototype.toString = function() {
    return "{" + this.body + "}";
}
Reng.lambda.prototype.exec = function(R) {
    for (var i = 0; i < this.body.length; i++) {
        R.exec(this.body[i]);
        if (!R.running) break;
    }
}
var output = hasDOM ? function(string) {
    o.innerHTML += string;
} : function(string) {
    process.stdout.write(string.toString());
}
Reng.ops = {
    // directional pointers
    ">": Reng.dirChange(1, 0),
    "<": Reng.dirChange(-1, 0),
    "^": Reng.dirChange(0, -1),
    "v": Reng.dirChange(0, 1),
    // mirrors
    "\\": function(R) {
        R.dir = {
            x: R.dir.y,
            y: R.dir.x
        };
    },
    "/": function(R) {
        R.dir = {
            x: -R.dir.y,
            y: -R.dir.x
        };
    },
    "|": function(R) {
        R.dir.x = -R.dir.x
    },
    "_": function(R) {
        R.dir.y = -R.dir.y
    },
    "@": function(R) {
        R.dir.x = -R.dir.x;
        R.dir.y = -R.dir.y;
    },
    // unconditional jump
    "!": function(R) {
        R.advance();
    },
    // unconditional multi-jump
    ".": function(R) {
        var g = R.stack.pop(R.defaultPop);
        while (g-- > 0) {
            R.advance()
        }
    },
    // skip if true, peek
    "?": function(R) {
        var c = R.stack.pop(R.defaultPop);
        if (c) R.advance();
        R.stack.push(c)
    },
    // duplicate
    ":": Reng.nullaryC(function(R, v) {
        return [v, v]
    }),
    // jump if false, mirror if true
    ";": function(R) {
        if (R.stack[R.stack.length - 1]) Reng.ops["|"](R);
    },
    // jump if input stack length, mirror else
    "í": function(R) {
        if (R.input.length) Reng.ops["|"](R);
        if (R.stack[R.stack.length - 1] === -1) R.stack.pop()
    },
    // pop N (top) and M (sTop): jump M units if N, otherwise, advance
    "¿": function(R) {
        var N = R.stack.pop(R.defaultPop);
        var M = R.stack.pop(R.defaultPop);
        if (N)
            while (M-- > 0) R.advance();
    },
    // nicely print a number
    "æ": Reng.dropUse(function(R, v) {
        output(v + " ");
    }),
    // print newline
    "ö": function(R) {
        output("\n");
    },
    // duplicate stack
    "¤": function(R) {
        R.stack = R.stack.concat(R.stack);
    },
    // plus or minus
    "±": function(R) {
        var A = R.stack.pop();
        A = typeof A === "undefined" ? R.defaultPop : A;
        var B = R.stack.pop();
        B = typeof B === "undefined" ? R.defaultPop : B;
        R.stack.push(B + A, B - A);
    },
    // jump if stack length = 1, mirror otherwise
    "¡": function(R) {
        if (R.stack.length !== 1) Reng.ops["|"](R);
    },
    // one-way "entrances"
    // right-one-way
    "a": function(R) {
        if (R.dir.x !== 1 || R.dir.y !== 0) Reng.ops["@"](R);
    },
    "b": function(R) {
        if (R.dir.x !== -1 || R.dir.y !== 0) Reng.ops["@"](R);
    },
    "c": function(R) {
        if (R.dir.x !== 0 || R.dir.y !== 1) Reng.ops["@"](R);
    },
    "d": function(R) {
        if (R.dir.x !== 0 || R.dir.y !== -1) Reng.ops["@"](R);
    },
    // equality
    "e": Reng.binary(function(R, a, b) {
        return +(a == b);
    }),
    // get character
    "f": Reng.binary(function(R, a, b) {
        return R.getChar(b, a).charCodeAt();
    }),
    // place character
    "g": function(R) {
        var c = R.stack.pop(R.defaultPop),
            b = R.stack.pop(R.defaultPop),
            a = R.stack.pop(R.defaultPop);
        R.bound(c, b);
        R.code[c][b] = String.fromCharCode(a);
    },
    // jump back N characters (@.@ )
    "h": function(R) {
        Reng.ops["@"](R);
        Reng.ops["."](R);
        R.advance();
        Reng.ops["@"](R);
    },
    // move 1 from input to main stack
    "i": Reng.nullary(function(R) {
        return R.input.shift();
    }),
    // numeric-safe input
    "ï": Reng.nullary(function(R) {
        var ret = R.input.splice(0, 1)[0];
        return ret;
    }),
    // jump
    "j": function(R) {
        var y = R.stack.pop(R.defaultPop),
            x = R.stack.pop(R.defaultPop);
        R.pos.x = x;
        R.pos.y = y;
        R.bound(y, x);
    },
    // push input stack length
    "k": Reng.nullary(function(R) {
        return R.input.length;
    }),
    // push stack length
    "l": Reng.nullary(function(R) {
        return R.stack.length;
    }),
    // push # of parent stacks
    "m": Reng.nullary(function(R) {
        return R.parentStacks.length;
    }),
    // output number
    "n": Reng.dropUse(function(R, v) {
        output(v);
    }),
    // output character
    "o": Reng.dropUse(function(R, v) {
        output(String.fromCharCode(v));
    }),
    // jump if -1, peek
    "p": function(R) {
        var c = R.stack.pop(R.defaultPop);
        if (c === -1) R.advance();
        R.stack.push(c)
    },
    // jump if true, pop (equiv. ?$)
    "q": function(R) {
        var c = R.stack.pop(R.defaultPop);
        if (c) R.advance();
    },
    // reverse stack
    "r": function(R) {
        R.stack.reverse();
    },
    // jump if not -1, peek
    "s": function(R) {
        var c = R.stack.pop(R.defaultPop);
        if (c !== -1) R.advance();
        R.stack.push(c)
    },
    // branch: up if true, down if false
    "t": function(R) {
        var c = R.stack.pop(R.defaultPop);
        if (c) Reng.ops["^"](R);
        else Reng.ops["v"](R);
        R.stack.push(c);
    },
    // branch: up if true, down if false, pop
    "ç": function(R) {
        var c = R.stack.pop(R.defaultPop);
        if (c) Reng.ops["^"](R);
        else Reng.ops["v"](R);
    },
    // pause execution
    "þ": function(R) {
        intervals.forEach(clearInterval);
        intervals = [];
    },
    "u": Reng.unary(function(R, v) {
        return Math.random() * v | 0;
    }),
    // quit program
    "~": function(R) {
        R.running = false;
    },
    // drop
    "$": Reng.dropUse(),
    // operators
    "+": Reng.binary(function(R, a, b) {
        return a + b;
    }),
    "-": Reng.binary(function(R, a, b) {
        return a - b;
    }),
    "*": Reng.binary(function(R, a, b) {
        return a * b;
    }, function(R, a, b) {
        while (b-- > 0) {
            a.exec(R);
        }
        return;
    }),
    "%": Reng.binary(function(R, a, b) {
        return a / b;
    }),
    ",": Reng.binary(function(R, a, b) {
        return a % b;
    }),
    // exec lambda / negate
    "`": function(R) {
        var n = R.stack.pop();
        if (n instanceof Reng.lambda) {
            n.exec(R);
        } else if (n instanceof Function) {
            R.stack.push(n.apply(R.stack.pop(), R.stack.splice(-n.length, n.length)));
        } else if (Array.isArray(n)) {
            R.stack.push.apply(R.stack, n);
        } else {
            R.stack.push(-n);
        }
    },
    "'": function(R) {
        R.stack.sort(function(x, y) {
            return x - y
        })
    },
    // redefine constant
    "#": function(R) {
        R.advance();
        var chr = R.getChar();
        var val = R.stack.pop(R.defaultPop);
        if (val instanceof Reng.lambda) R.ops[chr] = function(R) {
            val.exec(R);
        }
        else R.ops[chr] = Reng.constant(val);
    },
    // string mode
    "\"": Reng.mode(2),
    "{": Reng.mode(3), // TODO: function mode
    // pop N, take N elements from stac into a new stack
    "[": function(R) {
        var num = R.stack.pop(R.defaultPop);
        var nextStack = R.stack.splice(-num, num);
        R.parentStacks.push(R.stack);
        R.stack = nextStack;
    },
    // puts parent stack behind current stack
    "]": function(R) {
        var parent = R.parentStacks.pop(R.defaultPop);
        R.stack = parent.concat(R.stack);
    },
    "(": function(R) {
        R.stack.push(R.stack.shift() || R.defaultPop);
    },
    ")": function(R) {
        R.stack.unshift(R.stack.pop(R.defaultPop));
    },
    "&": function(R) {
        var toPop = R.stack.pop(R.defaultPop);
        var msg = R.stack.splice(-toPop, toPop).map(function(e) {
            return String.fromCharCode(e);
        }).join("");
        if (R.funcs[msg]) {
            R.funcs[msg](R);
        }
    },
    "¶": Reng.dropUse(function(R, v) {
        R.defaultPop = v;
    }),
    // conert to pseudo string
    "å": function(R) {
        var t = (R.stack.pop(R.defaultPop)) + "";
        R.stack = R.stack.concat(t.split("").map(Number))
    },
    // pop N, rotate left N times
    "À": function(R) {
        var t = R.stack.pop(R.defaultPop);
        if (t < 0) {
            R.stack.push(-t);
            Reng.ops["Á"](R);
        } else {
            while (t-- > 0) {
                R.stack.push(R.stack.shift());
            }
        }
    },
    // pop N, rotate right N times
    "Á": function(R) {
        var t = R.stack.pop(R.defaultPop);
        if (t < 0) {
            R.stack.push(-t);
            Reng.ops["À"](R);
        } else {
            while (t-- > 0) {
                R.stack.unshift(R.stack.pop());
            }
        }
    },
    // pop N, M: remove first M N's from the stack.
    "µ": function(R) {
        var N = R.stack.pop(R.defaultPop);
        var M = R.stack.pop(R.defaultPop);
        while (M-- > 0) {
            var ind = R.stack.indexOf(N);
            if (ind >= 0) {
                R.stack.splice(ind, 1);
            } else {
                M = 0
            };
        }
    },
    // goto line
    "Ø": function(R) {
        var n = R.stack.pop(R.defaultPop);
        R.pos.y = n;
        R.pos.x = -1;
        R.dir.x = 1;
        R.dir.y = 0;
    },
    // next N line
    "ø": function(R) {
        var n = R.stack.pop(R.defaultPop);
        R.pos.y += n;
        R.pos.x = -1;
        R.dir.x = 1;
        R.dir.y = 0;
    },
    // random direction
    "®": function(R) {
        Reng.ops["<>^v" [Math.random() * 4 | 0]](R);
    },
    // square
    "²": Reng.unary(function(R, x) {
        return x * x;
    }, function(R, x) {
        x.exec(R);
        return;
    }),
    // manhattan add
    "¹": Reng.binary(function(R, a, b) {
        return Number(a + "" + b);
    }),
    "î": Reng.dropUse(function(R, a) {

        R.stack = zip(R.stack, a);
    }),
    "ð": function(R) {
        var o = 0;
        for (var i = 0; i < R.parentStacks.length; i++) {
            var cS = R.parentStacks[i];
            if (cS <= R.stack && R.stack <= cS) o = 1;
        }
        R.stack.push(o);
    },
    // is var defined
    "Ç": function(R) {
        R.advance();
        var chr = R.getChar();
        R.stack.push(Number(typeof R.ops[chr] !== "undefined"))
    },
    // bind function to an object
    "Ô": function(R) {
        var func = R.stack.pop();
        var obj = R.stack.pop();
        R.stack.push(obj, func.bind(obj));
    },
    // push empty object
    "Õ": function(R) {
        R.stack.push({});
    },
    // set property
    "Ò": function(R) {
        var v = R.stack.pop();
        var kn = R.stack.pop();
        var k = R.stack.splice(-kn, kn);
        k = k.map(ord).join("");
        var o = R.stack.pop();
        o[k] = v;
        R.stack.push(o);
    },
    // set single item property
    "ò": function(R) {
        var v = R.stack.pop();
        var k = R.stack.pop();
        var o = R.stack.pop();
        o[k] = v;
        R.stack.push(o);
    },
    // get property
    "Ó": function(R) {
        var kn = R.stack.pop();
        var k = R.stack.splice(-kn, kn);
        k = k.map(ord).join("");
        var o = R.stack.pop();
        R.stack.push(o, o[k]);
    },
    // get single item property
    "ó": function(R) {
        var k = R.stack.pop();
        var o = R.stack.pop();
        R.stack.push(o, o[k]);
    },
    // push a copy of the current stack onto the stack
    "õ": function(R) {
        R.stack.push(R.stack.map(e => e));
    },
    // make an array on stack
    "§": function(R) {
        var length = R.stack.pop();
        var members = [];
        while (length-- > 0) {
            members[length] = R.stack.pop();
        }
        R.stack.push(members);
    },
    // apply function
    "©": function(R) {
        let args = R.stack.pop();
        let func = R.stack.pop();
        R.stack.push(func.apply(null, args));
    },
    // append stack to top of stack
    "¦": function(R) {
        var top = R.stack.pop();
        top.forEach(function(e) {
            R.stack.push(e);
        });
    },
    // ç, flipped
    "÷": function(R) {
        var c = R.stack.pop(R.defaultPop);
        if (c) Reng.ops["v"](R);
        else Reng.ops["^"](R);
    }
};
Array.prototype.toString = function() {
    return "[" + this.join(",") + "]";
}
Object.prototype.toString = function() {
    let y = "";
    for (var i in this) {
        y += i + ":" + this[i] + ",";
    }
    return "{" + y.slice(0, -1) + "}";
}
if (hasDOM) {
    var opArr = [],
        MAXLEN = 40;
    for (var i in Reng.ops) {
        opArr.push(i);
    }
    for (var A = 0; A < 2; A++) {
        opArr.forEach(function(e, i) {
            document.getElementById("ops").appendChild(document.createTextNode(e));
            if (!((i + 1) % MAXLEN)) document.getElementById("ops").appendChild(document.createElement("br"));
        });
        document.getElementById("ops").appendChild(document.createElement("br"));
        opArr.sort();
    }
}
Reng.prototype.reset = function() {
    this.ops = {};
    for (i in Reng.ops) {
        this.ops[i] = Reng.ops[i];
    }
}
Reng.prototype.getChar = function(y, x) {
    return this.code[typeof y === "undefined" ? this.pos.y : y][typeof x === "undefined" ? this.pos.x : x];
}
Reng.prototype.bound = function(y, x) {
    this.maxLen = Math.max(this.maxLen, x);
    if (y >= this.code.length)
        while (y-- >= this.code.length - 1) this.code.push([]);
    this.code = this.code.map(function(e) {
        while (e.length < this.maxLen) e.push(" ");
        return e;
    }.bind(this));
}
Reng.prototype.advance = function() {
    this.pos.x += this.dir.x;
    this.pos.y += this.dir.y;
    if (this.pos.x < 0) this.pos.x = this.code[this.pos.y].length - 1;
    if (this.pos.y < 0) this.pos.y = this.code.length - 1;
    if (this.pos.x >= this.maxLen) this.pos.x = 0;
    if (this.pos.y > this.code.length - 1) this.pos.y = 0;
}
Reng.prototype.exec = function(chr) {
    chr = chr || this.getChar();
    if (this.ops[chr]) this.ops[chr](this);
    else if (/[0-9A-Z]/.test(chr)) this.stack.push(parseInt(chr, 36));
}
Reng.prototype.step = function(callback) {
    if (!this.running) return false;
    callback = callback || function() {};
    switch (this.mode) {
        case 1:
            this.exec();
            if (!this.running) return false;
            break;
        case 2:
            if (this.getChar() === "\"") {
                this.mode = 1;
                break;
            }
            this.stack.push(this.getChar().charCodeAt())
            break;
        case 3:
            var chr = this.getChar();
            if (chr === "}") this.depth--;
            else if (chr === "{") this.depth++;
            if (this.depth === 0) {
                this.depth = 1;
                this.mode = 1;
                this.stack.push(new Reng.lambda(this.buildFunc));
                this.buildFunc = "";
                break;
            }
            this.buildFunc += chr;
            break;
    }
    this.advance();
    setTimeout(function() {
        callback(this);
    }.bind(this), this.delay);
}
Reng.prototype.display = function() {
    return JSON.stringify(this.code);
}
Reng.prototype.tabulate = function() {
    if (!document) throw new Error("No document present");
    var table = document.createElement("table");
    this.code.forEach(function(e, y) {
        var tr = document.createElement("tr");
        e.forEach(function(g, x) {
            var td = document.createElement("td");
            if (x === this.pos.x && y === this.pos.y) td.classList.add("cur");
            td.appendChild(document.createTextNode(g));
            tr.appendChild(td);
        }.bind(this));
        table.appendChild(tr);
    }.bind(this));
    return table;
}
if (hasDOM) {
    var inst = new Reng(document.getElementById("code").value),
        intervals = [];

    function updateDisplay(instance) {
        var dispTable = document.getElementById("dispTable");
        Array.from(dispTable.children).forEach(function(e) {
            e.parentNode.removeChild(e);
        });
        dispTable.appendChild(instance.tabulate());
        document.getElementById("stack").innerHTML = "[" + instance.stack.map(function(e) {
            return e.toString();
        }).join(", ") + "]<br>" + instance.parentStacks.reverse().map(function(e) {
            return "[" + e.join(", ") + "]"
        }).join("<br>") + "<br>{" + instance.input.join(", ") + "}";
        instance.parentStacks.reverse();
    }

    s.onclick = function() {
        inst = new Reng(document.getElementById("code").value);
        inst.reset();
        document.getElementById("o").innerHTML = "";
        (document.getElementById("input").value.match(/-?\d+\.?\d*|"(\\.|[^"])*"/g) || []).forEach(function(e) {
            typeof e !== "undefined" ? +e == e ? inst.input.push(+e) : e.slice(1, -1).split("").forEach(function(j) {
                inst.input.push(j.charCodeAt());
            }) : ""
        });
        updateDisplay(inst);
    }
    s.onclick();
    r.onclick = function() {
        intervals.push(setInterval(function() {
            inst.step(updateDisplay);
        }, +document.getElementById("int").value));
    }
    f.onclick = function() {
        (document.getElementById("input").value.match(/-?\d+\.?\d*|"(\\.|[^"])*"/g) || []).forEach(function(e) {
            typeof e !== "undefined" ? +e == e ? inst.input.push(+e) : e.slice(1, -1).split("").forEach(function(j) {
                inst.input.push(j.charCodeAt());
            }) : ""
        });
        updateDisplay(inst);
    }
    b.onclick = function() {
        inst.step(updateDisplay)
    }
    q.onclick = function() {
        clearInterval(intervals.pop() || -1);
    }
    z.onclick = function(){
        while(inst.running){
            inst.step();
        }
    }
}

if (!hasDOM) {
    var minimist, fs, fileName, contents, recur, argv, inst, path;
    
    fs = require("fs");
    minimist = require("minimist");
    path = require("path");
    
    argv = minimist(process.argv.slice(2), {
        alias: { e: "encoding", d: "delay", h: "help" },
        boolean: "help",
        string: "encoding",
        string: "delay",
        default: { encoding: "latin1", delay: "none" },
    });
    
    fileName = argv._[0];
    if (!fileName || argv.help) {
        console.error("Usage:");
        console.error("    node " + path.basename(process.argv[1]) + " [options] filename");
        console.error("");
        console.error("Options:");
        console.error("    -e, --encoding       define encoding of input file (default='latin1')");
        console.error("    -d, --delay          delay in between steps (default='none')");
        console.error("    -h, --help           show this help message");
        process.exit(-1);
    }
    
    contents = readFile(fileName, argv.encoding);
    inst = new Reng(contents);
    
    if(inst.delay == "none"){
        while(inst.running){
            inst.step();
        }
    } else {
        inst.delay = argv.delay;
        
        recur = function(inst) {
            inst.step(recur);
        }
        
        recur(inst);
    }
}