ol.Playback = ol.Playback || {};
ol.Playback.Track = function(geoJSON, options) {
    this.options = options || {};
    this.popup=options.popup;
    var tickLen = options.tickLen || 250;
    this._staleTime = options.staleTime || 60 * 60 * 1000;
    this._fadeMarkersWhenStale = options.fadeMarkersWhenStale || false;
    this._geoJSON = geoJSON;
    this._tickLen = tickLen;
    this._ticks = [];
    this._marker = null;
    this._orientations = [];
    this.currentPosition;
    var sampleTimes = geoJSON.properties.time;
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

    // if time stamp is not set, then get first tick
    if (timestamp) {
        lngLat = this.tick(timestamp);
    }
    else {
        lngLat = this.getFirstTick();
    }

    if (lngLat) {
        this.currentPosition=ol.proj.fromLonLat(lngLat);
        console.log(this.currentPosition);
        var element = document.createElement('div');
        element.className = 'GPSMarker';
        this._marker = new ol.Overlay({
            id:this.uuid(),
            element: element,
            stopEvent:false,
            positioning: 'bottom-center'
        });
        var self=this;
        if(options.mouseOverCallback) {
            element.addEventListener('mouseover',function(e){
                options.mouseOverCallback(lngLat);
            });
        }
        if(options.clickCallback) {
            element.addEventListener('click',function(e){
                self.showPopup=true;
                self.popup.popup.setPosition(self.currentPosition);
                options.clickCallback();
            });
        }
    }

    return this._marker;
};

ol.Playback.Track.prototype.moveMarker = function(latLng, transitionTime,timestamp) {
    if (this._marker) {
        latLng=ol.proj.fromLonLat(latLng);
        this.currentPosition=latLng;
        this._marker.setPosition(latLng);
        //添加popup说明
        if(this.showPopup)
            this.popup.popup.setPosition(this.currentPosition);
    }
};

ol.Playback.Track.prototype.getMarker = function() {
    return this._marker;
};
