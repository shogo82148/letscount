$(function() {
    var canvas = $('#path');
    var width = canvas.attr('width') * 1;
    var height = canvas.attr('height') * 1;
    var margin = 10;
    var ctx = canvas[0].getContext('2d');
    var worker;

    function start(rows, cols) {
        // 古いワーカーは用済み
        if(worker) {
            worker.terminate();
        }
        if(rows<=0 || cols<=0) return ;

        // 画面更新
        $('#problem-text').text(rows + '×'+  cols);

        // 新しいワーカーを作成・初期化
        worker = new Worker('count.js?' + Math.random());
        worker.addEventListener('message', onMessage, false);
        worker.postMessage({rows: rows, cols: cols});

        var xstep = (width - 2*margin) / cols;
        var ystep = (height - 2*margin) / rows;
        var resultText = $('#result-text');

        drawAllPath();
        $('#start, #goal').show();

        // パス表示
        function onMessage(e) {
            var data = e.data;
            drawAllPath();
            if(data.path) {
                drawPath(data.path);
            }
            if(data.count) {
                showCount(data.count);
            }
            if(data.time) {
                console.log('Time: ' + data.time + 'ms');
            }
        }

        // 描画
        function drawAllPath() {
            var i, p1, p2;
            ctx.beginPath();
            ctx.clearRect(0, 0, width, height);
            ctx.lineWidth = 3;
            ctx.strokeStyle = 'black';

            //横線
            for(i=0;i<=rows;i++) {
                p1 = toScreen(0, i);
                p2 = toScreen(cols, i);

                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
            }

            //縦線
            for(i=0;i<=cols;i++) {
                p1 = toScreen(i, 0);
                p2 = toScreen(i, rows);

                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
            }
            ctx.stroke();
        }

        // パスの描画
        function drawPath(path) {
            ctx.lineWidth = 7;
            ctx.strokeStyle = '#d24e63';
            ctx.beginPath();
            var i, p;
            p = toScreen(path[0], path[1]);
            ctx.moveTo(p.x, p.y);
            for(i=2;i<path.length;i+=2) {
                p = toScreen(path[i], path[i+1]);
                ctx.lineTo(p.x, p.y);
                if(path[i]==cols && path[i+1]==rows) break;
            }
            //console.log(path);
            ctx.stroke();
        }

        // 経路数の表示
        function showCount(count) {
            var s = '';
            if(count >= 1E12) {
                s = join(s, Math.floor(count / 1E12)) + '兆';
                count %= 1E12;
            }
            if(count >= 100000000) {
                s = join(s, Math.floor(count / 1E8)) + '億';
                count %= 1E8;
            }
            if(count >= 1E4) {
                s = join(s, Math.floor(count / 1E4)) + '万';
                count %= 1E4;
            }
            s = join(s, count);
            resultText.text(s);

            function join(s, count) {
                if(s=='' || count>=1000) {
                    return s + count;
                } else if(count>=100) {
                    return s + '0' + count;
                } else if(count>=10) {
                    return s + '00' + count;
                }
                return s + '000' + count;
            }
        }

        // 画面上の位置を計算
        function toScreen(x, y) {
            return {
                x: x * xstep + margin,
                y: y * ystep + margin
            };
        }
    }

    function resize() {
        var canvas = $('#path');
        var pos = canvas.offset();
        var scale = canvas.width() / canvas.attr('width');
        $('#start').css({
            top: pos.top + margin * scale,
            left: pos.left + margin * scale
        });
        $('#goal').css({
            top: pos.top + canvas.height() - margin * scale,
            left: pos.left + canvas.width() - margin * scale
        });
    }

    $(window).resize(resize);
    resize();

    $('input').click(function() {
        start($(this).attr('rows')*1, $(this).attr('cols')*1);
    });
});
