var isWebWorker = typeof require === 'undefined';

// 比較を行う
function cmp(a, b) {
    var i;
    var length = Math.max(a.length, b.length);
    var digita, digitb;
    for(i = length-1; i >= 0; --i) {
        digita = a[i] || 0;
        digitb = b[i] || 0;
        if(digita < digitb) return -1;
        if(digita > digitb) return 1;
    }
    return 0;
}

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

if(!isWebWorker) {
    // デバッグ用に関数をエクスポート
    module.exports = {
        cmp: cmp,
        add: add
    };
}
