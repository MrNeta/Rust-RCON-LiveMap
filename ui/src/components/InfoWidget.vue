<template>
    <div class="info-widget">
        <div class="info-widget-item">{{time}}</div>
        <div class="info-widget-item">Players: {{playerCount}}/{{maxPlayers}}</div>
        <div class="info-widget-item">FPS: {{fps}}</div>
        <div class="info-widget-item">Entities: {{entities}}</div>
    </div>
</template>
<style>
    .info-widget {
        position: fixed;
        top: 10px;
        right: 10px;
        z-index: 450;
    }
    .info-widget-item {
        background-color: rgba(0, 0, 0, 0.5);
        color: white;
        padding: 3px 8px 3px 8px;
        border-radius: 10px;
        text-align: center;
        margin-bottom: 3px;
    }
</style>
<script>
export default {
    data(){
        return {
            time: "--:--",
            clockTrimmer: true,
            playerCount: "-",
            maxPlayers: "-",
            fps: "-",
            entities: "-"
        }
    },
    mounted(){
        document.addEventListener("serverInfo", this.processData)
    },
    beforeDestroy(){
        document.removeEventListener("serverInfo", this.processData);
    },
    methods: {
        processData(data){
            var time = new Date(data.detail.GameTime);
            this.clockTrimmer = !this.clockTrimmer;
            this.time = "Time: " + (time.getHours().toString().length == 1 ? "0" + time.getHours() : time.getHours()) + (this.clockTrimmer ? ":" : " ") + (time.getMinutes().toString().length == 1 ? "0" + time.getMinutes() : time.getMinutes());
            this.playerCount = data.detail.Players;
            this.maxPlayers = data.detail.MaxPlayers;
            this.fps = data.detail.Framerate;
            this.entities = data.detail.EntityCount;
        }
    }
}
</script>