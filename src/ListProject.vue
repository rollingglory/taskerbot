<template>
  <ol class="list-project">
    <li v-for="project in this.$store.state.projects">
      <router-link :to="`project/${project.code}`">
        <div :class="`color accent${color(project.code)}`">{{ project.code }}</div>
        {{ project.name }}
      </router-link>
    </li>
  </ol>
</template>

<style>
.list-project {
  height: 400px;
  padding-left:0;
  overflow-y: scroll;

  list-style:none;
}

.list-project > li{
  margin-bottom:5px;
}
</style>

<script>
const color = s => [...s].reduce((a, x) => a + x.codePointAt(0), 0) % 8

export default {
  methods: {
    color,
  },
};
</script>
