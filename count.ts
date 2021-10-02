var PERIOD_SHOW = 50;
var COUNT_PERIOD_SHOW = 31;
var SLEEP_TIME = 0;
var nowimpl = !!Date.now;

addEventListener("message", onMessage, false);

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

  if (rows <= 3 && cols <= 3) {
    PERIOD_SHOW = 0;
    SLEEP_TIME = 100;
    COUNT_PERIOD_SHOW = 1;
  } else if (rows == 4 && cols == 4) {
    PERIOD_SHOW = 0;
    SLEEP_TIME = 10;
    COUNT_PERIOD_SHOW = 1;
  }

  //初期化
  var tmp;
  for (i = 0; i <= cols; i++) {
    tmp = [];
    for (j = 0; j <= rows; j++) {
      tmp.push(false);
    }
    visited.push(tmp);
  }

  // 検索
  search(0, 0);

  // 結果出力
  postMessage({
    count: count,
    time: (nowimpl ? Date.now() : +new Date()) - startTime,
  });

  function search(x, y) {
    //ゴール！
    if (x == cols && y == rows) {
      path[pathlength++] = x;
      path[pathlength++] = y;
      showPath(path);
      pathlength -= 2;
      return;
    }

    //ゴールへの経路が無い場合はスキップ
    if (visited[cols - 1][rows] && visited[cols][rows - 1]) return;

    //検索を続行
    path[pathlength++] = x;
    path[pathlength++] = y;
    visited[x][y] = true;

    if (x < cols && !visited[x + 1][y]) search(x + 1, y);
    if (x > 0 && !visited[x - 1][y]) search(x - 1, y);
    if (y < rows && !visited[x][y + 1]) search(x, y + 1);
    if (y > 0 && !visited[x][y - 1]) search(x, y - 1);

    visited[x][y] = false;
    pathlength -= 2;
  }
}

var count = [0]; // 見つけたルートの数
var lastShowTime = nowimpl ? Date.now() : +new Date();
function showPath(path) {
  // カウントアップ処理
  var i = 0;
  count[0] += 1;
  for (i = 0; count[i] >= 10000; i++) {
    count[i] = 0;
    if (count[i + 1]) {
      count[i + 1] += 1;
    } else {
      count[i + 1] = 1;
    }
  }

  if (count[0] % COUNT_PERIOD_SHOW != 0) return;

  // 時間計測
  var now = nowimpl ? Date.now() : +new Date();
  if (now - lastShowTime < PERIOD_SHOW) return;
  lastShowTime = now;

  // ウエイトを挿入
  while (now - lastShowTime < SLEEP_TIME) {
    now = nowimpl ? Date.now() : +new Date();
  }

  // 経路表示
  postMessage({
    path: path,
    count: count,
  });
  lastShowTime = now;
}
