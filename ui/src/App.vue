<template>
  <div id="app">
    <RustMap/>
    <InfoWidget/>
    <ConsoleWidget/>
  </div>
</template>

<script>
import RustMap from './components/RustMap.vue'
import InfoWidget from './components/InfoWidget.vue'
import ConsoleWidget from './components/ConsoleWidget.vue'

export default {
  name: 'App',
  components: {
    RustMap,
    InfoWidget,
    ConsoleWidget
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
body{
  margin: 0;
}
</style>
