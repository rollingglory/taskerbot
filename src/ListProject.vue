<template>
  <ol class="list-project">
    <li v-for="project in this.$store.state.projects">
      <router-link :to="`project/${project.code}`">
        <div :class="`accent${color(project.code)}`">{{ project.code }}</div>
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

.list-project div {
  width: 50px;
  padding: 3px;
  display: inline-block;
  text-align: center;
  vertical-align: middle;
  overflow: hidden;
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
