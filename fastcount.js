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

// マップからすべて検索
Map.prototype.findAll = function(ch) {
    var data = this.data;
    var height = data.length;
    var width = data[0].length;
    var x, y, tmp;
    var result = [];
    for(y = 0; y < height; ++y) {
        tmp = data[y];
        for(x = 0; x < width; ++x) {
            if(tmp[x]==ch) result.push([x, y]);
        }
    }
    return result;
};

// 自分のクローンを作る
Map.prototype.clone = function() {
    return new Map(this.tostring());
};


// 距離の一覧を作成
Map.prototype.distmap = function(startx, starty) {
    var result = new Map(this.width, this.height, Infinity);
    var dist  = result.data;
    var data = this.data;
    var que = [[startx, starty, 0]];
    var p, x, y, d;
    while(que.length > 0) {
        // キューから取り出し
        p = que.shift();
        x = p[0]; y = p[1]; d = p[2];

        // 到達可能？
        if(data[y][x] == 'x') continue;

        // 未訪問なら距離を保存
        if(dist[y][x] != Infinity) continue;
        dist[y][x] = d;

        // 周囲を検索
        ++d;
        que.push([x+1, y, d]);
        que.push([x-1, y, d]);
        que.push([x, y+1, d]);
        que.push([x, y-1, d]);
    }
    return result;
};

// 距離一覧から一方通行しかできない経路を削除
Map.prototype.removeOneWay = function() {
    var width = this.width - 1, height = this.height - 1;
    var data = this.data;
    var x, y, points;
    for(y = 1; y < height; ++y) {
        for(x = 1; x < width; ++x) {
            points = [];
            if(data[y][x+1] < Infinity) points.push([x+1, y]);
            if(data[y][x-1] < Infinity) points.push([x-1, y]);
            if(data[y+1][x] < Infinity) points.push([x, y+1]);
            if(data[y-1][x] < Infinity) points.push([x, y-1]);
            if(points.length<=1 ||
               points.length==2 &&
               (points[0][0] == points[1][0] ||
                points[0][1] == points[1][1] ||
                data[points[1][1]][points[0][0]]>=Infinity))
            {
                data[y][x] = Infinity;
            }
        }
    }
    return this;
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
