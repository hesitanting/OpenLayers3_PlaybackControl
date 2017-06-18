ol.Playback = ol.Playback || {};
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