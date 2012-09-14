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
