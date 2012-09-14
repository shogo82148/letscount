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
        if(typeof values !== 'undefined') {
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

// 分析を行う
Map.prototype.analyze = function() {
    // startからすべての点への距離を求める
    var doors = this.findAll('d');
    var from_start = this.distmap(doors[0][0], doors[0][1]);

    // d-d間をつなぐ経路は存在しない
    var distance = from_start.data[doors[1][1]][doors[1][0]];
    if(distance >= Infinity) return null;

    // goalからすべての点への距離を求める
    var from_goal = this.distmap(doors[1][0], doors[1][1]);

    // 一方通行の経路を削除
    from_start.removeOneWay();

    from_start = from_start.data;
    from_goal = from_goal.data;

    var result = [];
    var width = this.width;
    var height = this.height;
    var used = (new Map(width, height, false)).data;
    var x, y;
    var que, p, xx, yy, map, data;
    var mindist, minpos, maxdist, maxpos;
    var dist;
    var minx, maxx, miny, maxy;

    for(y = 0; y < height; ++y) {
        for(x = 0; x < width; ++x) {
            if(from_start[y][x]>=Infinity) continue;
            if(used[y][x]) continue;

            // 同じ領域を塗りつぶす
            map = new Map(width, height, 'x');
            data = map.data;
            que = [[x, y]];
            mindist = Infinity;
            minpos = null;
            maxdist = -1;
            maxpos = null;
            minx = Infinity; maxx = -1;
            miny = Infinity; maxy = -1;
            while(que.length > 0) {
                // 塗りつぶし対象となる点を取得
                p = que.shift();
                xx = p[0]; yy = p[1];
                dist = from_start[yy][xx];
                if(dist >= Infinity) continue;
                if(used[yy][xx]) continue;

                // 塗りつぶし
                used[yy][xx] = true;
                data[yy][xx] = 'o';

                // xとyの値域を保存
                if(xx < minx) minx = xx;
                if(xx > maxx) maxx = xx;
                if(yy < miny) miny = yy;
                if(yy > maxy) maxy = yy;

                // スタートとゴールを検索
                if(dist+from_goal[yy][xx]==distance) {
                    if(dist < mindist) {
                        minpos = [xx, yy];
                        mindist = dist;
                    }
                    if(dist > maxdist) {
                        maxpos = [xx, yy];
                        maxdist = dist;
                    }
                }

                // 隣接する点を検索
                que.push([xx+1, yy]);
                que.push([xx-1, yy]);
                que.push([xx, yy+1]);
                que.push([xx, yy-1]);
            }

            // スタートとゴールを設置
            if(!minpos || !maxpos) continue;
            if(minpos[0]==maxpos[0] && minpos[1]==maxpos[1]) continue;
            data[minpos[1]][minpos[0]] = 'd';
            data[maxpos[1]][maxpos[0]] = 'd';

            // できるだけ小さくする
            --minx; --miny;
            ++maxx; ++maxy;
            result.push(
                new Map(maxx - minx + 1, maxy - miny + 1, function(x, y) {
                    return data[y + miny][x + minx];
                }
            ));
        }
    }

    return result;
};

// 経路を数える
var cache = {};
Map.prototype.countRoute = function() {
    // スタートとゴールを検索
    var p;
    var startx, starty, goalx, goaly;
    p = this.findAll('d');
    if(p.length!=2) throw 'start and goal needed';
    startx = p[0][0]; starty = p[0][1];
    goalx = p[1][0]; goaly = p[1][1];
    var data = this.data;
    var self = this;
    count = dfs(startx, starty);
    data[starty][startx] = 'd';
    return count;

    // 深さ優先検索
    function dfs(x, y) {
        if(x == goalx && y == goaly) {
            return [1];
        }

        // キャッシュを検索
        data[y][x] = 'd';
        var key = self.tostring();
        var count;
        if(cache[key]) {
            data[y][x] = 'o';
            return cache[key];
        }

        // 小さい単位に分解して計算
        var analysis = self.analyze();
        data[y][x] = 'o';
        if(!analysis) return [0];
        if(analysis.length==0) return [1];
        if(analysis.length == 1) {
            // マップが簡単になる場合は再検索
            if(analysis[0].tostring()!=key) {
                return analysis[0].countRoute();
            }
        } else {
            // ぞれぞれの結果を結合
            count = [1];
            var i;
            for(i = 0; i < analysis.length; ++i) {
                count = mul(count, analysis[i].countRoute());
            }
            return count;
        }

        count = [0];
        data[y][x] = 'x';
        if(data[y][x + 1] != 'x')
            count = add(count, dfs(x + 1, y));
        if(data[y][x - 1] != 'x')
            count = add(count, dfs(x - 1, y));
        if(data[y + 1][x] != 'x')
            count = add(count, dfs(x, y + 1));
        if(data[y - 1][x] != 'x')
            count = add(count, dfs(x, y - 1));
        data[y][x] = 'o';
        cache[key] = count;
        return count;
    }
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
