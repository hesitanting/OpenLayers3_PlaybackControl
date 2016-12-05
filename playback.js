var map;
function init(){
    var basemapLayer =  new ol.layer.Tile({
        source: new ol.source.XYZ({
            url: 'http://{a-c}.tiles.mapbox.com/v3/github.map-xgq2svrz/{z}/{x}/{y}.png'
        })
    });


    map=new ol.Map({
        controls:[],
        layers: [basemapLayer],
        target: 'map',
        view: new ol.View({
            center: ol.proj.fromLonLat([-123.4726739,44.61131534]),
            zoom: 9
        })
    });




    // Colors for AwesomeMarkers
    var _colorIdx = 0,
        _colors = [
          'orange',
          'green',
          'blue',
          'purple',
          'darkred',
          'cadetblue',
          'red',
          'darkgreen',
          'darkblue',
          'darkpurple'
        ];
        
    function _assignColor() {
        return _colors[_colorIdx++%10];
    }
    
    // =====================================================
    // =============== Playback ============================
    // =====================================================

    // Add data
    //playback.addData(blueMountain);
    var popup=new PoPup();
    map.addOverlay(popup.popup);
    var playback=new ol.Playback(map, demoTracks,null, {
        popup:popup,
        mouseOverCallback:function(e){
            console.log('我被鼠标滑过了');
        },
        clickCallback:function(coor){
            console.log('我被点击了');
            //showPopup(coor);
        }
    });
    var control=new Example2_Control({
        playback:playback
    });
    map.addControl(control);
    control.Setup();//注册dom事件
       
};






function showPopup(coor){
    popup.content.innerHTML = '<h3>GPS消息</h3>'+
        '<p>测试使用</p>';
    popup.popup.setPosition(coor);
}
function closePopup(){
    popup.popup.setPosition(undefined);
    popup.popupCloseElement.blur();
    return false;
}



//判断当前图层是否存在地图中
function hasLayerInMap(layer){
    var layers=map.getLayers();
    for(var i=0;i<layers.getLength();i++){
        var item=layers.item(i);
        if(item===layer)
            return true;
    }
    return false;
}

