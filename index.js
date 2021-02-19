// ============ RCON Configuration ========== //
const serverIp ="localhost";
const rconPort = 28016;
const rconPassword = "";
// ========================================== //
var WebSocketClient = require('websocket').client;
var express = require('express');
var app = express();
var expressWs = require('express-ws')(app);
const basicAuth = require('express-basic-auth')
const connectionString = `ws://${serverIp}:${rconPort}/${rconPassword}`;

app.use(basicAuth({
    challenge: true,
    users: {
        'admin': 'sup3rs3cr3tpassw0rd'
    }
}))

app.use(express.static('public'));

app.listen(8050, function () {
    console.log('Server listening on port 8050! (http://localhost:8050/)');
});

app.ws("/", function(ws, req){
    if(lastPlayerData)
        ws.send(JSON.stringify({
            type: 1,
            data: lastPlayerData
        }))
    if(lastPlayerInformation)
        ws.send(JSON.stringify({
            type: 4,
            data: lastPlayerInformation
        }))
    getLastLogEntries(50, ws);
});
var aWss = expressWs.getWss('/');

var client = new WebSocketClient();
var gConn;
var Callbacks = {};
var LastIndex = 1001;
let serverinfo;

function Command(msg, identifier){
    if(identifier === null)
        identifier -1;

    var packet = {
        Identifier: identifier,
        Message: msg,
        Name: "WebRcon"
    }

    gConn.send(JSON.stringify(packet));
}

function Request(msg, scope, callback){
    LastIndex++;
    Callbacks[LastIndex] = {
        scope: scope,
        callback: callback
    };
    Command(msg, LastIndex)
}

function sendToAllWsUsers(data){
    aWss.clients.forEach(function (client) {
        client.send(JSON.stringify(data));
    });
}

let lastPlayerData;
let lastPlayerInformation;

function getLastLogEntries(count, ws){
    Request("console.tail " + count, null, function(response){
        JSON.parse(response).forEach(el => {
            ws.send(JSON.stringify({
                type: 2,
                data: el.Message
            }));
        });
    });
}

function getServerInfiormation(){
    Request("serverinfo", null, function(response){
        serverinfo = JSON.parse(response);
        sendToAllWsUsers({
            type: 3,
            data: serverinfo
        });
    });
}

function getPlayers(scope, success){
    // playerlist // commands: https://www.corrosionhour.com/rust-admin-commands/
    Request("server.playerlistpos", scope, function(response){
        // console.log(response)
        var data = [];
        var resp = response.split("\n");
        resp.shift();
        resp.pop();
        resp.forEach(line => {
            var fData = line.split(" ");
            var pData = line.split("(")[1].replace(")", "").split(",");
            data.push({
                id: parseInt(fData[0]),
                name: fData[1].trim(),
                pos: {
                    x: parseFloat(pData[2]),
                    y: parseFloat(pData[0]),
                    z: parseFloat(pData[1])
                }
            });
        });
        lastPlayerData = data;
        sendToAllWsUsers({
            type: 1,
            data: data
        });
    });

    Request("playerlist", null, function(response){
        lastPlayerInformation = JSON.parse(response);
        sendToAllWsUsers({
            type: 4,
            data: lastPlayerInformation
        });
    });
}

client.on('connectFailed', function(error) {
    console.log('Connect Error: ' + error.toString());
});

client.on('connect', function(connection) {
    gConn = connection;
    console.log('Connected to Rust Server');
    connection.on('error', function(error) {
        console.log("Connection Error: " + error.toString());
        setTimeout(client.connect(connectionString), 5000);
    });
    connection.on('close', function() {
        console.log('Connection to Rust Server Closed');
        setTimeout(client.connect(connectionString), 2000);
    });
    connection.on('message', function(message) {
        var data = JSON.parse(message.utf8Data);
        if(data.Identifier === 0){

            if((""+data.Message).toLocaleLowerCase().includes("[chat]")){
                logChat(data.Message);
            }else if((""+data.Message).toLocaleLowerCase().includes("[team chat]")){
                logTeamChat(data.Message);
            }else if((""+data.Message).toLocaleLowerCase().includes(" joined ")){
                logConnect(data.Message);
            }else if((""+data.Message).toLocaleLowerCase().includes(" disconnecting:")){
                logDisconnect(data.Message);
            }else{
                console.log(`[Log][${data.Type}] ${data.Message}`);
            }
            sendToAllWsUsers({
                type: 2,
                data: data.Message
            });
        }else if(data.Identifier === -1) { // chat?

        }
        else if(data.Identifier in Callbacks){
            Callbacks[data.Identifier].callback(data.Message);
        }else{
            console.log("================ Unknown =================");
            console.log(JSON.parse(message.utf8Data).Type)
            console.log(JSON.parse(message.utf8Data).Stacktrace)
            console.log(JSON.parse(message.utf8Data).Identifier)
            console.log(JSON.parse(message.utf8Data).Message)
            console.log("============ End Unknown =================");
        }
    });

    if (connection.connected) {
        setInterval(getPlayers, 10000);
        setInterval(getServerInfiormation, 1000);
    }
});

function logTeamChat(string){
    console.log('\x1b[32m%s\x1b[0m', string);
}

function logChat(string){
    console.log('\x1b[36m%s\x1b[0m', string);
}

function logConnect(string){
    console.log('\x1b[2m\x1b[32m%s\x1b[0m', "[Connect] "+string);
}

function logDisconnect(string){
    console.log('\x1b[2m\x1b[31m%s\x1b[0m', "[Disconnect] "+string);
}

// Logging

function logUnknownKill(victim, killer){ // "died"

}

function logPveKill(victim, killer){ // Klammern hinten am Namen (Bear) 

}

function logPvpKill(victim, killer){ //"// was killed by"

}

function logSuicide(victim, reason){  // suicide

}

// Virtuelle Spieler z.b. Zombies haben den Folgenden Syntax 1234567[1234567]

// End Logging

client.connect(connectionString);