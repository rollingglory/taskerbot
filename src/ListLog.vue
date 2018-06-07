<template>
  <div>
    <router-link
      v-for="log in logs"
      v-if="log.projectId"
      v-bind="{
        key: log._id,
        to: `/log/${log._id}`,
        title: log.content,
      }"
      class="color"
      :class="color(log.code)"
      >{{ log.code }}</router-link>
    <router-link v-else
      to="/"
      class="color"
      :title="`fill for shift ${log.shift} at ${fmtDate(log.date)}`"
      >+</router-link>
  </div>
</template>

<script>
import { startOfMonth, getDate, addDays, isSameDay, format } from 'date-fns';

const start = startOfMonth(Date.now());

const color = s =>
  `accent${[...s].reduce((a, x) => a + x.codePointAt(0), 0) % 8}`;

const hasLog = (log) => ({ date, shift }) =>
  isSameDay(date, log.date) && shift == log.shift;

const fmtDate = d => format(d, 'D MMM');



export default {
  props: ['user'],
  data() {
    const logs = this.$store.getters.getLogsByUser(this.user);
    return {
      logs: [].concat(...[...Array(getDate(Date.now()))]
        .map((_, day) => [...Array(6)]
          .map((_, shift) => {
            const log = {
              date: addDays(start, day),
              shift,
            }
            return logs.find(hasLog(log)) || log;
          })
        )),
    };
  },
  methods: {
    color,
    fmtDate,
  },
}
</script>
