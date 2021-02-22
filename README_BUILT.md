# Rust RCON LiveMap

## Installation

As with any NodeJS application, you only have to enter **npm install** to install all LiveMap dependencies.

## Configuration

All settings that should be made are to be saved in an **.env** file in the main folder. The following setting options are available:

| Setting        | Default   | Description                                                  |
| -------------- | --------- | ------------------------------------------------------------ |
| SERVER_IP      | localhost | The server address of the Rust server                        |
| RCON_PORT      | 28016     | The RCON port of the Rust server                             |
| RCON_PASSWORD  |           | The RCON password of the Rust server                         |
| WEBSERVER_PORT | 8050      | The port on which the LiveMap should be provided             |
| USE_BASIC_AUTH | true      | It is recommended if the server can be reached from the Internet, as console commands can also be executed there. |
| ALLOW_CORS     | false     | Is required if the NodeJS server and the files provided from the public folder are on another server. |



## Usage

Simply install all dependencies with **npm install** and generate the map as in the next section. Once this is done, you can start the LiveMap with a simple **npm start**.

If no other web server port has been set, the server should now be reachable at **http: // localhost: 8050/** or via the public address of the server.

## Basic Auth User Management

Todo (users.json)

## Map Generation

To generate an up-to-date map of the server, all you have to do is enter the command **world.rendermap** in the server console.
Once the map has been generated, it can be found in the main folder of the server as `map_ <worldSize> _ <worldSeed> .png`. In order to be able to use this map, it only has to be copied into the **public** folder of the LiveMap.

