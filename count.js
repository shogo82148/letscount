var PERIOD_SHOW = 50;
var COUNT_PERIOD_SHOW = 31;
var SLEEP_TIME = 0;
var nowimpl = !!Date.now;

addEventListener('message', onMessage, false);

function onMessage(e) {
    var data = e.data;
    countRoute(data.rows, data.cols);
}

function countRoute(rows, cols) {
    var path = []; // これまでに通った経路
    var pathlength = 0;
    var visited = []; // 訪問履歴
    var i, j;
    var startTime = nowimpl ? Date.now() : +new Date();
    var funccount = [0];
    var cache = {};

    if(rows<=3 && cols<=3) {
        PERIOD_SHOW = 0;
        SLEEP_TIME = 100;
        COUNT_PERIOD_SHOW = 1;
    } else if(rows==4 && cols==4) {
        PERIOD_SHOW = 0;
        SLEEP_TIME = 10;
        COUNT_PERIOD_SHOW = 1;
    }

    //初期化
    var tmp;
    for(i=0;i<=cols;i++) {
        tmp = [];
        for(j=0;j<=rows;j++) {
            tmp.push(false);
        }
        visited.push(tmp);
    }

    visited[0][0] = true;
    path = [0, 0];
    pathlength = 2;

    // 結果出力
    postMessage({
        count: dfs(1, 0),
        funccount: funccount,
        time: (nowimpl ? Date.now() : +new Date()) - startTime
    });

    // 深さ優先検索
    function dfs(x, y) {
        var count = [0];

        funccount = add(funccount, [1]);

        //ゴール！
        if(x==cols && y==rows) {
            path[pathlength++] = x;
            path[pathlength++] = y;
            showPath(path);
            pathlength -= 2;
            return [2];
        }

        //ゴールへの経路が無い場合はスキップ
        var key = bfs(x, y);
        if(!key) return [0];

        // キャッシュを検索
        key += ',' + x + ',' + y;
        if(cache[key]) {
            countup(cache[key]);
            return cache[key];
        }

        //検索を続行
        path[pathlength++] = x;
        path[pathlength++] = y;
        visited[x][y] = true;
        if(x < cols && !visited[x+1][y]) count = add(count, dfs(x+1, y));
        if(x > 0 && !visited[x-1][y]) count = add(count, dfs(x-1, y));
        if(y < rows && !visited[x][y+1]) count = add(count, dfs(x, y+1));
        if(y > 0 && !visited[x][y-1]) count = add(count, dfs(x, y-1));

        visited[x][y] = false;
        pathlength -= 2;

        if(Math.random()<0.1)
            cache[key] = count;

        return count;
    }

    // 幅優先検索で到達可能領域を計算
    function bfs(nowx, nowy) {
        // 到達済みフラグ初期化
        var v = [], tmp;
        var i, j;
        for(i=0;i<=cols;i++) {
            tmp = [];
            for(j=0;j<=rows;j++) {
                tmp.push(false);
            }
            v.push(tmp);
        }

        // 検索
        var p;
        var que = [[cols, rows]];
        var x, y;
        while(que.length > 0) {
            p = que.shift();
            x = p[0]; y = p[1];
            v[x][y] = true;
            if(x < cols && !v[x+1][y] && !visited[x+1][y])
                que.push([x+1, y]);
            if(x > 0 && !v[x-1][y] && !visited[x-1][y])
                que.push([x-1, y]);
            if(y < rows && !v[x][y+1] && !visited[x][y+1])
                que.push([x, y+1]);
            if(y > 0 && !v[x][y-1] && !visited[x][y-1])
                que.push([x, y-1]);
        }

        if(!v[nowx][nowy]) {
            return false;
        }

        // 到達可能領域を文字列に変換
        var s = '';
        for(i=0;i<=cols;i++) {
            tmp = v[i];
            for(j=0;j<=rows;j++) {
                s += tmp[j] ? '1' : '0';
            }
        }
        return s;
    }
}

function add(a, b) {
    var i;
    var carry = 0;
    var ans = [0];
    var length = Math.max(a.length, b.length);

    for(i=0;i<length||carry!=0;i++) {
        ans[i] = (a[i]||0) + (b[i]||0) + carry;
        carry = Math.floor(ans[i] / 10000);
        ans[i] = ans[i] % 10000;
    }

    return ans;
}

var count = [0]; // 見つけたルートの数
var lastShowTime = nowimpl ? Date.now() : +new Date();

function countup(a) {
    count = add(count, a);
}

function showPath(path) {
    // カウントアップ処理
    var i = 0;
    count = add(count, [1]);

    if(count[0] % COUNT_PERIOD_SHOW !=0) return;

    // 時間計測
    var now = nowimpl ? Date.now() : +new Date();
    if(now - lastShowTime < PERIOD_SHOW) return;
    lastShowTime = now;

    // ウエイトを挿入
    while(now - lastShowTime < SLEEP_TIME) {
        now = nowimpl ? Date.now() : +new Date();
    }

    // 経路表示
    postMessage({
        path: path,
        count: count
    });
    lastShowTime = now;
}
