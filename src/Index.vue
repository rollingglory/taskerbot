<template>
  <div>
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
import listLog from './ListLog.vue'

export default {
  components: { listLog },
}
</script>
