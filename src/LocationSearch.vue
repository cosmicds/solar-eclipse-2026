
<template>
  <div
    class="forward-geocoding-container"
    ref="container"
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
        ref="searchIcon"
        tabindex="0"
        @click="activateSearchIcon"
        @keyup.enter="activateSearchIcon"
      >
        <font-awesome-icon
          icon="magnifying-glass"
          :size="searchOpen ? 'xl' : buttonSize"
          :color="!searchOpen || (searchText && searchText.length > 2) ? accentColor : 'gray'"
        ></font-awesome-icon>
      </div>

      <slot name="append-icon" class="geocode-icon"></slot>

    </div>
    
    <Teleport to="body" :disabled="!escapeContainer">
      <div
        class="forward-geocoding-results"
        :class="[small ? 'results-small' : '', openUpward ? 'results-up' : '']"
        :style="escapeContainer ? { ...cssStyles, ...escapedResultsStyle } : null"
        v-if="searchResults !== null"
      >
        <div
          v-for="(feature, index) in (searchResults !== null ?  searchResults.features : [])"
          class="forward-geocoding-result"
          :key="index"
          tabindex="0"
          @click="() => setLocationFromSearchFeature(feature)"
          @keyup.enter="() => setLocationFromSearchFeature(feature)"
        >
          {{ feature.place_name }}
        </div>
      </div>
    </Teleport>
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
  
  emits: ['update:modelValue','set-location', 'error'],
  
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

    buttonSize: {
      type: String,
      default: '1x',
    },

    openUpward: {
      type: Boolean,
      default: false,
    },

    // Teleports the results dropdown to <body> and positions it with
    // `position: fixed`, computed from the container's own on-screen
    // rect -- for when the search box sits inside a container that
    // clips overflow (e.g. a scrollable panel), so the dropdown can
    // still render below/outside that container instead of being cut
    // off by it.
    escapeContainer: {
      type: Boolean,
      default: false,
    },

  },


  data() {
    return {
      searchOpen: this.modelValue || this.stayOpen,
      searchText: null as string | null,
      searchResults: null as MapBoxFeatureCollection | null,
      searchErrorMessage: null as string | null,
      locationJustUpdated: false,
      escapedResultsStyle: {} as Record<string, string>,
    };
  },
  
  computed: {
    
    cssStyles() {
      return {
        '--accent-color': this.accentColor,
        '--bg-color': 'rgba(0, 0, 0, 0.7)',
        '--fg-container-padding': this.searchOpen ? (this.small ? '0px 5px 0px 0px' : '5px 10px 12px 10px') : '0px',
        '--border-radius': this.searchOpen ? 'var(--tight-border-radius, 5px)' : 'var(--normal-border-radius, 10px)',
        '--container-border': this.searchOpen ? '2px solid var(--accent-color)' : 'none',
        '--container-background': this.searchOpen ? 'rgba(0, 0, 0, 0.7)' : 'transparent',
        '--search-icon-border': this.searchOpen ? 'none' : '2px solid var(--accent-color)',
        '--search-icon-background': this.searchOpen ? 'none' : 'rgba(0, 0, 0, 0.7)',
        '--search-icon-backdrop-filter': this.searchOpen ? 'none' : 'blur(6px)',
      };
    },
  },
  
  
  methods: {
    activateSearchIcon() {
      if (this.searchOpen) {
        if (this.stayOpen || (this.searchText && this.searchText.length > 0)) {
          this.performForwardGeocodingSearch();
          this.$nextTick(() => {
            (this.$refs.searchIcon as HTMLElement | undefined)?.focus();
          });
        } else {
          this.searchOpen = false;
          this.clearSearchData();
        }
      } else {
        this.searchOpen = true;
      }
    },

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

    updateEscapedResultsPosition() {
      if (!this.escapeContainer) {
        return;
      }
      const el = this.$refs.container as HTMLElement | undefined;
      if (!el) {
        return;
      }
      const rect = el.getBoundingClientRect();
      this.escapedResultsStyle = {
        position: 'fixed',
        top: `${rect.bottom}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        zIndex: '900',
      };
    },

    locationSearchTabStops(): HTMLElement[] {
      const container = this.$refs.container as HTMLElement | undefined;
      const input = container?.querySelector('.forward-geocoding-input input') as HTMLElement | null ?? null;
      const icon = container?.querySelector('.geocoding-search-icon') as HTMLElement | null ?? null;
      const results = Array.from(document.querySelectorAll('.forward-geocoding-result')) as HTMLElement[];
      return [input, icon, ...results].filter((el): el is HTMLElement => el !== null);
    },

    onLocationSearchTabKeydown(event: KeyboardEvent) {
      if (this.searchResults === null || event.key !== 'Tab') {
        return;
      }
      const stops = this.locationSearchTabStops();
      const currentIndex = stops.indexOf(document.activeElement as HTMLElement);
      if (currentIndex === -1) {
        return;
      }
      event.preventDefault();
      const delta = event.shiftKey ? -1 : 1;
      const nextIndex = (currentIndex + delta + stops.length) % stops.length;
      stops[nextIndex].focus();
    },
  },

  mounted() {
    window.addEventListener('resize', this.updateEscapedResultsPosition);
    document.addEventListener('keydown', this.onLocationSearchTabKeydown, true);
  },

  beforeUnmount() {
    window.removeEventListener('resize', this.updateEscapedResultsPosition);
    document.removeEventListener('keydown', this.onLocationSearchTabKeydown, true);
  },

  watch: {

    searchResults(value: MapBoxFeatureCollection | null) {
      if (value !== null) {
        this.$nextTick(() => this.updateEscapedResultsPosition());
      }
    },

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
  
  .icon-wrapper.geocoding-search-icon {
    --color: var(--accent-color);
    background: var(--search-icon-background) !important;
    border: var(--search-icon-border) !important;
    backdrop-filter: var(--search-icon-backdrop-filter) !important;
  }

  .geocoding-search-icon:hover {
    cursor: pointer;
  }
}

// Deliberately NOT nested inside .forward-geocoding-container -- when
// escapeContainer is set, this element is teleported to <body>, and a
// nested selector here would compile to a descendant combinator
// (.forward-geocoding-container .forward-geocoding-results) that stops
// matching once the element is no longer actually inside that container
// in the DOM (silently dropping the background/border/etc., since none
// of it is set via inheritable properties). A top-level selector, plus
// the CSS vars it depends on set directly via inline style when
// escaped (see the :style binding in the template), works regardless
// of where in the DOM this ends up.
//
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
  border-bottom-left-radius: var(--tight-border-radius, 5px);
  border-bottom-right-radius: var(--tight-border-radius, 5px);
  padding: 0px 10px;
  color: var(--accent-color);

  &.results-small {
    top: 37px;
    width: calc(100% + 4px);
    left: -2px;
  }

  &.results-up {
    top: auto;
    bottom: 42px;
    border-top: 2px solid var(--accent-color);
    border-bottom: 0px;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    border-top-left-radius: var(--tight-border-radius, 5px);
    border-top-right-radius: var(--tight-border-radius, 5px);

    &.results-small {
      bottom: 37px;
    }
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
</style>
