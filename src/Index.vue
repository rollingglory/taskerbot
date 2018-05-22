<template>
  <div>
    <div class="log-header">
      <navigation></navigation>
      <h2 id="month"></h2>
      <div class="row" id="days">
        <div class="column">
        </div>
      </div>
    </div>
    <div class="row log-content" id="logs">
    </div>
  </div>
</template>

<script>
import navigation from './Navigation.vue'

export default {
  components: { navigation },
}
</script>
