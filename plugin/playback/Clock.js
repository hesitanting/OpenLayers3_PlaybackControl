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

