require('dotenv').config();
var WebSocketClient = require('websocket').client;
var express = require('express');
var app = express();
var expressWs = require('express-ws')(app);
const basicAuth = require('express-basic-auth')
const fs = require('fs');
const connectionString = `ws://${process.env.SERVER_IP}:${process.env.RCON_PORT}/${process.env.RCON_PASSWORD}`;

if(process.env.ALLOW_CORS == "true"){
    var cors = require('cors')
    app.use(cors())
}

let users = {};
users[process.env.DEFAULT_USER] = process.env.DEFAULT_PASSWORD; // Add Default User

if(process.env.USE_BASIC_AUTH == "true"){
    app.use(basicAuth({
        challenge: true,
        users: users
    }));
}

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
    ws.on('message', function(message){
        if(message.trim() == "world.rendermap"){
            sendToAllWsUsers({
                type: 5,
                data: true
            });
            Request(message, function(response){
                if(response.trim().includes("Saved map render")){
                    sendToAllWsUsers({
                        type: 5,
                        data: true
                    });
                    sendToAllWsUsers({
                        type: 2,
                        data: response
                    });
                }
            });
        }else{
            Request(message, function(response){
                try{
                    if(response.trim().length > 0)
                        ws.send(JSON.stringify({
                            type: 2,
                            data: response
                        }));
                }catch(ex){
                    console.log(ex);
                }
            });
        }
    });
    if(!checkIfMapImageExist()){
        ws.send(JSON.stringify({
            type: 5,
            data: false
        }))
    }
});

var aWss = expressWs.getWss('/');

var wsclient = new WebSocketClient();
var gConn;
var Callbacks = {};
var LastIndex = 1001;
let serverinfo;
let worldSize;
let worldSeed;

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

function Request(msg, callback){
    LastIndex++;
    Callbacks[LastIndex] = {
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
    Request("console.tail " + count, function(response){
        JSON.parse(response).forEach(el => {
            ws.send(JSON.stringify({
                type: 2,
                data: el.Message
            }));
        });
    });
}

function getServerInfiormation(){
    Request("serverinfo", function(response){
        serverinfo = JSON.parse(response);
        serverinfo.worldSize = worldSize;
        serverinfo.worldSeed = worldSeed;
        sendToAllWsUsers({
            type: 3,
            data: serverinfo
        });
    });
}

function getPlayers(){
    // playerlist // commands: https://www.corrosionhour.com/rust-admin-commands/
    Request("server.playerlistpos", function(response){
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

    Request("playerlist", function(response){
        lastPlayerInformation = JSON.parse(response);
        sendToAllWsUsers({
            type: 4,
            data: lastPlayerInformation
        });
    });
}

function getWorldInformation(){
    Request("server.worldsize", function(response){
        
        worldSize = parseInt(response.toString().replace(/"/g, "").split(":")[1]);
    });
    Request("server.seed", function(response){
        worldSeed = parseInt(response.toString().replace(/"/g, "").split(":")[1]);
    });
}

wsclient.on('connectFailed', function(error) {
    console.log('Connect Error: ' + error.toString());
    setTimeout(() => {
        wsclient.abort();
        wsclient.connect(connectionString);
    }, 5000);
});

wsclient.on('connect', function(connection) {
    gConn = connection;
    console.log('Connected to Rust Server');
    connection.on('error', function(error) {
        console.log("Connection Error: " + error.toString());
        setTimeout(() => {
            wsclient.abort();
            wsclient.connect(connectionString);
        }, 5000);
    });
    connection.on('close', function() {
        console.log('Connection to Rust Server Closed');
        setTimeout(() => {
            wsclient.abort();
            wsclient.connect(connectionString);
        }, 2000);
    });
    connection.on('message', function(message) {
        var data = JSON.parse(message.utf8Data);
        if(data.Identifier === 0){
            console.log(`[Log][${data.Type}] ${data.Message}`);
            sendToAllWsUsers({
                type: 2,
                data: data.Message
            });
        }else if(data.Identifier === -1) { // chat?

        }else if(data.Identifier in Callbacks){
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
        getWorldInformation();
    }
});

function checkIfMapImageExist(){
    try {
        return fs.existsSync("./public/map_" + worldSize + "_" + worldSeed + ".png");
    } catch(err) {
        console.error(err)
    }
    return false;
}

wsclient.connect(connectionString);