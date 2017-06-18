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
    var playback=new ol.Playback(map, demoTracks,null);
    var control=new PlayBackControl({
        playback:playback
    });
    map.addControl(control);
    control.Setup();//注册dom事件
       
};
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

