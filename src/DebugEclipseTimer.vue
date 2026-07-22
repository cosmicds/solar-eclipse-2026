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
          <tr>
            <td>Max frac (manual)</td>
            <td>{{ maxManualFraction === null ? '—' : (maxManualFraction.frac * 100).toFixed(2) + '%' }}</td>
            <td>{{ maxManualFraction === null ? '' : timeString(maxManualFraction.time) }}</td>
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
import { AstroCalc, CAAMoon } from '@wwtelescope/engine';
import { distance } from '@wwtelescope/astro';

const D2R = Math.PI / 180;

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

    latDeg: {
      type: Number,
      default: 0,
      required: false,
    },

    lonDeg: {
      type: Number,
      default: 0,
      required: false,
    },
  },

  data() {
    return {
      maxManualFraction: null as { frac: number; time: Date } | null,
    };
  },

  watch: {
    prediction: {
      handler() {
        this.sampleMaxFraction();
      },
      immediate: true,
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

    // Fraction of the sun eclipsed at a given time, using the same
    // circle-circle intersection math as updateIntersection in
    // SolarEclipse2026.vue, but in angle space (topocentric positions from
    // AstroCalc for an arbitrary time, instead of engine screen positions).
    fractionEclipsed(time: Date): number {
      const jd = time.getTime() / 86400000 + 2440587.5;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sun = (AstroCalc as any).getPlanet(jd, 0, this.latDeg, this.lonDeg, 100);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const moon = (AstroCalc as any).getPlanet(jd, 9, this.latDeg, this.lonDeg, 100);
      const sep = distance(sun.RA * 15 * D2R, sun.dec * D2R, moon.RA * 15 * D2R, moon.dec * D2R);

      // Same constants as updateIntersection
      const distanceToMoon = CAAMoon.radiusVector(jd); // km
      const distanceToSun = 149_597_871; // km
      const rMoon = 1737.4; // km
      const rSun = 696_340; // km
      const thetaMoon = Math.atan2(rMoon, distanceToMoon);
      const thetaSun = Math.atan2(rSun, distanceToSun);

      if (sep > thetaMoon + thetaSun) {
        return 0;
      }
      const moonInsideSun = sep < thetaSun - thetaMoon;
      const sunInsideMoon = sep < thetaMoon - thetaSun;
      const dSq = sep * sep;
      const rMoonSq = thetaMoon * thetaMoon;
      const rSunSq = thetaSun * thetaSun;
      let frac;
      if (moonInsideSun || sunInsideMoon) {
        frac = rMoonSq / rSunSq;
      } else {
        // See https://mathworld.wolfram.com/Circle-CircleIntersection.html
        const intersectionArea =
          rMoonSq * Math.acos((dSq + rMoonSq - rSunSq) / (2 * sep * thetaMoon)) +
          rSunSq * Math.acos((dSq + rSunSq - rMoonSq) / (2 * sep * thetaSun)) -
          0.5 * Math.sqrt(
            (thetaSun + thetaMoon - sep) * (sep + thetaMoon - thetaSun) * (sep - thetaMoon + thetaSun) * (sep + thetaSun + thetaMoon)
          );
        frac = intersectionArea / (Math.PI * rSunSq);
      }
      return isNaN(frac) ? 1 : Math.max(Math.min(frac, 1), 0);
    },

    // Sample 1000 points between centrality start and end and record
    // the largest manually-computed eclipse fraction.
    sampleMaxFraction() {
      const start = this.prediction?.centralStart[0];
      const end = this.prediction?.centralEnd[0];
      if (!(start instanceof Date) || !(end instanceof Date)) {
        this.maxManualFraction = null;
        return;
      }
      const n = 1000;
      let best = { frac: -1, time: start };
      for (let i = 0; i <= n; i++) {
        const t = new Date(start.getTime() + ((end.getTime() - start.getTime()) * i) / n);
        const frac = this.fractionEclipsed(t);
        if (frac > best.frac) {
          best = { frac, time: t };
        }
      }
      this.maxManualFraction = best;
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
