ol.Playback = ol.Playback || {};
Clock = function(trackController, callback, options) {
    if(trackController){
        this._trackController = trackController;
        this._cursor = trackController.getStartTime();
    }
    this._callbacksArry = [];
    if (callback)
        this.addCallback(callback);
    if (options){
        this._speed = options.speed;
        this._tickLen = options.tickLen;
        this._transitionTime = this._tickLen / this._speed;
    }

    this._tick = function (self) {
        if (self._cursor > self._trackController.getEndTime()) {
            clearInterval(self._intervalID);
            return;
        }
        self._trackController.tock(self._cursor, self._transitionTime);
        self._callbacks(self._cursor);
        self._cursor += self._tickLen;
    };
    this._callbacks = function (cursor) {
        var arry = this._callbacksArry;
        for (var i = 0, len = arry.length; i < len; i++) {
            arry[i](cursor);
        }
    };
};
Clock.prototype.addCallback=function(fn) {
    this._callbacksArry.push(fn);
};
Clock.prototype.start=function () {
    if (this._intervalID) return;
    this._intervalID = window.setInterval(
        this._tick,
        this._transitionTime,
        this);
};

Clock.prototype.stop=function () {
    if (!this._intervalID) return;
    clearInterval(this._intervalID);
    this._intervalID = null;
};

Clock.prototype.getSpeed=function() {
    return this._speed;
};

Clock.prototype.isPlaying= function() {
    return this._intervalID ? true : false;
};

Clock.prototype.setSpeed= function (speed) {
    this._speed = speed;
    this._transitionTime = this._tickLen / speed;
    if (this._intervalID) {
        this.stop();
        this.start();
    }
};

Clock.prototype.setCursor=function (ms) {
    var time = parseInt(ms);
    if (!time) return;
    var mod = time % this._tickLen;
    if (mod !== 0) {
        time += this._tickLen - mod;
    }
    this._cursor = time;
    this._trackController.tock(this._cursor, 0);
    this._callbacks(this._cursor);
};

Clock.prototype.getTime=function() {
    return this._cursor;
};

Clock.prototype.getStartTime=function() {
    return this._trackController.getStartTime();
};

Clock.prototype.getEndTime=function() {
    return this._trackController.getEndTime();
};

Clock.prototype.getTickLen=function() {
    return this._tickLen;
};

ol.Playback = ol.Playback || {};
DateControl = function(opt_options) {
    this.options= {
        position : 'bottomleft',
        dateFormatFn: ol.Playback.Util.DateStr,
        timeFormatFn: ol.Playback.Util.TimeStr
    };
    var _options = opt_options || {};
    this.playback = _options.playback;
    var _container = document.createElement('div');
    var self = this;
    var playback = this.playback;
    var time = playback.getTime();
    var datetime = document.createElement('div');
    datetime.className = 'datetimeControl';
    _container.appendChild(datetime);
    this._date = document.createElement('p');
    this._time = document.createElement('p');
    datetime.appendChild(this._date);
    datetime.appendChild(this._time);
    this._date.innerHTML = this.options.dateFormatFn(time);
    this._time.innerHTML = this.options.timeFormatFn(time);

    // setup callback
    playback.addCallback(function (ms) {
        self._date.innerHTML = self.options.dateFormatFn(ms);
        self._time.innerHTML = self.options.timeFormatFn(ms);
    });
    var element = document.createElement('div');
    element.appendChild(_container);

    ol.control.Control.call(this, {
        element: element,
        target: _options.target
    });
}
ol.inherits(DateControl, ol.control.Control);

PlayControl = function(opt_options) {
    this.options = {
        position : 'bottomright'
    };
    var _options = opt_options || {};
    this.playback = _options.playback;
    var _container = document.createElement('div');
    var self = this;
    var playback = this.playback;
    playback.setSpeed(100);

    var playControl =document.createElement('div');
    playControl.className = 'playControl';
    _container.appendChild(playControl);
    this._button=document.createElement('button');
    this._button.innerHTML = 'Play';
    playControl.appendChild(this._button);
    var stop = ol.MapBrowserEvent.stopPropagation();
    this._button.addEventListener('click', stop, false);
    this._button.addEventListener('touchstart', stop, false);
    this._button.addEventListener('dblclick', stop, false);
    this._button.addEventListener('click', ol.MapBrowserEvent.preventDefault(), false);
    this._button.addEventListener('click',play, false);


    function play(){
        if (playback.isPlaying()) {
            playback.stop();
            self._button.innerHTML = 'Play';
        }
        else {
            playback.start();
            self._button.innerHTML = 'Stop';
        }
    }
    var element = document.createElement('div');
    element.appendChild(_container);

    ol.control.Control.call(this, {
        element: element,
        target: _options.target
    });
};
ol.inherits(PlayControl, ol.control.Control);

SliderControl = function(opt_options){
    this.options = {
        position : 'bottomleft'
    };
    this.playback = opt_options.playback;
    var _container = document.createElement('div');
    var self = this;
    var playback = this.playback;

    this._slider =document.createElement('input');
    this._slider.className='slider';
    _container.appendChild(this._slider);
    this._slider.type = 'range'
    this._slider.min = playback.getStartTime();
    this._slider.max = playback.getEndTime();
    this._slider.value = playback.getTime();

    var stop = ol.MapBrowserEvent.stopPropagation();
    this._slider.addEventListener('click', stop, false);
    this._slider.addEventListener('mousedown', stop, false);
    this._slider.addEventListener('dblclick', stop, false);
    this._slider.addEventListener('click', ol.MapBrowserEvent.preventDefault(), false);
    this._slider.addEventListener('change',onSliderChange, false);
    this._slider.addEventListener('mousemove',onSliderChange, false);
    function onSliderChange(e) {
        var val = Number(e.target.value);
        playback.setCursor(val);
    }

    playback.addCallback(function (ms) {
        self._slider.value = ms;
    });

    var element = document.createElement('div');
    element.appendChild(_container);

    ol.control.Control.call(this, {
        element: element,
        target: opt_options.target
    });
};
ol.inherits(SliderControl, ol.control.Control);

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
ol.Playback.prototype=new Clock();
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
        //4326要转3857
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

ol.Playback.PoPup = function(options) {
    this._trackid;
    this._map=options.map;
    var popupElement = document.createElement('div');
    popupElement.className = 'ol-popup';
    this.popupCloseElement = document.createElement('a');
    this.popupCloseElement.href = '#';
    this.popupCloseElement.className = 'ol-popup-closer';
    this.content = document.createElement('div');
    popupElement.appendChild(this.popupCloseElement);
    popupElement.appendChild(this.content);
    this._map.getTargetElement().appendChild(popupElement);
    this.popup = new ol.Overlay(({
        element:popupElement,
        autoPan: true,
        autoPanAnimation: {
            duration: 250
        }
    }));
    var self=this;
    this.popupCloseElement.onclick = function(){
        self._trackid=undefined;
        self.popup.setPosition(undefined);
        this.blur();
        return false;
    }
    this._map.addOverlay(this.popup);
}
ol.Playback.PoPup.prototype.getTrackId=function(){
    return this._trackid;
}
ol.Playback.PoPup.prototype.show=function(id,coor,content){
    this._trackid=id;
    this.content.innerHTML = content;
    this.popup.setPosition(coor);
}
ol.Playback.PoPup.prototype.move=function(id,coor,content){
    if(id!=this._trackid)
        return;
    this.content.innerHTML = content;
    this.popup.setPosition(coor);
}

ol.Playback.Track = function(geoJSON, options) {
    this.options = options || {};
    this._projCode=options.projCode;//坐标系
    var tickLen = options.tickLen || 250;
    this._staleTime = options.staleTime || 60 * 60 * 1000;
    this._fadeMarkersWhenStale = options.fadeMarkersWhenStale || false;
    this._trackLayer=options.trackLayer;
    this.trackline;//播放的轨迹线
    this.firstCoor;//轨迹线初始化点
    this._geoJSON = geoJSON;
    this._tickLen = tickLen;
    this._ticks = [];
    this._marker = null;
    this._orientations = [];
    var sampleTimes = geoJSON.properties.time;
    this._ship_name=geoJSON.properties.ship_name;//船舶名称
    this.ship_id=geoJSON.properties.ship_id;//船舶id
    if(geoJSON.properties.path_options!==undefined)
        this._color=geoJSON.properties.path_options.color;
    console.log(geoJSON.properties.path_options);
    this._orientIcon = options.orientIcons;
    var previousOrientation;
    var samples = geoJSON.geometry.coordinates;
    var currSample = samples[0];
    var nextSample = samples[1];

    var currSampleTime = sampleTimes[0];
    var t = currSampleTime;  // t is used to iterate through tick times
    var nextSampleTime = sampleTimes[1];
    var tmod = t % tickLen; // ms past a tick time
    var rem, ratio;

    // handle edge case of only one t sample
    if (sampleTimes.length === 1) {
        if (tmod !== 0)
            t += tickLen - tmod;
        this._ticks[t] = samples[0];
        this._orientations[t] = 0;
        this._startTime = t;
        this._endTime = t;
        return;
    }

    // interpolate first tick if t not a tick time
    if (tmod !== 0) {
        rem = tickLen - tmod;
        ratio = rem / (nextSampleTime - currSampleTime);
        t += rem;
        this._ticks[t] = this._interpolatePoint(currSample, nextSample, ratio);
        this._orientations[t] = this._directionOfPoint(currSample, nextSample);
        previousOrientation = this._orientations[t];
    } else {
        this._ticks[t] = currSample;
        this._orientations[t] = this._directionOfPoint(currSample, nextSample);
        previousOrientation = this._orientations[t];
    }

    this._startTime = t;
    t += tickLen;
    while (t < nextSampleTime) {
        ratio = (t - currSampleTime) / (nextSampleTime - currSampleTime);
        this._ticks[t] = this._interpolatePoint(currSample, nextSample, ratio);
        this._orientations[t] = this._directionOfPoint(currSample, nextSample);
        previousOrientation = this._orientations[t];
        t += tickLen;
    }

    // iterating through the rest of the samples
    for (var i = 1, len = samples.length; i < len; i++) {
        currSample = samples[i];
        nextSample = samples[i + 1];
        t = currSampleTime = sampleTimes[i];
        nextSampleTime = sampleTimes[i + 1];

        tmod = t % tickLen;
        if (tmod !== 0 && nextSampleTime) {
            rem = tickLen - tmod;
            ratio = rem / (nextSampleTime - currSampleTime);
            t += rem;
            this._ticks[t] = this._interpolatePoint(currSample, nextSample, ratio);
            if (nextSample) {
                this._orientations[t] = this._directionOfPoint(currSample, nextSample);
                previousOrientation = this._orientations[t];
            } else {
                this._orientations[t] = previousOrientation;
            }
        } else {
            this._ticks[t] = currSample;
            if (nextSample) {
                this._orientations[t] = this._directionOfPoint(currSample, nextSample);
                previousOrientation = this._orientations[t];
            } else {
                this._orientations[t] = previousOrientation;
            }
        }

        t += tickLen;
        while (t < nextSampleTime) {
            ratio = (t - currSampleTime) / (nextSampleTime - currSampleTime);

            if (nextSampleTime - currSampleTime > options.maxInterpolationTime) {
                this._ticks[t] = currSample;

                if (nextSample) {
                    this._orientations[t] = this._directionOfPoint(currSample, nextSample);
                    previousOrientation = this._orientations[t];
                } else {
                    this._orientations[t] = previousOrientation;
                }
            }
            else {
                this._ticks[t] = this._interpolatePoint(currSample, nextSample, ratio);
                if (nextSample) {
                    this._orientations[t] = this._directionOfPoint(currSample, nextSample);
                    previousOrientation = this._orientations[t];
                } else {
                    this._orientations[t] = previousOrientation;
                }
            }

            t += tickLen;
        }
    }
    // the last t in the while would be past bounds
    this._endTime = t - tickLen;
    this._lastTick = this._ticks[this._endTime];
};



ol.Playback.Track.prototype._interpolatePoint = function (start, end, ratio) {
    try {
        if(end[0]-start[0]>180)//比如从-179到179
            end[0]-=360;
        else if(end[0]-start[0]<-180)//比如从179到-179
            end[0]+=360;
        var delta = [end[0] - start[0], end[1] - start[1]];
        var offset = [delta[0] * ratio, delta[1] * ratio];
        return [start[0] + offset[0], start[1] + offset[1]];
    } catch (e) {
        console.log('err: cant interpolate a point');
        console.log(['start', start]);
        console.log(['end', end]);
        console.log(['ratio', ratio]);
    }
};

ol.Playback.Track.prototype._directionOfPoint=function(start,end){
    return this._getBearing(start[1],start[0],end[1],end[0]);
};
ol.Playback.Track.prototype._getBearing=function(startLat,startLong,endLat,endLong){
    startLat = this._radians(startLat);
    startLong = this._radians(startLong);
    endLat = this._radians(endLat);
    endLong = this._radians(endLong);

    var dLong = endLong - startLong;

    var dPhi = Math.log(Math.tan(endLat/2.0+Math.PI/4.0)/Math.tan(startLat/2.0+Math.PI/4.0));
    if (Math.abs(dLong) > Math.PI){
        if (dLong > 0.0)
            dLong = -(2.0 * Math.PI - dLong);
        else
            dLong = (2.0 * Math.PI + dLong);
    }

    return (this._degrees(Math.atan2(dLong, dPhi)) + 360.0) % 360.0;
};

ol.Playback.Track.prototype._radians=function(n) {
    return n * (Math.PI / 180);
};
ol.Playback.Track.prototype._degrees=function(n) {
    return n * (180 / Math.PI);
};
ol.Playback.Track.prototype.uuid=function() {
    var s = [];
    var hexDigits = "0123456789abcdef";
    for ( var i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4"; // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1); // bits 6-7 of the
    // clock_seq_hi_and_reserved
    // to 01
    s[8] = s[13] = s[18] = s[23] = "";

    var uuid = s.join("");
    return uuid;
}
ol.Playback.Track.prototype.getFirstTick = function () {
    return this._ticks[this._startTime];
};

ol.Playback.Track.prototype.getLastTick = function () {
    return this._ticks[this._endTime];
};

ol.Playback.Track.prototype.getStartTime = function () {
    return this._startTime;
};

ol.Playback.Track.prototype.getEndTime = function () {
    return this._endTime;
};

ol.Playback.Track.prototype.getTickMultiPoint=function () {
    var t = this.getStartTime();
    var endT = this.getEndTime();
    var coordinates = [];
    var time = [];
    while (t <= endT) {
        time.push(t);
        coordinates.push(this.tick(t));
        t += this._tickLen;
    }

    return {
        type : 'Feature',
        geometry : {
            type : 'MultiPoint',
            coordinates : coordinates
        },
        properties : {
            time : time
        }
    };
};

ol.Playback.Track.prototype.trackPresentAtTick = function(timestamp)
{
    return (timestamp >= this._startTime);
};

ol.Playback.Track.prototype.trackStaleAtTick = function(timestamp)
{
    return ((this._endTime + this._staleTime) <= timestamp);
};

ol.Playback.Track.prototype.tick = function (timestamp) {
    if (timestamp > this._endTime)
        timestamp = this._endTime;
    if (timestamp < this._startTime)
        timestamp = this._startTime;
    return this._ticks[timestamp];
};

ol.Playback.Track.prototype.courseAtTime= function(timestamp)
{
    //return 90;
    if (timestamp > this._endTime)
        timestamp = this._endTime;
    if (timestamp < this._startTime)
        timestamp = this._startTime;
    return this._orientations[timestamp];
};

ol.Playback.Track.prototype.setMarker = function(timestamp, options){
    var lngLat = null;
    var heading=null;
    var time=null;
    if (timestamp) {
        lngLat = this.tick(timestamp);
        time=timestamp;
        heading=this.courseAtTime(timestamp);
    }
    else {
        lngLat = this.getFirstTick();
        heading=this.courseAtTime(this._startTime);
    }
    if (lngLat) {
        if(this._projCode=='EPSG:3857')
            lngLat=ol.proj.fromLonLat(lngLat);
        this.firstCoor=lngLat;
        this._marker=new ol.Feature({
            heading:heading,
            time:time,
            ship_name:this._ship_name,
            color:this._color,
            geometry: new ol.geom.Point(lngLat)
        });
        if(this.ship_id!==undefined)
            this._marker.setId(this.ship_id);
        else
            this._marker.setId(this.uuid());
    }
    return this._marker;
};

ol.Playback.Track.prototype.moveMarker = function(latLng, transitionTime,timestamp) {
    var heading=this.courseAtTime(timestamp);
    if (this._marker&&latLng) {
        if(this._projCode=='EPSG:3857')
            latLng=ol.proj.fromLonLat(latLng);
        this._marker.set('heading',heading);
        this._marker.set('time',timestamp);
        this._marker.setGeometry(new ol.geom.Point(latLng));
        if(this.trackline===undefined){
            this.trackline=new ol.Feature({ color:this._color});
            this.trackline.setGeometry(new ol.geom.LineString([this.firstCoor,latLng]));
            this._trackLayer.trackSource.addFeature(this.trackline);
        }
        else
        {
            this.trackline.getGeometry().appendCoordinate(latLng);
        }
        //popop移动
        //获取当前地图对象中popup显示的轨迹id
        var _trackid=this._trackLayer.getPopup().getTrackId();
        if(this._marker.getId()==_trackid){
            var feature=this._marker;
            var coor=feature.getGeometry().getCoordinates();
            var coor1;
            if(this._projCode=='EPSG:3857')
                coor1=ol.proj.toLonLat(coor);
            else
                coor1=coor;
            var content=`<p>经纬度：${coor1[0].toFixed(4)} ${coor1[1].toFixed(4)}</p></br>
            <p>角度：${feature.get('heading').toFixed(4)}</p></br>
            <p>时间：${new Date(parseInt(feature.get('time'))).toLocaleString().replace(/:\d{1,2}$/,' ')}</p>`;
this._trackLayer.getPopup().move(feature.getId(),coor,content);
}
}
};

ol.Playback.Track.prototype.getMarker = function() {
    return this._marker;
};


ol.Playback.TrackController = function (map, tracks, options) {
    this.options = options || {};

    this._map = map;

    this._tracks = [];
    // initialize tick points
    this.setTracks(tracks);
}

ol.Playback.TrackController.prototype.clearTracks=function() {
    while (this._tracks.length > 0) {
        var track = this._tracks.pop();
    }
    //markerSource.clear();
}

ol.Playback.TrackController.prototype.setTracks = function (tracks) {
    // reset current tracks
    this.clearTracks();

    this.addTracks(tracks);
}

ol.Playback.TrackController.prototype.addTracks = function (tracks) {
    // return if nothing is set
    if (!tracks) {
        return;
    }

    if (tracks instanceof Array) {
        for (var i = 0, len = tracks.length; i < len; i++) {
            this.addTrack(tracks[i]);
        }
    } else {
        this.addTrack(tracks);
    }
}

// add single track
ol.Playback.TrackController.prototype.addTrack = function (track, timestamp) {
    // return if nothing is set
    if (!track) {
        return;
    }

    var marker = track.setMarker(timestamp, this.options);

    if (marker) {
        this.options.trackLayer.markerSource.addFeature(marker);
        this._tracks.push(track);
    }
}

ol.Playback.TrackController.prototype.tock = function (timestamp, transitionTime) {
    for (var i = 0, len = this._tracks.length; i < len; i++) {
        var lngLat = this._tracks[i].tick(timestamp);
        this._tracks[i].moveMarker(lngLat, transitionTime, timestamp);
    }
}

ol.Playback.TrackController.prototype.getStartTime = function () {
    var earliestTime = 0;
    if (this._tracks.length > 0) {
        earliestTime = this._tracks[0].getStartTime();
        for (var i = 1, len = this._tracks.length; i < len; i++) {
            var t = this._tracks[i].getStartTime();
            if (t < earliestTime) {
                earliestTime = t;
            }
        }
    }
    return earliestTime;
}

ol.Playback.TrackController.prototype.getEndTime = function () {
    var latestTime = 0;
    if (this._tracks.length > 0) {
        latestTime = this._tracks[0].getEndTime();
        for (var i = 1, len = this._tracks.length; i < len; i++) {
            var t = this._tracks[i].getEndTime();
            if (t > latestTime) {
                latestTime = t;
            }
        }
    }
    return latestTime;
}

ol.Playback.TrackController.prototype.getTracks = function () {
    return this._tracks;
};

ol.Playback = ol.Playback || {};
ol.Playback.TrackLayer=function (options) {
        this._map=options.map;
        this.projCode=this._map.getView().getProjection().getCode();
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
            var coor1;
            if(self.projCode=='EPSG:3857')
                coor1=ol.proj.toLonLat(coor);
            else
                coor1=coor;
            var content=`<p>经纬度：${coor1[0].toFixed(4)} ${coor1[1].toFixed(4)}</p></br>
            <p>角度：${feature.get('heading').toFixed(4)}</p></br>
            <p>时间：${new Date(parseInt(feature.get('time'))).toLocaleString().replace(/:\d{1,2}$/,' ')}</p>`;
            self._popup.show(feature.getId(),coor,content);
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


ol.Playback.Util = {
    DateStr: function(time) {
        return new Date(time).toDateString();
    },
    TimeStr: function(time) {
        var d = new Date(time);
        var h = d.getHours();
        var m = d.getMinutes();
        var s = d.getSeconds();
        var tms = time / 1000;
        var dec = (tms - Math.floor(tms)).toFixed(2).slice(1);
        var mer = 'AM';
        if (h > 11) {
            h %= 12;
            mer = 'PM';
        }
        if (h === 0) h = 12;
        if (m < 10) m = '0' + m;
        if (s < 10) s = '0' + s;
        return h + ':' + m + ':' + s + dec + ' ' + mer;
    },
    ParseGPX: function(gpx) {

        var geojsonRoot = {
            type: 'FeatureCollection',
            features : []
        };



        var xml = $.parseXML(gpx);

        var trks = $(xml).find('trk');
        for (var trackIdx=0, numberOfTracks=trks.length; trackIdx<numberOfTracks; trackIdx++) {

            var track = trks[trackIdx];
            var geojson = {
                type: 'Feature',
                geometry: {
                    type: 'MultiPoint',
                    coordinates: []
                },
                properties: {
                    trk : {},
                    time: [],
                    speed: [],
                    altitude: [],
                    bbox: []
                }
            };

            geojson.properties.trk.name = $(track).find('name').text();
            geojson.properties.trk.desc = $(track).find('desc').text();
            geojson.properties.trk.type = $(track).find('type').text();
            geojson.properties.trk.src = $(track).find('src').text();

            var pts = $(track).find('trkpt');
            for (var i=0, len=pts.length; i<len; i++) {
                var p = pts[i];
                var lat = parseFloat(p.getAttribute('lat'));
                var lng = parseFloat(p.getAttribute('lon'));
                var timeStr = $(p).find('time').text();
                var eleStr = $(p).find('ele').text();
                var t = new Date(timeStr).getTime();
                var ele = parseFloat(eleStr);

                var coords = geojson.geometry.coordinates;
                var props = geojson.properties;

                var time = props.time;
                var altitude = geojson.properties.altitude;

                coords.push([lng,lat]);
                time.push(t);
                altitude.push(ele);
            }
            geojsonRoot.features.push(geojson);
        }

        return geojsonRoot;

    }
};
