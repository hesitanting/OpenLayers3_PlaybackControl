ol.Playback = ol.Playback || {};
ol.Playback = function (map, geoJSON, callback, options) {
    this.Util = ol.Playback.Util;
    this.options = {
        tickLen: 250,
        speed: 1,
        maxInterpolationTime: 5 * 60 * 1000, // 5 minutes
        tracksLayer: true,
        playControl: false,
        dateControl: false,
        sliderControl: false
        // options
        //mouseOverCallback: fun,
        //clickCallback:fun
    };
    this._map=map;
    this.projCode=this._map.getView().getProjection().getCode();
    this._popup=new ol.Playback.PoPup({map:map});
    this._trackLayer=new ol.Playback.TrackLayer({map:this._map,popup:this._popup});
    this.options.trackLayer=this._trackLayer;
    this._trackController = new ol.Playback.TrackController(map, null, this.options);
    this._trackLayer.createLayer();//创建地图所需对象
    this.options.projCode=this.projCode;
    Clock.call(this,this._trackController,callback,this.options);
    this.setData(geoJSON);//设置gps数据


    if (this.options.playControl) {
        this.playControl = new PlayControl(this);
        this._map.addControl(this.playControl);
    }
    if (this.options.sliderControl) {
        this.sliderControl = new SliderControl(this);
        this._map.addControl(this.sliderControl);
    }
    if (this.options.dateControl) {
        this.dateControl = new DateControl(this, options);
        this._map.addControl(this.dateControl);
    }

};

ol.Playback.prototype.clearData = function(){
    this._trackController.clearTracks();
    this._trackLayer.trackSource.clear();
    this._trackLayer.markerSource.clear();
};

ol.Playback.prototype.setData = function (geoJSON) {
    this.clearData();

    this.addData(geoJSON, this.getTime());

    this.setCursor(this.getStartTime());
};

// bad implementation
ol.Playback.prototype.addData = function (geoJSON, ms) {
    // return if data not set
    if (!geoJSON) {
        return;
    }
    if (geoJSON instanceof Array) {
        for (var i = 0, len = geoJSON.length; i < len; i++) {
            this._trackController.addTrack(new ol.Playback.Track(geoJSON[i], this.options), ms);
        }
    } else {
        if (geoJSON.type == "FeatureCollection") {
            for (var i = 0, len = geoJSON.features.length; i < len; i++) {
                this._trackController.addTrack(new ol.Playback.Track(geoJSON.features[i], this.options), ms);
            }
        } else {
            this._trackController.addTrack(new ol.Playback.Track(geoJSON, this.options), ms);
        }
    }
    if (this.options.tracksLayer) {
        var geojsonformat=new ol.format.GeoJSON();
        var geojsonRoot = {
            type: 'FeatureCollection',
            features : geoJSON
        };
        var features=geojsonformat.readFeatures(geojsonRoot);
        var projCode=this.projCode;
        features.forEach(function(feature,index){
            if(projCode== 'EPSG:3857')
                feature.setGeometry(feature.getGeometry().transform('EPSG:4326','EPSG:3857'));
            var options=feature.get('path_options');
            var color;
            if(options!==undefined&&options.color!==undefined)
            {
                color=options.color;
                var style=new ol.style.Style({
                    image: new ol.style.Circle({
                        radius: 5,
                        fill: new ol.style.Fill({
                            color: color
                        })
                    })
                });
                feature.setStyle(style);
            }
        });
        this._trackLayer.trackSource.addFeatures(features);
    }
};

ol.Playback.prototype.destroy= function() {
    this.clearData();
    if (this.playControl) {
        this._map.removeControl(this.playControl);
    }
    if (this.sliderControl) {
        this._map.removeControl(this.sliderControl);
    }
    if (this.dateControl) {
        this._map.removeControl(this.dateControl);
    }
    this._trackLayer.destoryLayer();
}

