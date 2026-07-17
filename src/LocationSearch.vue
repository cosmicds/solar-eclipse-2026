
<template>
  <div
    class="forward-geocoding-container"
    :style="cssStyles"
  >
    <div
      class="forward-geocoding-input-row"
    >
      <v-text-field
        v-show="searchOpen"
        v-model="searchText"
        :class="['forward-geocoding-input', small ? 'forward-geocoding-input-small' : '']"
        :label="locationJustUpdated ? 'Location Updated' : 'Enter a location'"
        bg-color="transparent"
        density="compact"
        hide-details
        variant="solo"
        :color="accentColor"
        @keydown.stop
        @keyup.enter="() => performForwardGeocodingSearch()"
        @keyup.esc="searchResults = null"
        @click:clear="searchResults = null"
        :error-messages="searchErrorMessage"
      ></v-text-field>
      <div
        class="icon-wrapper geocoding-search-icon"
        tabindex="0"
        @click="() => {
          if (searchOpen) {
            performForwardGeocodingSearch();
          } else {
            searchOpen = true;
          }
        }"
        @keyup.enter="() => {
          if (searchOpen) {
            performForwardGeocodingSearch();
          } else {
            searchOpen = true;
          }
        }"
      >
        <font-awesome-icon
          icon="magnifying-glass"
          :size="searchOpen ? 'xl' : buttonSize"
          :color="!searchOpen || (searchText && searchText.length > 2) ? accentColor : 'gray'"
        ></font-awesome-icon>
      </div>
      
      <slot name="append-icon" class="geocode-icon"></slot>
      
      <font-awesome-icon
        class="geocoding-close-icon"
        v-show="searchOpen && !stayOpen"
        icon="xmark"
        :size="searchOpen ? 'xl' : '1x'"
        :color="accentColor"
        tabindex="0"
        @click="() => {
          searchOpen = false;
          clearSearchData();
        }"
        @keyup.enter="() => {
          searchOpen = false;
          clearSearchData();
        }"
      ></font-awesome-icon>
      
    </div>
    
    <div
      class="forward-geocoding-results"
      :class="[small ? 'results-small' : '']"
      v-if="searchResults !== null"
    >
      <div
        v-for="(feature, index) in (searchResults !== null ?  searchResults.features : [])"
        class="forward-geocoding-result"
        :key="index"
        @click="() => setLocationFromSearchFeature(feature)"
      >
        {{ feature.place_name }}
      </div>
    </div>
  </div>
</template> 



<script lang="ts">
import { defineComponent, PropType } from 'vue';

interface MapBoxContextItem {
  id: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  mapbox_id: string;
  text: string;
  wikidata: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  short_code?: string;
}

interface MapBoxFeature {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  place_type: string[];
  // eslint-disable-next-line @typescript-eslint/naming-convention
  place_name: string;
  text?: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  properties: { short_code: string; };
  center: [number, number];
  context: MapBoxContextItem[];
}

interface MapBoxFeatureCollection {
  type: "FeatureCollection";
  features: MapBoxFeature[];
}

// function type that takes in string and Promise<MapBoxFeatureCollection | null>
type SearchProvider = (searchText: string) => Promise<MapBoxFeatureCollection | null>;


export default defineComponent({
  name: 'LocationSearch',
  
  emits: ['update:modelValue','set-location', 'error', 'geolocate'],
  
  props: {
    
    searchProvider: {
      type: Function as PropType<SearchProvider>,
      default: () => {}
    },
    
    modelValue: {
      type: Boolean,
      default: true,
      required: false,
    },
    
    stayOpen: {
      type: Boolean,
      default: false,
    },
    
    accentColor: {
      type: String,
      default: 'white',
    },
    
    small: {
      type: Boolean,
      default: false,
    },
    
    theme: {
      type: String,
      default: 'dark',
    },
    
    buttonSize: {
      type: String,
      default: '1x',
    },
    
  },
  
  
  data() {
    return {
      searchOpen: this.modelValue || this.stayOpen,
      searchText: null as string | null,
      searchResults: null as MapBoxFeatureCollection | null,
      searchErrorMessage: null as string | null,
      locationJustUpdated: false,
    };
  },
  
  computed: {
    
    cssStyles() {
      return {
        '--accent-color': this.accentColor,
        '--bg-color': 'rgba(0, 0, 0, 0.7)',
        '--fg-container-padding': this.searchOpen ? (this.small ? '0px 5px 0px 0px' : '5px 10px 12px 10px') : '0px',
        // --tight-border-radius/--normal-border-radius come from the app
        // itself (set on <v-app>, which is an ancestor of every
        // location-search instance) — CSS custom properties inherit
        // through the DOM regardless of component boundaries, so they're
        // already available here with no extra wiring needed.
        '--border-radius': this.searchOpen ? 'var(--tight-border-radius, 5px)' : 'var(--normal-border-radius, 10px)',
        // When open, the container's own border wraps the whole input row.
        // When closed, it collapses to hug just the icon — if it kept its
        // own border on top of the icon's, the closed button would be 4px
        // bigger in each dimension than every other icon-wrapper button.
        // So the border moves onto the icon itself instead while closed.
        '--container-border': this.searchOpen ? '2px solid var(--accent-color)' : 'none',
        // Closed, the container collapses (zero padding/border) to hug just
        // the icon, so its own background would render as a solid patch
        // exactly behind the (background-less) icon -- indistinguishable
        // from the icon itself having a background. Only give the container
        // a background while it's actually showing the input row.
        '--container-background': this.searchOpen ? 'rgba(0, 0, 0, 0.7)' : 'transparent',
        '--search-icon-border': this.searchOpen ? 'none' : '2px solid var(--accent-color)',
        // Open, the icon sits inline in the input row (the row/container
        // itself carries the background) so it should have none of its own.
        // Closed, it's a standalone button and should look exactly like
        // every other icon-wrapper button, background included.
        '--search-icon-background': this.searchOpen ? 'none' : 'rgba(0, 0, 0, 0.7)',
        // The global .icon-wrapper rule applies backdrop-filter: blur(6px)
        // unconditionally. Left on while open, it still blurs/darkens
        // whatever's behind the icon (the container's own already-blurred
        // background) even with no background-color of its own -- looking
        // just like a background. Only keep the blur while closed, to
        // match the other icon-wrapper buttons.
        '--search-icon-backdrop-filter': this.searchOpen ? 'none' : 'blur(6px)',
      };
    },
  },
  
  
  methods: {
    performForwardGeocodingSearch() {
      if (this.searchText === null || this.searchText.length < 3) {
        return;
      }
      this.searchProvider(this.searchText).then((info) => {
        if (info !== null && info.features?.length === 1) {
          this.setLocationFromSearchFeature(info.features[0]);
        } else if (info !== null && info.features?.length == 0) {
          this.searchErrorMessage = "No matching places were found";
          this.$emit('error', this.searchErrorMessage);
        } else {
          this.searchResults = info;
        }
      });
    },
    
    setLocationFromSearchFeature(feature: unknown) {
      this.timedJustUpdatedLocation();
      this.clearSearchData();
      this.$emit('set-location', feature);
    },
    
    clearSearchData() {
      this.searchResults = null;
      this.searchText = null;
      this.searchErrorMessage = null;
    },
    
    timedJustUpdatedLocation() {
      this.locationJustUpdated = true;
      setTimeout(() => {
        this.locationJustUpdated = false;
      }, 5000);
    },
  },
  
  watch: {
    
    modelValue(value: boolean) {
      this.searchOpen = value;
    },
    
    searchOpen(value: boolean) {
      this.$emit('update:modelValue', value);
    },
    
    searchText(text: string | null) {
      if (this.searchErrorMessage) {
        this.searchErrorMessage = null;
      }
      if (!text || text.length === 0) {
        this.searchResults = null;
      }
    },
  }
  
});

</script>


<style lang="less">

// https://vue-loader.vuejs.org/guide/scoped-css.html#deep-selectors
.forward-geocoding-container {
  position: relative;
  width: fit-content;
  height: fit;
  color: var(--accent-color);
  background-color: var(--container-background);
  backdrop-filter: blur(6px);
  border: var(--container-border);
  border-radius: var(--border-radius);
  padding: var(--fg-container-padding);

  .v-text-field {
    min-width: 150px;
    width: min(200px, 20vw);
  }
  
  .forward-geocoding-input > .v-input__control > .v-field {
    border-radius: var(--border-radius);
    // The solo variant's default elevation shadow extends a few pixels
    // past the field's own box. The container has no top/bottom padding
    // around it, so that shadow bled over the container's own border,
    // making it look discontinuous.
    box-shadow: none;
  }

  .forward-geocoding-input label {
    color: var(--accent-color);
    opacity: 1;
  }
  
  .forward-geocoding-input-small label {
    // .v-label sets default to 1rem
    font-size: 0.8rem;
  }

  .forward-geocoding-input-row {
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    gap: 10px;
    align-items: center;
  }
  
  .geocoding-search-icon {
    --color: var(--accent-color);
    background: var(--search-icon-background);
    border: var(--search-icon-border);
    backdrop-filter: var(--search-icon-backdrop-filter);
  }

  .geocoding-search-icon:hover, #geocoding-close-icon:hover {
    cursor: pointer;
  }

  // For some reason setting width: 100% makes the search results 2px too small
  // It's probably some Vuetify styling thing
  // Maybe there's a better workaround, but this gets the job done for now
  .forward-geocoding-results {
    position: absolute;
    top: 42px;
    left: -1px;
    width: calc(100% + 2px);
    background: var(--bg-color);
    backdrop-filter: blur(6px);
    border: 2px solid var(--accent-color);
    border-top: 0px;
    // Results only ever show while searchOpen (the container itself is
    // using --tight-border-radius then), so match that instead of a
    // separately hardcoded value.
    border-bottom-left-radius: var(--tight-border-radius, 5px);
    border-bottom-right-radius: var(--tight-border-radius, 5px);
    padding: 0px 10px;
    
    &.results-small {
      top: 37px;
      width: calc(100% + 4px);
      left: -2px;
    }

    .forward-geocoding-result {
      border-top: 1px solid var(--accent-color);
      font-size: 12pt;
      pointer-events: auto;

      &:hover {
        cursor: pointer;
      }
    }
  }
}
</style>
