<template>
  <router-link
    :to="`/user/${user}`"
    :class="`accent${color(code)}`"
    :title="title"
    >{{ code }}</router-link>
</template>

<script>
const color = s => [...s].reduce((a, x) => a + x.codePointAt(0), 0) % 8

export default {
  props: ['user', 'title', 'code'],
  methods: {
    color,
  },
};
</script>
