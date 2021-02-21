import Vue from 'vue'
import App from './App.vue'
import { LMap, LTileLayer, LMarker } from 'vue2-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'overlayscrollbars/css/OverlayScrollbars.css';
import { OverlayScrollbarsPlugin } from 'overlayscrollbars-vue';

delete Icon.Default.prototype._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

Vue.component('l-map', LMap);
Vue.component('l-tile-layer', LTileLayer);
Vue.component('l-marker', LMarker);

Vue.use(OverlayScrollbarsPlugin);

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')

// ====================================================

const url = (window.location.protocol.includes("s") ? "wss" : "ws") + "://" + window.location.host + "/";
let ws;
function connect(){
  console.log("Connecting..");
  ws = new WebSocket(url);
  ws.onerror = function() {
      ws.close();
  }

  ws.onmessage = function(msg) {
      let data = JSON.parse(msg.data);
      if(data.type === 1) // Marker
        document.dispatchEvent(new CustomEvent('markerUpdate', { detail: data.data}));
      else if(data.type === 2) // ConsoleLog
        document.dispatchEvent(new CustomEvent('consoleLog', { detail: data.data}));
      else if(data.type === 3) // ServerInfo
        document.dispatchEvent(new CustomEvent('serverInfo', { detail: data.data}));
      else if(data.type === 4) // Player Information
        document.dispatchEvent(new CustomEvent('playerInfo', { detail: data.data}));
      else if(data.type === 5) // Map Image not Exist
        document.dispatchEvent(new CustomEvent('mapImageNotExist', { detail: data.data}));
      else
        console.log(data);
  }
  ws.onclose = function(){
    console.log("Connection closed")
      setTimeout(connect, 5000);
  }
}
connect();

function onConsoleCommand(data){
  if(!ws.OPEN)
    return;
  ws.send(data.detail)
}
document.addEventListener("consoleCommand", onConsoleCommand);