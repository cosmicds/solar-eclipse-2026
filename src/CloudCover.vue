<script lang ="ts">
import { defineComponent, PropType } from "vue";
import { VIcon } from "vuetify/components/VIcon";

export default defineComponent({
  name: 'CloudCover',

  components: {
    'v-icon':VIcon,
  },
  
  props: {
    cloudCover: {
      type: null as unknown as PropType<number | null>,
      required: true,
      default: null
    }
  },
  
  
  computed: {
    cloudCoverFracToLabel() {
      if (this.cloudCover !== null) {
        return `${(this.cloudCover * 100).toFixed(0)}%`;
      }
      return 'No data';
    },
    
    cloudIcon() {
    
      if (this.cloudCover == null) {
        return 'mdi-cloud-cancel';
      } 
      else if (this.cloudCover < .25) {
        return 'mdi-weather-sunny';
      }
      else if (this.cloudCover < .5) {
        return 'mdi-weather-partly-cloudy';
      } 
      else if (this.cloudCover < 0.9) {
        return 'mdi-weather-cloudy';
      } 
      else {
        return 'mdi-clouds';
      } 
    }
  },

  
});


</script>


<template>
  <div class="cloud-cover-container my-2 py-1">
    <div class="cloud-cover-icon">
      <v-icon size="35">{{ cloudIcon }}</v-icon>
    </div>
    
    <div class="cloud-cover-label">
      <div class="cloud-cover-label-text"> Median historical<br>cloud cover: </div>
      <div class="cloud-cover-label-value">{{ cloudCoverFracToLabel }}</div>
    </div>
  
  </div>
    

</template>


<style>



.cloud-cover-container {
  display: flex;
  height: 100%;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  outline: 1px solid var(--accent-color);
}

.cloud-cover-label {
  display: flex;
  align-items: center;
  padding-left: 10px;
}

.cloud-cover-label-text {
  font-size: calc(1.1 * var(--default-font-size));
  font-weight: normal;
  /* Fixed (not %) so its width — and therefore how it wraps around the
     <br> — doesn't depend on how wide the sibling value text happens to
     be ("No data" vs "42%" otherwise wrapped this differently). */
  width: 9em;
  flex-shrink: 0;
  text-align: center;
}

.cloud-cover-label-value {
  font-size: calc(1.3 * var(--default-font-size));
  margin-left: 1rem;
  font-weight: bold;
  width: 4.5em;
  flex-shrink: 0;
  text-align: center;
}

/* Only named as a size container on desktop (min-width: 601px matches the
   app's own narrow/mobile breakpoint) -- on mobile this box is always full
   width and doesn't need the narrow-box handling below, and since the
   @container rule can't match without a named container ancestor, leaving
   container-name unset there is what keeps this desktop-only. */
@media (min-width: 601px) {
  .cloud-cover-container {
    container-type: inline-size;
    container-name: cloud-cover;
  }
}

/* The icon plus the label's fixed-width columns have a combined minimum
   width wider than this box can get on desktop once its resize handle is
   dragged narrow -- text and the % value then spilled out past the box's
   own outline instead of shrinking. Below that width, drop the icon and
   let the label wrap instead. */
@container cloud-cover (max-width: 300px) {
  .cloud-cover-icon {
    display: none;
  }

  .cloud-cover-label {
    flex-wrap: wrap;
    justify-content: center;
    min-width: 0;
  }

  .cloud-cover-label-text,
  .cloud-cover-label-value {
    width: auto;
    flex-shrink: 1;
    /* Flex items default to min-width: auto, which floors their size at
       their unwrapped content width and defeats flex-shrink/wrapping --
       without this override the text/value still overflow the container. */
    min-width: 0;
  }
}

</style>
