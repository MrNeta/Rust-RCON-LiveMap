require('dotenv').config();
var WebSocketClient = require('websocket').client;
var express = require('express');
var app = express();
var expressWs = require('express-ws')(app);
const basicAuth = require('express-basic-auth')
const connectionString = `ws://${process.env.SERVER_IP}:${process.env.RCON_PORT}/${process.env.RCON_PASSWORD}`;

let users = {};
users[process.env.DEFAULT_USER] = process.env.DEFAULT_PASSWORD; // Add Default User

app.use(basicAuth({
    challenge: true,
    users: users
}))

app.use(express.static('public'));

app.listen(process.env.WEBSERVER_PORT, function () {
    console.log('Server listening on port ' + process.env.WEBSERVER_PORT + '! (http://localhost:' + process.env.WEBSERVER_PORT + '/)');
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

var wsclient = new WebSocketClient();
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

wsclient.on('connectFailed', function(error) {
    console.log('Connect Error: ' + error.toString());
    setTimeout(() => {
        wsclient = new WebSocketClient();
        wsclient.connect(connectionString);
    }, 5000);
});

wsclient.on('connect', function(connection) {
    gConn = connection;
    console.log('Connected to Rust Server');
    connection.on('error', function(error) {
        console.log("Connection Error: " + error.toString());
        setTimeout(() => {
            wsclient = new WebSocketClient();
            wsclient.connect(connectionString);
        }, 5000);
    });
    connection.on('close', function() {
        console.log('Connection to Rust Server Closed');
        setTimeout(() => {
            wsclient = new WebSocketClient();
            wsclient.connect(connectionString);
        }, 2000);
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
wsclient.connect(connectionString);