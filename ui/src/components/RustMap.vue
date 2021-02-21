<template>
    <l-map class="map" ref="map" style="height: 100vh;" :crs="crs" :minZoom="minZoom" :maxZoom="maxZoom">
        <l-image-overlay v-if="url != ''" :url="url" :bounds="bounds" />
        <l-marker v-for="player in playerMarker" v-bind:key="player.id" :lat-lng="player.pos">
            <l-popup>
                <div>
                    <b>Name:</b> {{player.name}}<br/><b>ID:</b> {{player.id}}
                </div>
            </l-popup>
        </l-marker>
    </l-map>
</template>
<script>
import * as L from "leaflet";
import { LMap, LImageOverlay, LMarker, LPopup } from "vue2-leaflet";
export default {
    components: {
        LMap,
        LImageOverlay,
        LMarker,
        LPopup
    },
    data() {
        return {
            worldSize: 4250,
            worldSeed: 0,
            url: '',
            bounds: [[0, 0], [0, 0]],
            crs: L.CRS.Simple,
            minZoom: -3,
            maxZoom: 0,
            playerMarker: []
        }
    },
    beforeMount(){
        this.bounds = [
            [-1 * ((this.worldSize / 2) + 500),-1 * ((this.worldSize / 2) + 500)],
            [(this.worldSize / 2) + 500,(this.worldSize / 2) + 500]
        ]
    },
    mounted(){
        document.addEventListener("markerUpdate", this.processData)
        document.addEventListener("serverInfo", this.processMapData)
        let mapRef = this.$refs.map.mapObject;
        mapRef.setView([0, 0], -2)
        mapRef.attributionControl.addAttribution('<a href="https://plebmasters.de/">PlebMasters.de</a>');
        mapRef.attributionControl.addAttribution('<a href="https://github.com/MrNeta/Rust-RCON-LiveMap">GitHub</a>');
    },
    beforeDestroy(){
        document.removeEventListener("markerUpdate", this.processData);
        document.removeEventListener("serverInfo", this.processMapData);
    },
    methods: {
        processData(data){
            this.playerMarker = [];
            data.detail.forEach(plr => {
                this.playerMarker.push({
                    id: plr.id,
                    pos: L.latLng([ plr.pos.x, plr.pos.y ]),
                    name: plr.name
                });
            });
        },
        processMapData(data){
            document.removeEventListener("serverInfo", this.processMapData);
            this.worldSize = data.detail.worldSize;
            this.worldSeed = data.detail.worldSeed;
            this.url = `map_${this.worldSize}_${this.worldSeed}.png`;
        }
    }
}
</script>
<style>
.map { 
    background-color: #12404d !important;
}
</style>