var PERIOD_SHOW = 200;
var SLEEP_TIME = 0;

addEventListener('message', onMessage, false);

function onMessage(e) {
    var data = e.data;
    countRoute(data.rows, data.cols);
}

function countRoute(rows, cols) {
    var count = 0; // 見つけたルートの数
    var path = []; // これまでに通った経路
    var visited = []; // 訪問履歴
    var i, j;

    if(rows<=3 && cols<=3) {
        PERIOD_SHOW = 0;
        SLEEP_TIME = 100;
    } else if(rows==4 && cols==4) {
        PERIOD_SHOW = 0;
        SLEEP_TIME = 10;
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

    // 検索
    search(0, 0);

    // 結果出力
    postMessage({
        count: count
    });

    function search(x, y) {
        //訪問済み判定
        if(visited[x][y]) return;

        path.push([x, y]);

        //ゴール！
        if(x==cols && y==rows) {
            ++count;
            showPath(count, path);
            path.pop();
            return;
        }

        //検索を続行
        visited[x][y] = true;
        if(x < cols) search(x+1, y);
        if(x > 0) search(x-1, y);
        if(y < rows) search(x, y+1);
        if(y > 0) search(x, y-1);

        visited[x][y] = false;
        path.pop();
    }
}

var lastShowTime = (new Date()).getTime();
function showPath(count, path) {
    var now = (new Date()).getTime();
    if(now - lastShowTime < PERIOD_SHOW) return;
    lastShowTime = now;

    while(now - lastShowTime < SLEEP_TIME) {
        now = (new Date()).getTime();
    }
    postMessage({
        path: path,
        count: count
    });
    lastShowTime = now;
}
