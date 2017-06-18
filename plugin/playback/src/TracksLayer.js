ol.Playback = ol.Playback || {};
ol.Playback.TrackLayer=function (options) {
    this._map=options.map;
    this._popup=options.popup;
    this.trackSource=new ol.source.Vector();
    this._trackStyle=function(feature,res) {
        var color=feature.get('color');
        if(color==undefined)
            color='#00FF00';
        return [new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: color,
                width: 2
            }),
            image: new ol.style.Circle({
                radius: 5,
                fill: new ol.style.Fill({
                    color: color
                })
            })
        })];
    }
    this.markerSource=new ol.source.Vector();
    this.markerLayerStyle=function(feature,res){
        var rotation=Math.PI/180*feature.get('heading');
        return [
            new ol.style.Style({
                image: new ol.style.Icon({
                    anchor: [0.5, 0.5],
                    rotation:rotation,
                    color:feature.get('color'),
                    src:'image/ship.png'
                }),
                text: new ol.style.Text({
                    textAlign: 'center',
                    textBaseline: 'middle',
                    font: 'Arial',
                    text: feature.get('ship_name')?feature.get('ship_name'):'',
                    size:'8px',
                    fill: new ol.style.Fill({color: '#aa3300'}),
                    stroke: new ol.style.Stroke({color: '#ffffff', width: 3}),
                    offsetX: 0,
                    offsetY: 15,
                    rotation: rotation+(Math.PI/2)
                })
            })
        ];
    }
    var self=this;
    this.tracksLayer =new ol.layer.Vector({
        source: self.trackSource,
        style: self._trackStyle
    });
    this.markerLayer = new ol.layer.Vector({
        source:  self.markerSource,
        style: self.markerLayerStyle
    });
    this.markerSelect=new ol.interaction.Select({
        layers:[self.markerLayer]
    });

    this.markerSelect.on('select',function(e){
        var feature= e.selected[0];
        if(feature==undefined)
            return;
        var coor=feature.getGeometry().getCoordinates();
        var coor1=ol.proj.toLonLat(coor);
        var content=`<p>经纬度：${coor1[0].toFixed(4)} ${coor1[1].toFixed(4)}</p></br>
        <p>角度：${feature.get('heading').toFixed(4)}</p></br>
        <p>时间：${new Date(parseInt(feature.get('time'))).toLocaleString().replace(/:\d{1,2}$/,' ')}</p>`;
        self._popup.show(feature.getId(),coor,content);
        //trackpopup.show(feature.getId(),coor,content);
    });
}
ol.Playback.TrackLayer.prototype.createLayer=function(){
    this._map.addLayer(this.tracksLayer);
    this._map.addLayer(this.markerLayer);
    this._map.addInteraction(this.markerSelect);
}
ol.Playback.TrackLayer.prototype.destoryLayer=function(){
    this._map.removeLayer(this.tracksLayer);
    this._map.removeLayer(this.markerLayer);
    this._map.removeInteraction(this.markerSelect);
}
ol.Playback.TrackLayer.prototype.getPopup=function() {
    return this._popup;
}

