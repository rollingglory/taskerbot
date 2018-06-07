<template>
  <list-log
    :key="user"
    :user="$route.params.id"
    ></list-log>
</template>

<script>
import listLog from './ListLog.vue';

export default {
  components: { listLog },
};
</script>
