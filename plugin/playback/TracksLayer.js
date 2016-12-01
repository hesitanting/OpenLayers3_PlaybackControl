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

