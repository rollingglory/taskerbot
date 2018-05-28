<template>
  <div>
    <router-link :to="`/user/${user}`">{{ user }}</router-link>
    <log
      v-for="log in this.$store.getters.getLogsByUser(this.user)"
      :key="log._id"
      :user="log.userId.alias"
      :title="log.content"
      :code="log.projectId.code"
      ></log>
  </div>
</template>
<script>
import log from './Log.vue';

export default {
  props: ['user'],
  components: { log },
}
</script>
