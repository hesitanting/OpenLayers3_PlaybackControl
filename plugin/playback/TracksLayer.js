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
/*
var markerLayer =new ol.layer.Vector({
    source:  new ol.source.Vector(),
    style: new ol.style.Style({
        image: new ol.style.Icon( ({
            anchor: [0.5, 46],
            anchorXUnits: 'fraction',
            anchorYUnits: 'pixels',
            opacity: 0.75,
            src: 'image/red.png'  //标注的图形
        }))
    })
});
var select=new ol.interaction.Select({
    layers:[markerLayer]
});
select.on('select', function(e) {

});

map.addInteraction(select);*/

