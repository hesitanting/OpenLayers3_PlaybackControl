ol.Playback = ol.Playback || {};
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
    //console.log(id,this._trackid);
    if(id!=this._trackid)
        return;
    this.content.innerHTML = content;
    this.popup.setPosition(coor);
}