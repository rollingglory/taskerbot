<template>
  <div>
    <router-link :to="prevMonth">←</router-link>
    <h1>{{ monthName }}</h1>
    <router-link :to="nextMonth">→</router-link>
  </div>
</template>
<script>
import { parse, format, addMonths } from 'date-fns';

const fmtYM = (date) => format(date, 'YYYY-MM');
const fmtMn = (date) => format(date, 'MMMM YYYY');
export default {
  computed: {
    prevMonth() {
      return fmtYM(addMonths(this.$store.state.date, -1));
    },
    nextMonth() {
      return fmtYM(addMonths(this.$store.state.date, 1));
    },
    monthName() {
      return fmtMn(this.$store.state.date);
    },
  },
}
</script>
