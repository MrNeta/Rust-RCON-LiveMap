let players = {};
map.attributionControl.addAttribution('<a href="https://plebmasters.de/">PlebMasters.de</a>');
const url = (window.location.protocol.includes("s") ? "wss" : "ws") + "://" + window.location.host + "/";

function processMarker(data){
    let connected = [];
    data.forEach(plr => {
        connected.push(plr.id);
        if(plr.id in players){
            players[plr.id].setLatLng(L.latLng([ plr.pos.x, plr.pos.y ]));
        }else{
            players[plr.id] = L.marker(L.latLng([ plr.pos.x, plr.pos.y ]));
            players[plr.id].bindPopup(plr.name + " (" + plr.id + ")");
            players[plr.id].addTo(map);
        }
    });
    Object.keys(players).forEach(key => {
        if(!connected.includes(parseInt(key))){
            map.removeLayer(players[key]);
            var plrListItem = document.getElementById("plr-" + key);
            if(plrListItem)
                plrListItem.remove();
            delete players[key];
        }
    });
}

function connect(){
    document.getElementById("console-content").innerHTML = "";
    var ws = new WebSocket(url);
    ws.onerror = function(err) {
        ws.close();
    }

    ws.onmessage = function(msg) {
        let data = JSON.parse(msg.data);
        if(data.type === 1)
            processMarker(data.data);
        else if(data.type === 2)
            addConsoleLog(data.data);
        else if(data.type === 3)
            processServerInformation(data.data);
        else if(data.type === 4)
            processPlayerInformation(data.data);
        else
            console.log(data);
    }

    ws.onclose = function(){
        setTimeout(connect, 5000);
    }

}
connect();

function processPlayerInformation(data){
    data.forEach(plr => {
        if(!document.getElementById("plr-" + plr.SteamID)){
            var tr = document.createElement("tr")
            tr.id = "plr-" + plr.SteamID;
            
            var td = document.createElement("td");
            td.innerText = plr.DisplayName;
            td.alt = plr.SteamID;
            tr.appendChild(td);

            td = document.createElement("td");
            td.innerText = plr.ConnectedSeconds + " Seconds";
            td.id = "plr-" + plr.SteamID + "-time";
            tr.appendChild(td);

            td = document.createElement("td");
            td.innerText = plr.Ping;
            td.id = "plr-" + plr.SteamID + "-ping";
            tr.appendChild(td);

            document.getElementById("users-content").appendChild(tr);
        }else{
            document.getElementById("plr-" + plr.SteamID + "-time").innerText = plr.ConnectedSeconds + " Seconds";
            document.getElementById("plr-" + plr.SteamID + "-ping").innerText = plr.Ping;
        }
    });

}

let clockTrimmer = true;
function processServerInformation(data){
    var time = new Date(data.GameTime);
    clockTrimmer = !clockTrimmer;
    var timeDiv = document.getElementById("timeWidget")
    if(timeDiv)
        timeDiv.innerText = "Time: " + (time.getHours().toString().length == 1 ? "0" + time.getHours() : time.getHours()) + (clockTrimmer ? ":" : " ") + (time.getMinutes().toString().length == 1 ? "0" + time.getMinutes() : time.getMinutes());

    var joining = "";
    if(data.Joining > 0)
        joining = " (+" + data.Joining + ")";
    document.getElementById("playersWidget").innerText = "Players: " + data.Players + " / " + data.MaxPlayers + joining;
    document.getElementById("fpsWidget").innerText = "FPS: " + data.Framerate;
    document.getElementById("entityWidget").innerText = "Entities: " + data.EntityCount;
}

function addConsoleLog(string){
    var content = document.getElementById("console-content");
    var newDiv = document.createElement("div");
    newDiv.innerText = string;
    newDiv.classList.add("log-entry");
    content.appendChild(newDiv);
    consoleScrollToBottom();
}

function consoleScrollToBottom(){
    var container = document.getElementById("sidebar-content");
    container.scrollTop = container.scrollHeight;
}