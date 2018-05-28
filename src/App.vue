<template>
  <div class="tasker container-fluid">
    <div class="col-md-2 sidebar">
      <h1><router-link to="/">Rolling Tasker</router-link></h1>
      <h2>Projects</h2>
      <list-project></list-project>
      <router-link to="/user/1">User</router-link>
      <router-link to="/project/1">Project</router-link>
    </div>
    <router-view class="col-md-10 col-md-offset-2 main">
    </router-view>
  </div>
</template>

<script>
import listProject from './ListProject.vue';

export default {
  components: { listProject },
}
</script>
