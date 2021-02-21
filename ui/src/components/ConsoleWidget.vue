<template>
    <div class="console-widget">
        <div v-if="mapNotExist" class="generate-map" v-on:click="generateMapCommand">
            Generate Map
        </div>
        <overlay-scrollbars ref="console-content" class="console-window">
        <table style="width: 100%;" ref="console-table" id="console-table">
            <thead>
                <th style="width: 80px;"></th>
                <th></th>
            </thead>
            <tr class="console-row" v-for="(entry, index) in entries" v-bind:key="`${entry.message}-${entry.time}-${index}`">
                <td>{{entry.time}} |</td>
                <td>{{entry.message}}</td>
            </tr>
        </table>
        </overlay-scrollbars>
        <div class="console-input">
            <input v-model="command" type="text" autocomplete="off" spellcheck="off" v-on:keyup.enter="sendCommand"/>
        </div>
    </div>
</template>
<script>
import { OverlayScrollbarsComponent } from 'overlayscrollbars-vue';
export default {
    components: {
        'overlay-scrollbars': OverlayScrollbarsComponent
    },
    data(){
        return {
            entries: [],
            command: "",
            mapNotExist: false
        }
    },
    mounted(){
        document.addEventListener("consoleLog", this.processData)
        document.addEventListener("mapImageNotExist", this.mapImageExist)
    },
    beforeDestroy(){
        document.removeEventListener("consoleLog", this.processData);
        document.removeEventListener("mapImageNotExist", this.mapImageExist);
    },
    methods: {
        processData(data){
            let time = new Date();
            let pTime = (time.getHours().toString().length == 1 ? "0" + time.getHours() : time.getHours()) 
                + ":" + (time.getMinutes().toString().length == 1 ? "0" + time.getMinutes() : time.getMinutes()) 
                + ":" + (time.getSeconds().toString().length == 1 ? "0" + time.getSeconds() : time.getSeconds());
            let firstPush = this.entries.length == 0;
            this.entries.push({
                time: pTime,
                message: data.detail
            })
            
            setTimeout(this.scrollToBottom(), 300);
            if(firstPush)
                setTimeout(() => this.scrollToBottom(), 800)
        },
        generateMapCommand(){
            this.mapNotExist = false;
            document.dispatchEvent(new CustomEvent('consoleCommand', { detail: "world.rendermap"}));
            setTimeout(() => this.scrollToBottom(), 300);
        },
        mapImageExist(data){
            this.mapNotExist = !data.detail;
        },
        scrollToBottom(){
            let scroller = this.$refs["console-content"].osInstance();
            scroller.scrollStop();
            scroller.scroll({x: 0, y: this.$refs["console-table"].offsetHeight+100}, 500);
        },
        sendCommand(){
            document.dispatchEvent(new CustomEvent('consoleCommand', { detail: this.command}));
            this.command = "";
            setTimeout(() => this.scrollToBottom(), 300);
        }
    }
}
</script>
<style>
    .console-row {
        color: rgb(170, 170, 170);
        text-align: left;
    }

    .generate-map {
        position: fixed;
        bottom: 310px;
        left: 0;
        margin: 1vw 1vw 1vw 1vw;
        padding: 5px;
        background-color: rgba(0, 0, 0, 0.7);
        border: 1px solid rgba(0,0,0, 0.2);
        color: rgb(189, 189, 189);
        cursor: pointer;
        user-select: none;
    }

    .generate-map:hover {
        color: rgb(221, 221, 221);
        background-color: rgba(24, 24, 24, 0.7);
    }

    .generate-map:active {
        color: rgb(221, 221, 221);
        background-color: rgba(34, 34, 34, 0.7);
    }

    .console-widget {
        position: fixed;
        bottom: 0;
        left: 0;
        margin: 1vw;
        margin-bottom: 17px;
        background-color: rgba(0, 0, 0, 0.7);
        max-width: 98vw;
        width: 800px;
        height: 300px;
        z-index: 450;
        overflow: hidden;
        border: 1px solid rgba(0,0,0, 0.2);;
    }
    .console-window{
        height: 269px;
        overflow: scroll;
    }
    .console-input{
        height: 30px;
    }
    .console-input > input {
        height: 30px;
        width: 100%;
        outline: none;
        font-size: 18px;
        line-height: 30px;
        padding: 0 5px 0 5px;
        background-color: rgba(0, 0, 0, 0.2);
        border: none;
        border-top: 1px solid rgba(0,0,0, 0.2);
        color: white;

    }

    .console-input > input:focus {
        outline: none;
    }
</style>