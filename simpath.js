
function Graph(edges, start, goal) {
    var i, length;
    this.edges = edges; // グラフの枝情報
    this.start = start; // 開始点
    this.goal = goal; // 終了点

    // グラフに出現するノードの数を数える
    var node_count = 0;
    length = edges.length;
    for(i = 0; i < length; ++i) {
        node_count = Math.max(node_count, Math.max(edges[i][0], edges[i][1]));
    }
    this.node_count = node_count;

    // mate配列を初期化
    var mate = [];
    for(i = 0; i <= node_count; ++i) {
        mate.push(i);
    }
    this.mate = mate;
}

Graph.prototype._count = function(i) {
    // すべての枝を処理した
    if(i >= this.edges.length) {
        return this.isgoal() ? [1] : [0];
    }

    var flag;
    var cnt = [0];
    var mate = this.mate;
    var edge = this.edges[i];
    var a = edge[0], b = edge[1];
    var c = mate[a], d = mate[b];

    // 枝刈り
    flag = true;

    // 枝iは使わない
    if(flag) {
        cnt = add(cnt, this._count(i+1));
    }


    //枝刈り
    flag = true;

    // 枝の両端はパスの途中であってはならない
    flag = flag && (c != 0 && d != 0);

    // 輪を作らないようにする
    flag = flag && (a != d && b != c);

    // 枝iを使う
    if(flag) {
        mate[a] = 0;
        mate[b] = 0;
        mate[c] = d;
        mate[d] = c;
        cnt = add(cnt, this._count(i+1));
        mate[a] = c;
        mate[b] = d;
        mate[c] = a;
        mate[d] = b;
    }

    return cnt;
};

Graph.prototype.count = function() {
    return this._count(0);
};

Graph.prototype.isgoal = function() {
    var mate = this.mate;
    var start = this.start;
    var goal = this.goal;
    var length = mate.length;
    var i;

    // スタートとゴールの接続を判定
    if(mate[start] !== goal) {
        return false;
    }

    for(i = 1; i < length; ++i) {
        if(mate[i] == 0 || i == start || i == goal) {
            continue;
        }
        if(mate[i] != i) {
            return false;
        }
    }

    return true;
};

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

if(typeof console !== 'undefined') (function() {
    var edge = [
        [1, 2],
        [1, 3],
        [2, 4],
        [2, 5],
        [3, 6],
        [4, 5],
        [4, 7],
        [5, 9],
        [6, 8],
        [7, 9],
        [7, 8]
        ];
    var g = new Graph(edge, 1, 9);
    console.log(g.count());
})();
