<template>
  <div>
    <div class="log-header">
      <navigation></navigation>
    </div>
    <list-log
      v-for="user of this.$store.getters.getUserAliases"
      :key="user"
      :user="user"
      >
    </list-log>
  </div>
</template>

<script>
import axios from 'axios'
import navigation from './Navigation.vue'
import listLog from './ListLog.vue'

export default {
  components: { navigation, listLog },
}
</script>
