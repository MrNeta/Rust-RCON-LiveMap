L.Control.WorldTime = L.Control.extend({
    onAdd: function(map) {
        var parent = L.DomUtil.create('div');
        
        // Clock
        var div = L.DomUtil.create('div');
        div.innerText = "--:--";
        div.style.backgroundColor = 'rgba(0,0,0,0.5)';
        div.style.color = 'white';
        div.style.padding = '3px 8px 3px 8px';
        div.style["border-radius"] = "10px";
        div.style["text-align"] = "center";
        div.id = "timeWidget";
        parent.appendChild(div);

        // Players
        div = L.DomUtil.create('div');
        div.innerText = "Players: -/-";
        div.style.backgroundColor = 'rgba(0,0,0,0.5)';
        div.style.color = 'white';
        div.style["margin-top"] = "5px";
        div.style.padding = '3px 8px 3px 8px';
        div.style["border-radius"] = "10px";
        div.style["text-align"] = "center";
        div.id = "playersWidget";
        parent.appendChild(div);

        // Server FPS
        div = L.DomUtil.create('div');
        div.innerText = "FPS: -";
        div.style.backgroundColor = 'rgba(0,0,0,0.5)';
        div.style.color = 'white';
        div.style["margin-top"] = "5px";
        div.style.padding = '3px 8px 3px 8px';
        div.style["border-radius"] = "10px";
        div.style["text-align"] = "center";
        div.id = "fpsWidget";
        parent.appendChild(div);

        // Entity Count
        div = L.DomUtil.create('div');
        div.innerText = "Entities: -";
        div.style.backgroundColor = 'rgba(0,0,0,0.5)';
        div.style.color = 'white';
        div.style["margin-top"] = "5px";
        div.style.padding = '3px 8px 3px 8px';
        div.style["border-radius"] = "10px";
        div.style["text-align"] = "center";
        div.id = "entityWidget";
        parent.appendChild(div);

        return parent;
    },

    onRemove: function(map) {
        // Nothing to do here
    }
});

L.control.worldtime = function(opts) {
    return new L.Control.WorldTime();
}