var letscount = require('./fastcount');

// 比較のテスト
(function cmp_test() {
    var cmp = letscount.cmp;

    assertEqual(cmp([0], [0]), 0, '0==0');
    assertEqual(cmp([5], [10]), -1, '5<10');
    assertEqual(cmp([10], [5]), 1, '10>5');

    assertEqual(cmp([0, 1], [0, 1]), 0, '10000==10000');
    assertEqual(cmp([0, 1], [0, 2]), -1, '10000<20000');
    assertEqual(cmp([0, 2], [0, 1]), 1, '20000>10000');

    assertEqual(cmp([9999, 1], [0, 2]), -1, '19999<20000');
    assertEqual(cmp([9999], [0, 1]), -1, '9999<10000');
})();

// 足し算のテスト
(function add_test() {
    var add = letscount.add;

    assertEqualArray(add([0], [1]), [1], '0+1=1');
    assertEqualArray(add([100], [200]), [300], '100+200=300');
    assertEqualArray(add([5000], [5000]), [0,1], '5000+5000=1,0000');
    assertEqualArray(add([9999, 9999, 9999], [1]), [0,0,0,1], '9999,9999,9999+1=1,0000,0000');
    assertEqualArray(
        add([9999, 9999, 9999], [9999, 9999, 9999]),
        [9998, 9999, 9999, 1],
        '9999,9999,9999+9999,9999,9999=1,9999,9999,9998');
})();

// 掛け算のテスト
(function mul_test() {
    var mul = letscount.mul;

    assertEqualArray(mul([10], [11]), [110], '10*11=110');
    assertEqualArray(mul([100], [100]), [0,1], '100*100=1,0000');
    assertEqualArray(mul([1111, 1111, 1], [1111, 1111, 1]), [4321, 8765, 6789, 2345, 1], '111111111*111111111=1,2345,6789,8765,4321');
})();

// Mapのテスト
(function map_test() {
    var Map = letscount.Map;

    // 文字列から作成
    var s = ('xxxxx\n' +
             'xdoox\n' +
             'xooox\n' +
             'xoodx\n' +
             'xxxxx\n');
    assertEqual(
        (new Map(s)).tostring(),
        s
    );

    // 大きさを指定して作成
    assertEqual(
        (new Map(3,3)).tostring(),
        ('xxx\n' +
         'xox\n' +
         'xxx\n')
    );

    // 各点の値を指定して作成
    assertEqual(
        (new Map(3,3, 'z')).tostring(),
        ('zzz\n' +
         'zzz\n' +
         'zzz\n')
    );

    // 各点の値を関数で指定して作成
    assertEqual(
        (new Map(3,3, function(x, y) {
            return x + y;
        })).tostring(),
        ('012\n' +
         '123\n' +
         '234\n')
    );

})();

// Mapからの検索テスト
(function map_find_test() {
    var Map = letscount.Map;

    var s = ('xxxxx\n' +
             'xdoox\n' +
             'xooox\n' +
             'xoodx\n' +
             'xxxxx\n');
    var m = new Map(s);

    assertEqualArray(m.find('d'), [1, 1]);
    m.data[1][1] = 'c';
    assertEqualArray(m.find('d'), [3, 3]);
    assertEqual(m.find('a'), null);
})();

// Mapからの検索テスト
(function map_findall_test() {
    var Map = letscount.Map;

    var s = ('xxxxx\n' +
             'xdoox\n' +
             'xooox\n' +
             'xoodx\n' +
             'xxxxx\n');
    var m = new Map(s);
    var res = m.findAll('d');
    assertEqualArray(res[0], [1, 1]);
    assertEqualArray(res[1], [3, 3]);
})();

// Map.cloneのテスト
(function map_clone_test() {
    var Map = letscount.Map;

    var s = ('xxxxx\n' +
             'xdoox\n' +
             'xooox\n' +
             'xoodx\n' +
             'xxxxx\n');
    var m = new Map(s);
    var m2 = m.clone();

    // クローン元とクローン結果は等しい
    assertEqual(m2.tostring(), s);

    // クローン元を変更してもクローン結果は変わらない
    m.data[0][0] = '*';
    assertEqual(m2.tostring(), s);
})();


// 指定点からすべての点への移動距離を計算
(function map_distmap_test() {
    var Map = letscount.Map;
    var s, m;
    var x = Infinity;

    s = ('xxxxx\n' +
         'xooox\n' +
         'xooox\n' +
         'xooox\n' +
         'xxxxx\n');
    m = (new Map(s)).distmap(1, 1);

    assertEqualArray(m.data[0], [x, x, x, x, x]);
    assertEqualArray(m.data[1], [x, 0, 1, 2, x]);
    assertEqualArray(m.data[2], [x, 1, 2, 3, x]);
    assertEqualArray(m.data[3], [x, 2, 3, 4, x]);
    assertEqualArray(m.data[4], [x, x, x, x, x]);

    s = ('xxxxxx\n' +
         'xoooox\n' +
         'xoooox\n' +
         'xxxxox\n' +
         'xoxoox\n' +
         'xxxxxx\n');
    m = (new Map(s)).distmap(1, 1);

    assertEqualArray(m.data[0], [x, x, x, x, x, x]);
    assertEqualArray(m.data[1], [x, 0, 1, 2, 3, x]);
    assertEqualArray(m.data[2], [x, 1, 2, 3, 4, x]);
    assertEqualArray(m.data[3], [x, x, x, x, 5, x]);
    assertEqualArray(m.data[4], [x, x, x, 7, 6, x]);
    assertEqualArray(m.data[5], [x, x, x, x, x, x]);
})();

// 一方通行しかできない道を削除
(function map_removeoneway_test() {
    var Map = letscount.Map;
    var x = Infinity;
    var s, m;

    s = ('xxxxxxx\n' +
         'xooooox\n' +
         'xxxxxxx\n'
        );
    m = (new Map(s)).distmap(1,1).removeOneWay();
    assertEqualArray(m.data[0], [x, x, x, x, x, x, x], '\n'+s+0);
    assertEqualArray(m.data[1], [x, x, x, x, x, x, x], '\n'+s+1);
    assertEqualArray(m.data[2], [x, x, x, x, x, x, x], '\n'+s+2);

    s = ('xxx\n' +
         'xox\n' +
         'xox\n' +
         'xox\n' +
         'xox\n' +
         'xox\n' +
         'xxx\n'
        );
    m = (new Map(s)).distmap(1,1).removeOneWay();
    assertEqualArray(m.data[0], [x, x, x], '\n'+s+0);
    assertEqualArray(m.data[1], [x, x, x], '\n'+s+1);
    assertEqualArray(m.data[2], [x, x, x], '\n'+s+2);
    assertEqualArray(m.data[3], [x, x, x], '\n'+s+3);
    assertEqualArray(m.data[4], [x, x, x], '\n'+s+4);
    assertEqualArray(m.data[5], [x, x, x], '\n'+s+5);
    assertEqualArray(m.data[6], [x, x, x], '\n'+s+6);

    s = ('xxxxx\n' +
         'xooox\n' +
         'xxxox\n' +
         'xooox\n' +
         'xxxxx\n'
        );
    m = (new Map(s)).distmap(1,1).removeOneWay();
    assertEqualArray(m.data[0], [x, x, x, x, x], '\n'+s+0);
    assertEqualArray(m.data[1], [x, x, x, x, x], '\n'+s+1);
    assertEqualArray(m.data[2], [x, x, x, x, x], '\n'+s+2);
    assertEqualArray(m.data[3], [x, x, x, x, x], '\n'+s+3);
    assertEqualArray(m.data[4], [x, x, x, x, x], '\n'+s+4);

    s = ('xxxxx\n' +
         'xooox\n' +
         'xoxxx\n' +
         'xooox\n' +
         'xxxxx\n'
        );
    m = (new Map(s)).distmap(1,1).removeOneWay();
    assertEqualArray(m.data[0], [x, x, x, x, x], '\n'+s+0);
    assertEqualArray(m.data[1], [x, x, x, x, x], '\n'+s+1);
    assertEqualArray(m.data[2], [x, x, x, x, x], '\n'+s+2);
    assertEqualArray(m.data[3], [x, x, x, x, x], '\n'+s+3);
    assertEqualArray(m.data[4], [x, x, x, x, x], '\n'+s+4);

    s = ('xxxxx\n' +
         'xooox\n' +
         'xooox\n' +
         'xooox\n' +
         'xxxxx\n'
        );
    m = (new Map(s)).distmap(1,1).removeOneWay();
    assertEqualArray(m.data[0], [x, x, x, x, x], '\n'+s+0);
    assertEqualArray(m.data[1], [x, 0, 1, 2, x], '\n'+s+1);
    assertEqualArray(m.data[2], [x, 1, 2, 3, x], '\n'+s+2);
    assertEqualArray(m.data[3], [x, 2, 3, 4, x], '\n'+s+3);
    assertEqualArray(m.data[4], [x, x, x, x, x], '\n'+s+4);

    s = ('xxxxxxx\n' +
         'xooxoox\n' +
         'xooooox\n' +
         'xooxoox\n' +
         'xxxxxxx\n'
        );
    m = (new Map(s)).distmap(1,1).removeOneWay();
    assertEqualArray(m.data[0], [x, x, x, x, x, x, x], '\n'+s+0);
    assertEqualArray(m.data[1], [x, 0, 1, x, 5, 6, x], '\n'+s+1);
    assertEqualArray(m.data[2], [x, 1, 2, x, 4, 5, x], '\n'+s+2);
    assertEqualArray(m.data[3], [x, 2, 3, x, 5, 6, x], '\n'+s+3);
    assertEqualArray(m.data[4], [x, x, x, x, x, x, x], '\n'+s+4);
})();

// 対象の分析
(function map_test_analyze() {
    var Map = letscount.Map;
    var s, r;

    // 経路なし
    s = ('xxxxxxx\n' +
         'xdoxoox\n' +
         'xooxoox\n' +
         'xooxodx\n' +
         'xxxxxxx\n'
        );
    r = (new Map(s)).analyze();
    assertEqual(r, null);

    // 経路あり
    s = ('xxxxxxxx\n' +
         'xdoxxoox\n' +
         'xoooooox\n' +
         'xooxxodx\n' +
         'xxxxxxxx\n'
        );
    r = (new Map(s)).analyze();
    assertEqual(r.length, 2);
    assertEqual(r[0].tostring(),
                'xxxx\n' +
                'xdox\n' +
                'xodx\n' +
                'xoox\n' +
                'xxxx\n'
               );
    assertEqual(r[1].tostring(),
                'xxxx\n' +
                'xoox\n' +
                'xdox\n' +
                'xodx\n' +
                'xxxx\n'
               );

    // 分岐あり
    s = ('xxxxxxxx\n' +
         'xdoxxoox\n' +
         'xoooooox\n' +
         'xoxxxoox\n' +
         'xooxxoox\n' +
         'xooxxodx\n' +
         'xxxxxxxx\n'
        );
    r = (new Map(s)).analyze();
    assertEqual(r.length, 2);
    assertEqual(r[0].tostring(),
                'xxxx\n' +
                'xdox\n' +
                'xodx\n' +
                'xxxx\n'
               );
    assertEqual(r[1].tostring(),
                'xxxx\n' +
                'xoox\n' +
                'xdox\n' +
                'xoox\n' +
                'xoox\n' +
                'xodx\n' +
                'xxxx\n'
               );

    // 一本道
    s = ('xxxxxxxx\n' +
         'xdooooox\n' +
         'xxxxxxox\n' +
         'xoooooox\n' +
         'xoxxxxxx\n' +
         'xooooodx\n' +
         'xxxxxxxx\n'
        );
    r = (new Map(s)).analyze();
    assertEqual(r.length, 0);
})();

console.log('No error');

// テストのための補助関数

// 等しいか否かをチェックする
function assertEqual(actual, expected, message) {
    if(actual===expected) return;
    var msg = 'Excepted ' + expected + ', but actually ' + actual;
    if(message) msg += ': ' + message;
    throw msg;
}

// 配列が等しいか否かをチェックする
function assertEqualArray(actual, expected, message) {
    var i, length = expected.length;
    var flag = (actual.length === expected.length);

    for(i = 0; i<length && flag; ++i) {
        flag = (actual[i] === expected[i]);
    }

    if(flag) return;
    var msg = 'Excepted ' + expected + ', but actually ' + actual;
    if(message) msg += ': ' + message;
    throw msg;
}
