var isWebWorker = typeof require === 'undefined';

function Map() {
    var width, height;
    var s, ch;
    var values, funcvalues;
    var data = [];
    var tmp;
    var i, x, y;

    if(arguments.length==1) {
        // 文字列からマップを作成
        s = arguments[0];
        tmp = [];
        for(i = 0; i < s.length; ++i) {
            ch = s.charAt(i);
            if(ch=='\n') {
                data.push(tmp);
                tmp = [];
            } else {
                tmp.push(ch);
            }
        }
    } else {
        // 指定された大きさで初期化
        width = arguments[0];
        height = arguments[1];
        values = arguments[2];
        if(values) {
            if(values instanceof Function) {
                funcvalues = arguments[2];
            } else {
                funcvalues = function() {return values;};
            }
        } else {
            funcvalues = function(x, y) {
                return (x==0 || y==0 || x==width-1 || y==height-1) ? 'x' : 'o';
            };
        }
        for(y = 0; y < height; ++y) {
            tmp = [];
            for(x = 0; x < width; ++x) {
                tmp[x] = funcvalues(x, y);
            }
            data.push(tmp);
        }
    }
    this.height = data.length;
    this.width = data[0].length;
    this.data = data;
}

// 文字列へ変換する
Map.prototype.tostring = function() {
    var data = this.data;
    var height = this.height;
    var width = this.width;
    var y;
    var s = '';
    for(y = 0; y < height; ++y) {
        s += data[y].join('');
        s += '\n';
    }
    return s;
};

// マップから検索
Map.prototype.find = function(ch) {
    var data = this.data;
    var height = data.length;
    var width = data[0].length;
    var x, y, tmp;
    for(y = 0; y < height; ++y) {
        tmp = data[y];
        for(x = 0; x < width; ++x) {
            if(tmp[x]==ch) return [x, y];
        }
    }
    return null;
};

// 自分のクローンを作る
Map.prototype.clone = function() {
    return new Map(this.tostring());
};

// 比較を行う
function cmp(a, b) {
    var i;
    var length = Math.max(a.length, b.length);
    var digita, digitb;
    for(i = length-1; i >= 0; --i) {
        digita = a[i] || 0;
        digitb = b[i] || 0;
        if(digita < digitb) return -1;
        if(digita > digitb) return 1;
    }
    return 0;
}

// 足し算を行う
function add(a, b) {
    var i;
    var carry = 0;
    var ans = [0];
    var length = Math.max(a.length, b.length);

    for(i = 0; i < length || carry != 0; ++i) {
        ans[i] = (a[i]||0) + (b[i]||0) + carry;
        if(ans[i]>=10000) {
            carry = 1;
            ans[i] -= 10000;
        } else {
            carry = 0;
        }
    }

    return ans;
}

// 掛け算を行う
function mul(a, b) {
    var i, j;
    var alength = a.length;
    var blength = b.length;
    var ablength = alength + blength - 1;
    var ans = [];

    // 初期化
    for(i = 0; i < ablength; ++i) {
        ans[i] = 0;
    }

    // 掛け算
    for(i = 0; i < alength; ++i) {
        for(j = 0; j < blength; ++j) {
            ans[i+j] += a[i] * b[j];
        }
    }

    // 繰り上げ処理
    var carry = 0;
    var digit;
    for(i = 0; i < ablength || carry > 0; ++i) {
        digit = (ans[i]||0) + carry;
        carry = (digit / 10000) | 0;
        ans[i] = digit % 10000;
    }

    return ans;
}

if(!isWebWorker) {
    // デバッグ用に関数をエクスポート
    module.exports = {
        cmp: cmp,
        add: add,
        mul: mul,
        Map: Map
    };
}
