/**
 * 这是一个模拟的定位sdk，用来定期返回位置更新,仅用作参考。
 * */
var _mockdata = [
    {x: 12677257.498472929, y: 2633465.8578036646, angle: 0},   
    {x: 12677260.95229203, y: 2633464.8821818912, angle: 0},
    {x: 12677272.99205318, y: 2633471.953369043, angle: 0},
    {x: 12677285.42290829, y: 2633480.864438018, angle: 0},
    {x: 12677281.258894155, y: 2633489.114170847, angle: 0},
    {x: 12677285.42290829, y: 2633480.864438018, angle: 0},
    {x: 12677272.99205318, y: 2633471.953369043, angle: 0},
    {x: 12677260.95229203, y: 2633464.8821818912, angle: 0},
];
var _callback;
var _update;
var _updateInternal;
var _freq = 800;
var _index = 0;

/**
 * 模拟更新位置，按照时间间隔更新位置信息。
 * @param {*} 回调函数
 */
function updateLocation(cb) {
    _callback = function () {
        var _data;
        if (_index > _mockdata.length - 1) {
            _index = 0;
        }
        _data = _mockdata[_index];
        _index++;
        return cb(_data)
    };
    _update = setInterval(_callback, _freq);
}

/**
 * 停止位置更新
 */
function stopUpdateLocation() {
    clearInterval(_update);
    console.log('update stoped.');
}



