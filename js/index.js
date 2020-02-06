/**
 * Copyright 2014-2019, FengMap, Ltd.
 * All rights reserved.

 * @authors  zm (zhangmei@fengmap.com)
 * @date     2019/7/4 下午4:34
 * @describe
 */

//定义全局map变量
var map = null;
//定义地图ID变量
var fmapID = '10347';
//所有货箱数据
var boxDataList = [];
//所有货箱数据
var initResult = [];
//获取cookies中已存在货箱
var storageCookies = null;
//临时对象
var cookies_temp = null;
//表单对象
var form = null;
//货箱box集合
var mapBoxData = {};
//索引最大值
var maxIndex = 1;
//上一次选中模型
var selectModel = null;
//点击前颜色
var defaultColor = null;
//设置高亮颜色
var hightLightColor = '#FF0000';
//模拟开关
var switchFlag = false;
//数据模拟对象
var simulator = null;
//模拟盒子集合
var simulateData = {};
//定义定位点marker
var locationMarker;
//初始化模拟盒子集合
var initData = {};
//地图是否加载完成
var mapIsOk = false;
//选中货柜
var selectedBoxName = "";
$(function () {

    Date.prototype.Format = function (fmt) {
        var o = {
            "M+": this.getMonth() + 1, //月份
            "d+": this.getDate(), //日
            "H+": this.getHours(), //小时
            "m+": this.getMinutes(), //分
            "s+": this.getSeconds(), //秒
            "q+": Math.floor((this.getMonth() + 3) / 3), //季度
            "S": this.getMilliseconds() //毫秒
        };
        if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
        for (var k in o)
            if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        return fmt;
    };

    //加载地图
    initMap();

    //初始化form表单元素
    layui.use('form', function () {
        form = layui.form; //只有执行了这一步，部分表单元素才会自动修饰成功

        //但是，如果你的HTML是动态生成的，自动渲染就会失效
        //因此你需要在相应的地方，执行下述方法来手动渲染，跟这类似的还有 element.init();
        form.render();

        //更新货箱列表
        initBoxData();

        //监听提交
        form.on('submit(formDemo)', function (data) {
            var formData = data.field;

            var numData = formData.numData == '' ? 0 : parseInt(formData.numData);
            var wideData = parseFloat(formData.wideData) / 100;
            var heightData = parseFloat(formData.heightData) / 100;
            var longData = parseFloat(formData.longData) / 100;
            var statusData = formData.statusData;
            var storageData = formData.storageData;
            //状态
            var boxStatus = $('#statusData').find('option:selected').text();
            if (numData <= 0) {
                layer.alert('请输入数量！');
                return;
            }
            var storageText = $('#storageData').find('option:selected').text();
            var length = storageCookies && storageCookies[storageText] ? storageCookies[storageText].length : 0;
            for (var i = 0; i < numData; i++) {
                var box = new fengmap.FreightBox({
                    width: wideData,
                    height: heightData,
                    length: longData,
                    time: new Date().getTime()
                });
                box.setColor(statusData);
                box.boxStatus = boxStatus;
                box.createTime = new Date().Format("yyyy-MM-dd HH:mm:ss");
                map.addBox(1, storageData, box);
                box.name = storageText + "-" + (length + i + 1);
                mapBoxData[box.name] = box;
            }
            map.sortBox(1, storageData);

            //重置数量和货箱名称
            $('#boxNameRange').val('');
            $('#numData').val('');
            storageCookies = Object.assign({}, cookies_temp);
            //更新货箱列表和页面展示
            initBoxData();
            layer.msg('摆放成功！');
        });

        //下拉选择框监听事件
        form.on('select(searchStorage)', function (data) {
            //获取fid
            var fid = parseInt(data.value);
            //获取楼层id
            var groupID = $(data.elem).find('option:selected').attr('data-groupID');
            groupID = parseInt(groupID);
            var group = map.getFMGroup(groupID);
            //获取对应模型对象
            var storageModel = group.getOrCreateLayer("transport").getTransport(fid);
            if (storageModel) {
                //将货位模型聚焦到视野中心
                moveToCenter(storageModel);
            }
            //重置数量和货箱名称
            $('#boxNameRange').val('');
            $('#numData').val('');
        });

        //货箱名称修改
        form.on('select(searchBoxData)', function (data) {
            //获取boxData
            var value = data.value;
            var boxModel = mapBoxData[value];
            //跳转
            moveToCenter(boxModel);
        });
    });

    //运行刷新，重置locationMarker
    if (locationMarker) {
        locationMarker = null;
    }

});





//将model对象聚焦到视野中心
function moveToCenter(model) {
    //将货位模型聚焦到视野中心
    map.moveTo({
        x: model.mapCoord.x,
        y: model.mapCoord.y,
        z: 0,
        groupID: model.groupID,
        time: 0.5
    });
    //将模型高亮显示
    if (selectModel && selectModel != model) {
        //还原上次选中模型的原始颜色
        selectModel.setColor(defaultColor);
    }

    //保存当前选中模型的原始颜色
    defaultColor = model.color;
    //设置当权选中模型的高亮颜色
    model.setColor(hightLightColor);
    //设置当前选中模型
    selectModel = model;
}

//初始化地图
function initMap() {
    var mapOptions = {
        //必要，地图容器
        container: document.getElementById('fengMap'),
        // //地图数据位置
        mapServerURL: 'http://test6.fengmap.com/FMDemoStorage/data/10347',
        // //主题数据位置
        // mapThemeURL: './data/theme',
        // //设置主题
        // defaultThemeName: '2001',
        //必要，地图应用名称，通过蜂鸟云后台创建
        appName: '蜂鸟研发SDK_2_0',
        //必要，地图应用密钥，通过蜂鸟云后台获取
        key: '57c7f309aca507497d028a9c00207cf8'
    };
    //初始化地图对象submit(formDemo
    map = new fengmap.FMMap(mapOptions);

    //打开Fengmap服务器的地图数据和主题
    map.openMapById(fmapID, function (error) {
        //打印错误信息
        console.log(error);
    });

    //地图加载完成事件
    map.on('loadComplete', function () {

        //显示指北针
        map.showCompass = true;
        mapIsOk = true;
        var toolCtlOpt = {
            position: fengmap.FMControlPosition.RIGHT_TOP,
            //位置x,y的偏移量
            offset: {
                x: -20,
                y: -40
            },
            //设置为false表示不显示,即只显示2D,3D切换按钮
            groupsButtonNeeded: false,
            //设置为false表示不显示,即只显示楼层切换按钮
            viewModeButtonNeeded: true
        };
        //创建工具控件
        toolControl = new fengmap.FMToolControl(map, toolCtlOpt);

        // //获取集装箱数据
        map.openTransportJson('./js/data.json', function (layer) {
            layer.every(function (item) {
                item.setColor('#C0C0C0');
                item.setStrokeColor('#A0A0A0');
            });
        });

        //获取json数据，渲染货位下拉菜单
        $.getJSON("./js/data.json", function (data, status) {
            var features = data.features;
            var storageData = '';   //货位列表
            features.map(function (item, index) {
                var attributes = item.attributes;
                storageData += "<option data-groupID='" + attributes.groupID + "' value='" + attributes.FID + "'>" + attributes.NAME + "</option>";
            });
            $('#storageData').html(storageData);
            form.render('select');

            //初始化模拟器
            simulator = new Simulator(data);

            //渲染初始货箱
            // var initResult = simulator.createDatas(600);
            $.getJSON("./js/box.json", function (data){
                initResult=data;
                for (var i = 0; i < initResult.length; i++) {
                    var data = initResult[i];
                    if (data) {
                        addBoxFunc(data, 'initData');
                    }
                }
            })
            
        });

        /**
         * 这个方法是示例的定位sdk回调，实际根据使用的定位sdk不同，接口名称和方式可能会有差异
         * */
        updateLocation( (data)=> {
            // console.log('aa',data)
            if (mapIsOk) {
                if (!locationMarker) {
                    console.log('bb',data.x,data.y)
                    /**
                     * fengmap.FMLocationMarker 自定义图片标注对象，为自定义图层
                     * https://www.fengmap.com/docs/js/v2.4.0_beta/fengmap.FMLocationMarker.html
                     */
                    locationMarker = new fengmap.FMLocationMarker({
                        //x坐标值
                        x: data.x,
                        y: data.y,
                        //图片地址
                        url: './images/location.png',
                        //楼层id
                        groupID: 1,
                        //图片尺寸
                        size: 22,
                        //marker标注高度
                        height: 1,
                        callback: function () {
                            //回调函数
                            console.log('定位点marker加载完成！');
                        }
                    });
                    //添加定位点marker
                    map.addLocationMarker(locationMarker);
                } else {
                    console.log('cc')
                    //旋转locationMarker
                     locationMarker.rotateTo({to: data.angle, duration: 1});
                    //移动locationMarker
                    locationMarker.moveTo({x: data.x, y: data.y, groupID: 1});
                }
            }
        })

    });

    map.on('mapClickNode', function (event) {
        var boxModel = event.target;
        if (selectModel && boxModel != selectModel) {
            if (defaultColor) {
                selectModel.setColor(defaultColor);
            }
        }
        if (boxModel && boxModel.nodeType == fengmap.FMNodeType.BOX) {
            //原始颜色
            var color = boxModel.color;
            defaultColor = color;
            //设置高亮
            boxModel.setColor(hightLightColor);
            selectModel = boxModel;
            //显示详情数据
            showDetail(boxModel);
            selectedBoxName=boxModel.name
        } else {
            $('#detailCont').css('display', 'none');
        }
    });
}

//展示详情
function showDetail(model) {
    $('#dNameData').html(model.name);
    $('#dLongData').html(model.length);
    $('#dWideData').html(model.width);
    $('#dHeightData').html(model.height);
    $('#dStatusData').html(model.boxStatus);
    $('#dTimeData').html(model.createTime);
    //获取随机数
    var randomNum = Math.floor(Math.random() * 3 + 1);
    var imgSrc = './images/storage' + randomNum + '.jpeg';
    $('#imgId').attr('src', imgSrc);
    $('#detailCont').css('display', 'block');
}

//初始化货箱信息
function initBoxData() {
    var boxDataHtml = '';
    console.log('test',storageCookies)
    if (storageCookies) {
        $.each(storageCookies, function (item, val) {
            if (val && val.length > 0) {
                val.map(function (vItem, vIndex) {
                    boxDataList.push(vItem);
                    boxDataHtml += "<option value='" + vItem + "'>" + vItem + "</option>";
                });
            }
        });
    }
    $('#boxData').html(boxDataHtml);
    form.render('select');
}

//修改数量
function onChangeNum(target) {
    var value = target.value;
    if (value) {
        var jsonTemp = JSON.stringify(storageCookies);
        cookies_temp = JSON.parse(jsonTemp);
        value = parseInt(value);
        //获取货位信息
        var storageData = $('#storageData').find('option:selected').text();
        var initIndex = 0;  //初始索引
        var storageBoxData = [];   //货位下所有货箱数据
        if (cookies_temp) {
            storageBoxData = cookies_temp[storageData] ? cookies_temp[storageData] : [];
            if (storageBoxData && storageBoxData.length > 0) {
                initIndex = storageBoxData.length;
            }
        } else {
            cookies_temp = {};
        }

        //根据数量生成名称
        var maxNum = value + initIndex;
        var addBoxData = [];
        for (var i = initIndex + 1; i <= maxNum; i++) {
            var item = storageData + '-' + i;
            if (!storageBoxData || storageBoxData.indexOf(item) == -1) {
                storageBoxData.push(item);
                addBoxData.push(item);
                maxIndex = i;
            }
        }
        var boxLength = addBoxData.length;
        var boxInfo = '';
        if (boxLength > 0) {
            boxInfo += addBoxData[0];
        }

        if (boxLength > 1) {
            boxInfo = boxInfo + '～' + addBoxData[boxLength - 1];
        }

        $('#boxNameRange').val(boxInfo);
        cookies_temp[storageData] = storageBoxData;
    }
}

//删除盒子
function deleteBox() {
    initResult.map(function (item, index) {
        if (selectedBoxName == item.name) {
            initResult.splice(index, 1);
            var boxObj= initData[item.name]
            var boxParent = boxObj.parent;
            boxParent.removeBox(boxObj);
            boxParent.computeNormalBoxPos();
            map.sortBox(1, item.FID);
        }
    });
    console.log('initResult',initResult)
    // var selectItem = $('#boxData').find('option:selected').val();
    // boxDataList.map(function (item, index) {
    //     if (selectItem == item) {
    //         boxDataList.splice(index, 1);
    //     }
    // });
    // var box = mapBoxData[selectItem];
    // var sIndex = selectItem.indexOf('-');
    // var storageData = selectItem;
    // if (sIndex != -1) {
    //     storageData = storageData.substring(0, sIndex);
    // }
    // if (box) {
    //     var boxParent = box.parent;
    //     boxParent.removeBox(box);
    //     boxParent.computeNormalBoxPos();
    // }
    // delete mapBoxData[selectItem];

    // var sBoxData = storageCookies[storageData];
    // if (sBoxData && sBoxData.length > 0) {
    //     sBoxData.map(function (item, index) {
    //         if (item == selectItem) {
    //             sBoxData.splice(index, 1);
    //         }
    //     });
    // }
    //  initBoxData();
}

//数据模拟
function simulate() {
    if (!switchFlag) {
        simulator.start(200, function (datas) {
            for (var i = 0; i < datas.length; i++) {
                addBoxFunc(datas[i]);
            }
        });
        switchFlag = true;
        $('#simulator').html('停止模拟');
        $("input").attr('disabled', 'disabled');
        $("select").attr('disabled', 'disabled');
        $("#deleteBtn").attr('disabled', 'disabled');
        $("#playBtn").attr('disabled', 'disabled');
    } else {
        //停止模拟
        simulator.stop();
        for (var item in simulateData) {
            var box = simulateData[item];
            console.log('box',box)
            if (box) {
                var boxParent = box.parent;
                boxParent.removeBox(box);
                boxParent.computeNormalBoxPos();

                //更新数据
                delete simulateData[item];
            }
        }
        switchFlag = false;
        $('#simulator').html('数据模拟');
        $("input").attr('disabled', false);
        $("select").attr('disabled', false);
        $("#deleteBtn").attr('disabled', false);
        $("#playBtn").attr('disabled', false);
    }
}

//模拟数据添加盒子
function addBoxFunc(data, type) {
    if (!data || !data.name) {
        return;
    }
    var name = data.name;
    var length = data.length;
    var width = data.width;
    var height = data.height;
    var operation = data.operation;
    var fid = data.FID;
    var color = data.color;
    if (operation == 'add' && fid != 31) {
        var box = new fengmap.FreightBox({
            width: parseFloat(width) / 100,
            height: parseFloat(height) / 100,
            length: parseFloat(length) / 100,
            time: new Date().getTime()
        });
        box.setColor(color);
        box.createTime = new Date().Format("yyyy-MM-dd HH:mm:ss");
        box.name = name;
        box.fid = fid;
        map.addBox(1, fid, box);
        if(type == 'initData'){
            initData[name] = box;
        }else{
            simulateData[name] = box;
        }
        // console.log('tt',initData)
        map.sortBox(1, fid);
    } else if (operation == 'remove') {
        var boxObj = simulateData[name];
        if (boxObj) {
            var fid = boxObj.fid;
            var boxParent = boxObj.parent;
            boxParent.removeBox(boxObj);
            boxParent.computeNormalBoxPos();

            //更新数据
            delete simulateData[name];
            map.sortBox(1, fid);
        }
    }
}

/*//删除盒子
function deleteBox(boxObj) {
    var fid = boxObj.fid;
    var boxParent = boxObj.parent;
    boxParent.removeBox(boxObj);
    boxParent.computeNormalBoxPos();

    //更新数据
    delete simulateData[name];
    map.sortBox(1, fid);
}*/



