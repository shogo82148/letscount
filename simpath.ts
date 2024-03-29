(() => {
  var PERIOD_SHOW = 50;
  var COUNT_PERIOD_SHOW = 10;
  var SLEEP_TIME = 0;
  var isWebWorker = typeof require === "undefined";

  class Graph {
    edges: number[][];
    start: number;
    goal: number;
    node_count: number;
    mate: Uint32Array;
    edge_count: Uint8Array;
    edge_selected: Uint8Array;
    edge_unselected: Uint8Array;
    selected: boolean[];
    cache: any;
    countSummary: Uint16Array;

    constructor(edges: number[][], start: number, goal: number) {
      this.edges = edges;
      this.start = start;
      this.goal = goal;

      var i, length;

      // グラフに出現するノードの数を数える
      var node_count = 0;
      length = edges.length;
      for (i = 0; i < length; ++i) {
        node_count = Math.max(node_count, Math.max(edges[i][0], edges[i][1]));
      }
      this.node_count = node_count;

      // 各点の情報を初期化
      var mate = new Uint32Array(node_count + 1); // パスの接続情報
      var edge_count = new Uint8Array(node_count + 1); //各点に出入りする枝の数
      var edge_selected = new Uint8Array(node_count + 1); // 選択された枝の数
      var edge_unselected = new Uint8Array(node_count + 1); // 選択されなかった枝の数
      for (i = 0; i <= node_count; ++i) {
        mate[i] = i;
      }
      for (i = 0; i < length; ++i) {
        ++edge_count[edges[i][0]];
        ++edge_count[edges[i][1]];
      }

      this.mate = mate;
      this.edge_count = edge_count;
      this.edge_selected = edge_selected;
      this.edge_unselected = edge_unselected;

      this.selected = [];
      this.cache = {};
      this.countSummary = new Uint16Array(1); // 検索パスの概算
    }

    count(i: number) {
      // すべての枝を処理した
      var cnt;
      if (i >= this.edges.length) {
        cnt = new Uint16Array(1);
        if (this.isgoal()) cnt[0] = 1;
        return cnt;
      }

      var flag;
      var mate = this.mate;
      var j, f;
      var key = null;

      if (i % COUNT_PERIOD_SHOW == 0) {
        key = [i];

        // 計算済みの結果を探す
        f = this.frontier();
        for (j = 0; j < f.length; ++j) {
          key.push(f[j], mate[f[j]]);
        }
        key = String.fromCharCode.apply(null, key);
        cnt = this.cache[key];
        if (cnt) {
          this.countSummary = add(this.countSummary, cnt);
          showSimpath();
          return cnt;
        }
      }

      cnt = new Uint16Array(1);
      var edge = this.edges[i];
      var a = edge[0],
        b = edge[1];
      var c = mate[a],
        d = mate[b];

      // 枝刈り
      flag = true;

      if (a == this.start || a == this.goal) {
        // スタートとゴールからは枝が一本しか出ない
        flag = flag && this.edge_unselected[a] != this.edge_count[a] - 1;
      } else {
        // それ以外の点では入る枝と出る枝が必要
        flag = flag && (this.edge_selected[a] != 1 || this.edge_unselected[a] != this.edge_count[a] - 2);
      }

      if (b == this.start || b == this.goal) {
        // スタートとゴールからは枝が一本しか出ない
        flag = flag && this.edge_unselected[b] != this.edge_count[b] - 1;
      } else {
        // それ以外の点では入る枝と出る枝が必要
        flag = flag && (this.edge_selected[b] != 1 || this.edge_unselected[b] != this.edge_count[b] - 2);
      }

      // 枝iは使わない
      if (flag) {
        ++this.edge_unselected[a];
        ++this.edge_unselected[b];
        this.selected.push(false);
        cnt = add(cnt, this.count(i + 1));
        this.selected.pop();
        --this.edge_unselected[a];
        --this.edge_unselected[b];
      }

      //枝刈り
      flag = true;

      // 枝の両端はパスの途中であってはならない
      flag = flag && c != 0 && d != 0;

      // 輪を作らないようにする
      flag = flag && a != d && b != c;

      // 三叉路を作らない
      flag = flag && this.edge_selected[a] < 2 && this.edge_selected[b] < 2;

      if (a == this.start || a == this.goal) {
        // スタートとゴールからは枝が一本しか出ない
        flag = flag && this.edge_selected[a] != 1;
      } else {
        // それ以外の点では入る枝と出る枝が必要
        flag = flag && (this.edge_selected[a] != 0 || this.edge_unselected[a] != this.edge_count[a] - 1);
      }

      if (b == this.start || b == this.goal) {
        // スタートとゴールからは枝が一本しか出ない
        flag = flag && this.edge_selected[b] != 1;
      } else {
        // それ以外の点では入る枝と出る枝が必要
        flag = flag && (this.edge_selected[b] != 0 || this.edge_unselected[b] != this.edge_count[b] - 1);
      }

      // 枝iを使う
      if (flag) {
        ++this.edge_selected[a];
        ++this.edge_selected[b];
        mate[a] = 0;
        mate[b] = 0;
        mate[c] = d;
        mate[d] = c;
        this.selected.push(true);
        cnt = add(cnt, this.count(i + 1));
        this.selected.pop();
        mate[a] = c;
        mate[b] = d;
        mate[c] = a;
        mate[d] = b;
        --this.edge_selected[a];
        --this.edge_selected[b];
      }

      if (key) {
        this.cache[key] = cnt;
      }

      return cnt;
    }

    isgoal(): boolean {
      var mate = this.mate;
      var start = this.start;
      var goal = this.goal;
      var length = mate.length;
      var i;

      // スタートとゴールの接続を判定
      if (mate[start] !== goal) {
        return false;
      }

      // スタートとゴール以外のパスが無いことを確認
      for (i = 1; i < length; ++i) {
        if (mate[i] == 0 || i == start || i == goal) {
          continue;
        }
        if (mate[i] != i) {
          return false;
        }
      }

      return true;
    }

    frontier(): number[] {
      var f = [];
      var i;
      var edge_count = this.edge_count;
      var edge_selected = this.edge_selected;
      var edge_unselected = this.edge_unselected;
      var length = edge_count.length;

      for (i = 1; i < length; ++i) {
        if (edge_selected[i] == 0 && edge_unselected[i] == 0) {
          continue;
        }
        if (edge_selected[i] == 2) {
          continue;
        }
        if (edge_selected[i] == 0 && edge_selected[i] + edge_unselected[i] == edge_count[i] - 1) {
          continue;
        }
        if (edge_selected[i] + edge_unselected[i] == edge_count[i]) {
          continue;
        }
        f.push(i);
      }
      return f;
    }
  }

  // 足し算を行う
  function add(a: Uint16Array, b: Uint16Array): Uint16Array {
    var alength = a.length;
    var blength = b.length;
    var length = Math.max(alength, blength);
    var ans = new Uint16Array(length);
    var new_ans;
    var i;
    var carry = 0;

    for (i = 0; i < length; ++i) {
      ans[i] = (i < alength ? a[i] : 0) + (i < blength ? b[i] : 0) + carry;
      if (ans[i] >= 10000) {
        carry = 1;
        ans[i] -= 10000;
      } else {
        carry = 0;
      }
    }

    if (carry !== 0) {
      new_ans = new Uint16Array(length + 1);
      for (i = 0; i < length; ++i) {
        new_ans[i] = ans[i];
      }
      new_ans[length] = 1;
      return new_ans;
    }

    return ans;
  }

  function grid(w: number, h: number): number[][] {
    var edge: number[][] = [];
    var i, j;
    for (i = 0; i < h; ++i) {
      for (j = 0; j < w; ++j) {
        edge.push([n(i, j), n(i, j + 1)]);
        edge.push([n(i, j), n(i + 1, j)]);
      }
      edge.push([n(i, w), n(i + 1, w)]);
    }
    for (j = 0; j < w; ++j) {
      edge.push([n(h, j), n(h, j + 1)]);
    }
    return edge;

    function n(i: number, j: number) {
      return 1 + i * (w + 1) + j;
    }
  }

  let edge: number[][];
  let g: Graph;
  let lastShowTime = 0;
  function showSimpath() {
    if (!isWebWorker) {
      return;
    }

    // 時間計測
    let now = Date.now();
    if (now - lastShowTime < PERIOD_SHOW) return;
    lastShowTime = now;

    // ウエイトを挿入
    while (now - lastShowTime < SLEEP_TIME) {
      now = Date.now();
    }

    // 経路表示
    postMessage({
      edges: edge,
      selected: g.selected,
      frontier: g.frontier(),
      count: g.countSummary,
    });
    lastShowTime = now;
  }

  if (isWebWorker) {
    addEventListener(
      "message",
      function (e: MessageEvent<any>) {
        if (e.data.rows <= 3 && e.data.cols <= 3) {
          PERIOD_SHOW = 0;
          SLEEP_TIME = 500;
          COUNT_PERIOD_SHOW = 1;
        } else if (e.data.rows <= 4 && e.data.cols <= 4) {
          PERIOD_SHOW = 0;
          SLEEP_TIME = 10;
          COUNT_PERIOD_SHOW = 1;
        } else {
          COUNT_PERIOD_SHOW = e.data.rows;
        }

        const startTime = Date.now();
        edge = grid(e.data.cols, e.data.rows);
        g = new Graph(edge, 1, 1);
        g.goal = g.node_count;
        postMessage({
          count: g.count(0),
          time: Date.now() - startTime,
        });
      },
      false
    );
  } else {
    const cols = parseInt(process.argv[2] || "9");
    const rows = parseInt(process.argv[3] || "9");
    edge = grid(cols, rows);
    g = new Graph(edge, 1, 1);
    g.goal = g.node_count;
    console.log(g.count(0));
  }
})();
