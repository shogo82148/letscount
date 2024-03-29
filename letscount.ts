document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("path") as HTMLCanvasElement;
  const width = canvas.width;
  const height = canvas.height;
  const margin = 10;
  const ctx = canvas.getContext("2d")!;
  const startLabel = document.getElementById("start") as HTMLDivElement;
  const goalLabel = document.getElementById("goal") as HTMLDivElement;
  const tellChildren = document.getElementById("tellchildren") as HTMLAnchorElement;
  const problemText = document.getElementById("problem-text") as HTMLParagraphElement;
  const resultText = document.getElementById("result-text") as HTMLDivElement;
  const tell = document.getElementById("tell") as HTMLInputElement;
  let tellMode = false;
  let worker: Worker;

  function start(rows: number, cols: number) {
    // terminate old workers
    if (worker) {
      worker.terminate();
    }
    if (rows <= 0 || cols <= 0) {
      return;
    }

    tellChildren.style.display = "none";

    // 画面更新
    problemText.innerText = `${rows}×${cols}`;

    // start a new worker
    tellMode = tell.checked;
    const workerJs = tellMode ? "simpath.js" : "count.js";
    if (location.hostname == "localhost") {
      worker = new Worker(workerJs + "?" + Math.random());
    } else {
      worker = new Worker(workerJs);
    }
    worker.addEventListener("message", onMessage, false);
    worker.postMessage({ rows: rows, cols: cols });

    var xstep = (width - 2 * margin) / cols;
    var ystep = (height - 2 * margin) / rows;
    var units = [
      "",
      "万",
      "億",
      "兆",
      "京",
      "垓",
      "𥝱",
      "穣",
      "溝",
      "澗",
      "正",
      "載",
      "極",
      "恒河沙",
      "阿僧祇",
      "那由他",
      "不可思議",
      "無量大数",
    ]; // 大きな数の単位

    drawAllPath();
    startLabel.style.display = "block";
    goalLabel.style.display = "block";

    // パス表示
    function onMessage(e: any) {
      var data = e.data;
      var countKanji = "";
      if (data.selected) ctx.strokeStyle = "gray";
      else ctx.strokeStyle = "black";
      drawAllPath();

      if (data.selected) {
        drawEdges(data.edges, data.selected, data.frontier);
      }

      if (data.path) {
        drawPath(data.path);
      }
      if (data.count) {
        countKanji = showCount(data.count);
      }
      if (data.time) {
        if (rows >= 5 || cols >= 5) share(rows + "×" + cols, countKanji, data.time);
        console.log("Time: " + data.time + "ms");
      }
    }

    // 描画
    function drawAllPath() {
      var i, p1, p2;
      ctx.beginPath();
      ctx.clearRect(0, 0, width, height);
      ctx.lineWidth = 3;

      //横線
      for (i = 0; i <= rows; i++) {
        p1 = toScreen(0, i);
        p2 = toScreen(cols, i);

        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
      }

      //縦線
      for (i = 0; i <= cols; i++) {
        p1 = toScreen(i, 0);
        p2 = toScreen(i, rows);

        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
      }
      ctx.stroke();
    }

    // パスの描画
    function drawPath(path: number[]) {
      ctx.lineWidth = 7;
      ctx.strokeStyle = "#d24e63";
      ctx.beginPath();
      var i, p;
      p = toScreen(path[0], path[1]);
      ctx.moveTo(p.x, p.y);
      for (i = 2; i < path.length; i += 2) {
        p = toScreen(path[i], path[i + 1]);
        ctx.lineTo(p.x, p.y);
        if (path[i] == cols && path[i + 1] == rows) break;
      }
      //console.log(path);
      ctx.stroke();
    }

    // 経路数の表示
    function showCount(count: number[]) {
      let s = "";
      for (let i = 0; i < count.length; i++) {
        s = (count[i + 1] ? fillZero(count[i]) : count[i]) + (units[i] || "") + s;
      }
      resultText.innerText = s;
      return s;

      // 0埋めをする
      function fillZero(count: number): string {
        if (count >= 1000) {
          return `${count}`;
        } else if (count >= 100) {
          return `0${count}`;
        } else if (count >= 10) {
          return `00${count}`;
        }
        return `000${count}`;
      }
    }

    // 枝の描画
    function drawEdges(edges: number[][], selected: boolean[], frontier: number[]) {
      ctx.strokeStyle = "black";
      draw(false);
      ctx.lineWidth = 7;
      ctx.strokeStyle = "#d24e63";
      draw(true);
      ctx.fillStyle = "black";
      drawFrontier();

      function draw(flag: boolean) {
        var i,
          length = selected.length;
        var p1, p2;
        ctx.beginPath();
        for (i = 0; i < length; ++i) {
          if (!((flag && selected[i]) || (!flag && !selected[i]))) continue;
          p1 = no2Screen(edges[i][0]);
          p2 = no2Screen(edges[i][1]);
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
        }
        ctx.stroke();
      }

      function drawFrontier() {
        var i,
          length = frontier.length;
        var p;
        for (i = 0; i < length; ++i) {
          ctx.beginPath();
          p = no2Screen(frontier[i]);
          ctx.arc(p.x, p.y, 5, 0, Math.PI * 2, false);
          ctx.fill();
        }
      }

      function no2Screen(no: number) {
        var x = (no - 1) % (cols + 1);
        var y = (no - 1) / (cols + 1);
        return toScreen(x, y | 0);
      }
    }

    // 画面上の位置を計算
    function toScreen(x: number, y: number): { x: number; y: number } {
      return {
        x: x * xstep + margin,
        y: y * ystep + margin,
      };
    }
  }

  function resize() {
    const parent = document.getElementById("patterns") as HTMLDivElement;
    const size = Math.min(parent.clientWidth, parent.clientHeight) * 0.8;
    canvas.style.width = `${size}px`;
    const scale = size / width;
    const top = parent.offsetTop + parent.clientHeight * 0.1;
    const left = parent.offsetLeft + (parent.clientWidth - size) / 2;
    startLabel.style.top = `${top + margin * scale}px`;
    startLabel.style.left = `${left + margin * scale}px`;
    goalLabel.style.top = `${top + size - margin * scale}px`;
    goalLabel.style.left = `${left + size - margin * scale}px`;
  }

  function share(size: string, patterns: string, time: number) {
    const textPattern = [
      "%sのときは、%dだってよ！%fかかったわ！",
      "はい、出ました！%sのときは%d通り！%fかかったわ！",
      "あ、なんかでてるね。%sのときは%d通り。すごいね！%fかかったわ！",
      "みんな、起きて！%sのときは%d通り。ものすごい数になってきたね。%fかかったわ！",
      "%sのときは、なんと！%d通り！めまいがしてきたわね！%fかかったわ！",
      "ツイニデタワ。%sノトキハ%d通り！皆ノ子孫ニ連絡シナキャ！%fカカッタワ！",
    ];
    let text = textPattern[Math.floor(Math.random() * textPattern.length)];
    const hashtags = ["おねえさんのコンピュータ"];
    text = text.replace("%s", size);
    text = text.replace("%d", patterns);
    text = text.replace("%f", time / 1000 + "秒");

    // $.browserは非推奨らしいけど、簡易判定で十分なのでとりあえずこれで
    // TODO: implement me
    // if ($.browser) {
    //   if ($.browser.msis) {
    //     hashtags.push("ie");
    //   } else if ($.browser.mozilla) {
    //     hashtags.push("firefox");
    //   } else if ($.browser.webkit) {
    //     if (navigator.userAgent.toLowerCase().indexOf("chrome") >= 0) {
    //       hashtags.push("chrome");
    //     } else {
    //       hashtags.push("safari");
    //     }
    //   } else if ($.browser.opera) {
    //     hashtags.push("opera");
    //   }
    // }

    if (tellMode) {
      hashtags.push("おしえてあげるモード");
    } else {
      hashtags.push("通常モード");
    }

    const shareUrl =
      "https://twitter.com/share?" +
      "lang=ja&hashtags=" +
      encodeURIComponent(hashtags.join(",")) +
      "&url=" +
      encodeURIComponent("http://shogo82148.github.io/letscount/") +
      "&text=" +
      encodeURIComponent(text);
    tellChildren.href = shareUrl;
    tellChildren.title = text;
    tellChildren.style.display = "inline";
  }

  window.addEventListener("resize", resize);
  resize();

  document.querySelectorAll<HTMLInputElement>("input[type=button]").forEach((elem) => {
    elem.addEventListener("click", () => {
      start(parseInt(elem.dataset.rows ?? "1"), parseInt(elem.dataset.cols ?? "1"));
    });
  });
});
