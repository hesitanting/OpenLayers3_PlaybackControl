
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
    this._trackController = new ol.Playback.TrackController(map, null, this.options);
    Clock.call(this,this._trackController,callback,this.options);
    this._map=map;

    //轨迹图层
    /*if (this.options.tracksLayer) {
        //this._tracksLayer = TracksLayer;
        //this._map.addLayer(TracksLayer);
        //map.addLayer(this._tracksLayer);
        this._map.addLayer(TracksLayer);
        this._tracksLayer = TracksLayer;
    }*/
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

ol.Playback.prototype=new Clock();

ol.Playback.prototype.clearData = function(){
    this._trackController.clearTracks();
    if (this._tracksLayer)
        this._map.removeLayer(this._tracksLayer);
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

    //this._map.fire('playback:set:data');

    if (this.options.tracksLayer) {
        var geojsonformat=new ol.format.GeoJSON();
        var geojsonRoot = {
            type: 'FeatureCollection',
            features : geoJSON
        };
        var features=geojsonformat.readFeatures(geojsonRoot);
        //4326要转3857
        features.forEach(function(feature,index){
            feature.setGeometry(feature.getGeometry().transform('EPSG:4326','EPSG:3857'));
        });
        TracksLayer.getSource().addFeatures(features);
        this._tracksLayer=TracksLayer;
        if(!hasLayerInMap(TracksLayer))
            this._map.addLayer(TracksLayer);
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
    this._map.removeLayer(this._tracksLayer);
}
