

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

    /*
    map.on('playback:add_tracks', function() {
            self._slider.min = playback.getStartTime();
            self._slider.max = playback.getEndTime();
            self._slider.value = playback.getTime();
    });

    */
    var element = document.createElement('div');
    element.appendChild(_container);

    ol.control.Control.call(this, {
        element: element,
        target: opt_options.target
    });
};
ol.inherits(SliderControl, ol.control.Control);

