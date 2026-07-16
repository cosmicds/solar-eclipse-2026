<template>
  <div id="debug-eclipse-timer">
    <div v-if="prediction === null">
      <p>No prediction</p>
    </div>
    <div v-else>
      <h3>{{ type === '' ? 'No Eclipse' : type + ' Eclipse' }} (debug)</h3>
      <table>
        <tbody>
          <tr>
            <td>Date</td>
            <td>{{ prediction.date }}</td>
            <td></td>
          </tr>
          <tr>
            <td>Partial Start</td>
            <td>{{ timeString(prediction.partialStart[0]) }}</td>
            <td>{{ label(prediction.partialStart[1]) }}</td>
          </tr>
          <tr>
            <td>Sun Alt Start</td>
            <td>{{ prediction.sunAltStart[0] }}&deg;</td>
            <td>{{ label(prediction.sunAltStart[1]) }}</td>
          </tr>
          <tr>
            <td>Central Start</td>
            <td>{{ timeString(prediction.centralStart[0]) }}</td>
            <td>{{ label(prediction.centralStart[1]) }}</td>
          </tr>
          <tr>
            <td>Max Eclipse</td>
            <td>{{ timeString(prediction.maxTime[0]) }}</td>
            <td>{{ label(prediction.maxTime[1]) }}</td>
          </tr>
          <tr>
            <td>Max Alt / Azi</td>
            <td>{{ prediction.maxAlt[0] }}&deg; / {{ prediction.maxAzi }}&deg;</td>
            <td>{{ label(prediction.maxAlt[1]) }}</td>
          </tr>
          <tr>
            <td>Central End</td>
            <td>{{ timeString(prediction.centralEnd[0]) }}</td>
            <td>{{ label(prediction.centralEnd[1]) }}</td>
          </tr>
          <tr>
            <td>Partial End</td>
            <td>{{ timeString(prediction.partialEnd[0]) }}</td>
            <td>{{ label(prediction.partialEnd[1]) }}</td>
          </tr>
          <tr>
            <td>Sun Alt End</td>
            <td>{{ prediction.sunAltEnd[0] }}&deg;</td>
            <td>{{ label(prediction.sunAltEnd[1]) }}</td>
          </tr>
          <tr>
            <td>Magnitude</td>
            <td>{{ prediction.magnitude[0] }}</td>
            <td>{{ label(prediction.magnitude[1]) }}</td>
          </tr>
          <tr>
            <td>Coverage</td>
            <td>{{ prediction.coverage[0] }}</td>
            <td>{{ label(prediction.coverage[1]) }}</td>
          </tr>
          <tr>
            <td>Duration</td>
            <td>{{ prediction.duration }}</td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { EclipseData, SunBSR } from './eclipse_types';
import { formatInTimeZone } from 'date-fns-tz';

export default defineComponent({
  name: 'DebugEclipseTimer',

  props: {
    prediction: {
      type: Object as PropType<EclipseData<Date> | null>,
      default: null,
      required: false,
    },

    timezone: {
      type: String,
      default: 'UTC',
      required: false,
    },
  },

  computed: {
    type(): '' | 'Partial' | 'Annular' | 'Total' {
      switch (this.prediction?.type) {
      case 'P':
        return 'Partial';
      case 'A':
        return 'Annular';
      case 'T':
        return 'Total';
      default:
        return '';
      }
    },
  },

  methods: {
    timeString(date: Date | null | string): string {
      if (date === null || date === '' || !(date instanceof Date)) return '—';
      const utc = formatInTimeZone(date, 'UTC', 'HH:mm:ss');
      const local = formatInTimeZone(date, this.timezone, 'h:mm:ss aaa z');
      return `${utc} UTC (${local})`;
    },

    label(c: SunBSR): string {
      if (c === 's') return 'at Sunset';
      if (c === 'r') return 'at Sunrise';
      if (c === 'b') return 'Below Horizon';
      return '';
    },
  },
});
</script>

<style scoped lang="less">
#debug-eclipse-timer {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000;
  opacity: 0.5;
  background: black;
  color: white;
  padding: 0.5em;
  font-size: 0.8em;
  font-family: monospace;
  pointer-events: none;

  table {
    border-collapse: collapse;

    td {
      border: 1px solid #888;
      padding: 0.1em 0.4em;
    }
  }
}
</style>
