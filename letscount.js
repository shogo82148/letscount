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

            // ピコピコ終わり
            picopico.stop();
        }
        if(rows<=0 || cols<=0) return ;

        //ピコピコする
        picopico.start();

        // 画面更新
        $('#problem-text').text(rows + '×'+  cols);

        // 新しいワーカーを作成・初期化
        var workerjs = $('#tell').is(':checked') ? 'simpath.js' : 'count.js';
        worker = new Worker(workerjs + '?' + Math.random());
        worker.addEventListener('message', onMessage, false);
        worker.postMessage({rows: rows, cols: cols});

        var xstep = (width - 2*margin) / cols;
        var ystep = (height - 2*margin) / rows;
        var resultText = $('#result-text');
        var units = ['', '万', '億', '兆', '京', '垓', '𥝱', '穣', '溝', '澗', '正', '載', '極', '恒河沙', '阿僧祇', '那由他', '不可思議', '無量大数']; // 大きな数の単位

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
                picopico.stop();
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
            var s = '', i;
            for(i=0;i<count.length;i++) {
                s = (count[i+1] ? addzero(count[i]) : count[i]) + (units[i] || '') + s;
            }
            resultText.text(s);

            // 0埋めをする
            function addzero(count) {
                if(count>=1000) {
                    return count;
                } else if(count>=100) {
                    return '0' + count;
                } else if(count>=10) {
                    return '00' + count;
                }
                return '000' + count;
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

    // ピコピコする
    function PicoPico() {
        var AudioContext = window.AudioContext || window.webkitAudioContext;
        this.SAMPLE_RATE = 44100;
        if(AudioContext) {
            this.ctx = new AudioContext();
            this.SAMPLE_RATE = this.ctx.sampleRate;
        }
    }

    PicoPico.prototype.play = function(freqs) {
        var SAMPLE_RATE = this.SAMPLE_RATE;
        var notelength = SAMPLE_RATE * 0.05;
        var ctx = this.ctx;
        var src, buf, data, audio;
        if(ctx) {
            // For Webkit
            buf = ctx.createBuffer(1, freqs.length * notelength , SAMPLE_RATE);
            data = buf.getChannelData(0);
        } else if(window.Audio && window.Float32Array) {
            // For Firefox
            audio = new Audio();
            if(audio.mozSetup) {
                audio.mozSetup(1, this.SAMPLE_RATE);
            }
            data = new Float32Array(freqs.length * notelength);
        } else return;

        // 波形データ作成
        var i, j, offset = 0, x = 0;
        var step;
        var volume = ($('#volume').val() || 100) / 100;
        for(i=0; i<freqs.length; i++) {
            step = 2 * Math.PI * freqs[i] / this.SAMPLE_RATE;
            for(j=0;j<notelength;j++) {
                data[offset] = Math.sin(x)*volume;
                ++offset;
                x += step;
            }
        }

        // 再生
        if(ctx) {
            // for Webkit
            src = ctx.createBufferSource();
            src.buffer = buf;
            src.connect(ctx.destination);
            src.noteOn(0);
        } else {
            // for Firefox
            if(audio.mozWriteAudio) {
                audio.mozWriteAudio(data);
            }
            audio.play();
        }
    };

    // ピコピコ開始
    PicoPico.prototype.start = function() {
        var self = this;
        this.stop();
        this.timer = setInterval(function() {
            var i;
            var freqs = [];
            for(i = 0; i < 10; i++) {
                freqs.push(Math.random()*1200+400);
            }
            self.play(freqs);
        }, 500);
    };

    // ピコピコやめ
    PicoPico.prototype.stop = function() {
        if(!this.timer) return;
        clearInterval(this.timer);
        this.timer = null;
    };

    var picopico = new PicoPico();

    $(window).resize(resize);
    resize();

    $('input[type=button]').click(function() {
        start($(this).attr('rows')*1, $(this).attr('cols')*1);
    });
});
