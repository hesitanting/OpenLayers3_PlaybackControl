function PoPup(options) {
    var popupElement = document.createElement('div');
    popupElement.className = 'ol-popup';
    this.popupCloseElement = document.createElement('a');
    this.popupCloseElement.href = '#';
    this.popupCloseElement.className = 'ol-popup-closer';
    this.content = document.createElement('div');
    popupElement.appendChild(this.popupCloseElement);
    popupElement.appendChild(this.content);
    map.getTargetElement().appendChild(popupElement);
    this.popup = new ol.Overlay(({
        element:popupElement,
        autoPan: true,
        autoPanAnimation: {
            duration: 250
        }
    }));
    var self=this;
    this.popupCloseElement.onclick = function(){
        self.popup.setPosition(undefined);
        this.blur();
        return false;
    }
}