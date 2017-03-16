var TracksLayer =new ol.layer.Vector({
        source:  new ol.source.Vector(),
        style: new ol.style.Style({
            image: new ol.style.Circle({
                radius: 5,
                fill: new ol.style.Fill({
                    color: '#00FF00'
                })
            })
        })
    });


/*ol.Playback.MarkerLayer=function(options){
    this.map=options.map;
    this.
}*/
var markerSource=new ol.source.Vector();
var MarkerLayer = new ol.layer.Vector({
    source:  markerSource,
    style: markerLayerStyle
});
function markerLayerStyle(feature,res){
    var rotation=Math.PI/180*feature.get('heading');

    console.log(rotation);
    return [
        new ol.style.Style({
            image: new ol.style.Icon({
                anchor: [0.5, 0.5],
                rotation:rotation,
                src:'image/ship.png'
            })
        })
    ];
}
