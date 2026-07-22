<template>
<v-app
  id="app"
  :style="cssVars"
  :inert="showSplashScreen"
>

  <!-- Floating button to reopen the top content box once it's hidden.
       Stays in the DOM (v-show, not v-if) even while the box is open so
       the ref used below to reset its tooltip/focus keeps working. -->
  <div id="closed-top-container" v-show="!narrow && !showGuidedContent" class="budge">
    <icon-button
      v-model="showGuidedContent"
      id="show-guided-content"
      ref="showGuidedContent"
      fa-icon="chevron-down"
      fa-size="lg"
      :color="accentColor"
      :focus-color="accentColor"
      tooltip-text="Click to learn more"
      :tooltip-location="'bottom'"
      :show-tooltip="!mobile"
      :box-shadow="false"
      @activate="onResize"
    >
    <template v-slot:button>
      <font-awesome-icon icon="chevron-down" size="lg" class="bullet-icon"/> Path & Weather
    </template>
  </icon-button>
  </div>
  <div id="guided-content-wrapper" :class="{ 'mobile-fullscreen': narrow && showGuidedContent }">
  <v-container
    id="guided-content-container"
    v-show="showGuidedContent"
    :style="topContainerStyle"
    :class="{ 'no-height-transition': isResizingTopContainer }"
  >
    <div id="non-map-container" :style="nonMapContainerStyle">
        <div id="title-row" class="non-map-row">

            <!-- In-flow (not overlaid) close control, so it always has its
                 own reserved space and never overlaps the title text. -->
            <icon-button
              v-if="!narrow"
              v-model="showGuidedContent"
              id="hide-guided-content"
              fa-icon="chevron-up"
              fa-size="lg"
              :color="accentColor"
              :focus-color="skyColor"
              background-color="transparent"
              tooltip-text="Hide Info and Map"
              :tooltip-location="'bottom'"
              :show-tooltip="!mobile"
              :box-shadow="false"
              @activate="onResize"
            ></icon-button>

            <div id="title">
              <span v-if="learnerPath=='Location'"
                >Who Sees Totality?
              </span>
              <span v-if="learnerPath=='Clouds'"
                >Historical Cloud Data
              </span>
              <span v-if="!showNewMobileUI && learnerPath=='CloudDetail'"
                >Explore Detailed Cloud Data
              </span>
            </div>

            <!-- On mobile, the box is closed via this X (in place of the
                 desktop chevron above) instead -- there's no room for both
                 a reserved-space close control and the title next to it.
                 A flex sibling of the title (not an overlaid corner badge)
                 so it lines up vertically with the title text itself. -->
            <div
              v-if="narrow"
              class="dialog-close-button title-row-close-button"
              @click="() => { showGuidedContent = false; onResize(); }"
              @keyup.enter="() => { showGuidedContent = false; onResize(); }"
              tabindex="0"
            >
              <font-awesome-icon icon="xmark" size="xl" :color="accentColor2"></font-awesome-icon>
            </div>

        </div>
        <div id="instructions-row" class="non-map-row">
          <div id="top-container-main-text">                    
            <!-- Choose Path -->
            <div class="instructions-text" v-if="learnerPath=='Location'">

              <span class="description">
                <p>The path of totality is displayed across the map as a gray band with a red center line.</p>
                <p v-if="narrow">
                  Close this view to "watch" the eclipse from the location marked by the red dot on the map.
                </p>
                <p v-else>
                  "Watch" the eclipse from the location marked by the red dot on the map.
                </p>
                <p>
                  <strong>{{ touchscreen ? "Tap" : "Click" }}</strong> the map to select any location and view the eclipse from there, or
                </p>
                <p v-if="narrow">
                  <strong>Enter a location</strong> in the search box below.
                </p>
                <p v-else>
                  <strong>Enter a location</strong> in the search box to the right.
                </p>
              </span>
            </div>

            <!-- Clouds Path -->
            <div class="instructions-text" v-if="learnerPath=='Clouds'">
              <span class="description">
                <div class=".d-flex">
                  <div>
                    This map shows historical cloud cover data for the week of August 12 for the years 2003&#8211;2023 from <a href="https://modis.gsfc.nasa.gov/" target="_blank" rel="noopener noreferrer">MODIS</a> on NASA's Aqua satellite.
                    {{ touchscreen ? "Tap" : "Click" }} the map to display the <define-term term="median" definition="For <strong>half</strong> of the years from 2003–2023 on August 12, the cloud cover amount was <strong>less</strong> than the median value. For the other <strong>half</strong> of the years, the cloud cover was <strong>more</strong> than the median value."/> cloud coverage for a particular location (within about 100 km). 
                  </div>
                  <div>
                    <cloud-cover
                      :cloud-cover="selectedLocationCloudCover"
                      @cloudIcon="cloudIcon = $event"
                    />
                  </div>
                  
                </div>
              </span>
            </div>
            
            
          </div>
        </div>
        <div id="button-row" class="non-map-row">
            <div id="top-container-buttons">
              <icon-button
                :model-value="learnerPath == 'Location'"
                md-icon="map-search"
                md-size="24"
                :color="accentColor"
                :focus-color="accentColor"
                :tooltip-text="'Choose any viewing location'"
                :tooltip-location="'bottom'"
                :show-tooltip="!mobile"
                :box-shadow="false"
                @activate="() => { learnerPath = 'Location'}"
              ></icon-button>
              <icon-button
                :model-value="learnerPath == 'Clouds'"
                fa-icon="cloud-sun"
                fa-size="xl"
                :color="accentColor"
                :focus-color="accentColor"
                :tooltip-text="'View historical cloud coverage'"
                :tooltip-location="'bottom'"
                :show-tooltip="!mobile"
                :box-shadow="false"
                @activate="() => { learnerPath = 'Clouds'}"
              ></icon-button>
            </div>
        </div>
      </div>
      <div
        v-if="smAndUp"
        id="map-column-resize-handle"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize map width"
        tabindex="0"
        @mousedown="startMapWidthResize"
        @touchstart="startMapWidthResize"
        @keydown="onMapWidthResizeKeydown"
      ></div>
      <div
        v-if="!smAndUp"
        id="mobile-map-height-resize-handle"
        role="separator"
        aria-orientation="horizontal"
        aria-label="Resize map height"
        tabindex="0"
        @mousedown="startMobileNonMapHeightResize"
        @touchstart="startMobileNonMapHeightResize"
        @keydown="onMobileNonMapHeightResizeKeydown"
      ></div>
      <div id="map-column">
      <v-hover v-slot="{isHovering, props}">
        <v-btn v-bind="props" v-if="false &&!isHovering && !smAndUp" color="blue" :width="'100%'">Tap here to reveal map</v-btn>
        <v-slide-y-transition
          :disabled="smAndUp"
        >
          <div
            :class="['']"
            id="map-container">

            <!-- modelValue = false, starts with it closed, use stay-open to keep it open.
                 Shown on both mobile and desktop now -- the geolocate search
                 and "use my location" controls live over the small map on
                 both, rather than desktop having its own separate copies
                 floating over the WWT canvas. -->
            <div class="map-bottomleft-stack">
              <!-- On mobile, the top-left location-status-box (in
                   #left-buttons-wrapper) sits behind this full-screen map
                   overlay and is never visible while the map is open --
                   repeat a compact copy of it here (name + eclipse status,
                   no date) so location context is still visible. -->
              <div
                v-if="narrow"
                id="location-status-box-overmap"
              >
                <div class="location-status-name"><strong>{{ selectedLocationText }}</strong></div>
                <div v-if="eclipsePredictionText" class="eclipse-status-line">{{ eclipsePredictionText }}</div>
              </div>
              <location-search
                class="map-search-bottomleft"
                v-model="searchOpen"
                small
                buttonSize="xl"
                :search-provider="geocodingInfoForSearch"
                :accentColor="accentColor"
                :open-upward="narrow"
                :escape-container="!narrow"
                @set-location="setLocationFromSearchFeature"
                @error="searchErrorMessage = $event"
              >
              </location-search>
            </div>
            <icon-button
              v-if="getMyLocation"
              id="my-location-overmap"
              fa-icon="location-crosshairs"
              fa-size="2xl"
              :color="myLocationColor"
              :focus-color="myLocationColor"
              :box-shadow="false"
              :tooltip-text="myLocationToolTip"
              :show-tooltip="!mobile"
              @update:modelValue="(value: boolean) => {
                if(value) {
                  ($refs.geolocation as any).getLocation();
                  showMyLocationDialog = true;
                  learnerPath = 'Location';
                }
                else {
                  console.log('geolocation button pressed = false');
                }

              }"
            ></icon-button>
            <div v-if="narrow" class="map-topright-stack">
              <icon-button
                id="eclipse-details-overmap"
                md-icon="sun-clock"
                md-size="24"
                :color="accentColor"
                :focus-color="accentColor"
                tooltip-text="View eclipse timing details"
                tooltip-location="start"
                @activate="() => { showEclipsePredictionSheet = true; }"
                >
              </icon-button>
              <icon-button
                id="reset-location-overmap"
                fa-icon="house"
                fa-size="lg"
                :color="accentColor"
                :focus-color="accentColor"
                :box-shadow="false"
                tooltip-text="Reset to Antiguita, Spain"
                tooltip-location="start"
                @activate="() => {
                  location = defaultLocation;
                  selectedLocationText = defaultLocationText;
                  learnerPath = 'Location';
                  // The pin resets to Antiguita, Spain, but the map's own
                  // camera should return to this session's actual
                  // starting view (which is deliberately NOT centered on
                  // Antiguita -- see initialMapOptions), not wherever the
                  // pin ends up. Deferred a tick: the location change
                  // above also triggers location-selector's own
                  // modelValue watcher, which re-centers/zooms the map
                  // on the pin's new position -- calling this after that
                  // watcher runs, rather than before, is what makes it
                  // win instead of being immediately undone by it.
                  $nextTick(() => {
                    (($refs.locationSelector as any)?.resetToInitialView)?.();
                  });
                }"
              ></icon-button>
            </div>
            <!-- :places="places" -->
            <location-selector
              ref="locationSelector"
              :model-value="locationDeg"
              @update:modelValue="updateLocationFromMap"
              :place-circle-options="placeCircleOptions"
              :detect-location="false"
              :map-options="(['Clouds', 'CloudDetail'].includes(learnerPath)) ? userSelectedMapOptions : initialMapOptions"
              :selected-circle-options="selectedCircleOptions"
              :show-cloud-cover="['Clouds', 'CloudDetail'].includes(learnerPath) && cloudCoverData !== null"
              class="leaflet-map"
              :geo-json-files="geojson"
              :selected-cloud-cover="selectedCloudCoverData"
              :cloud-cover-opacity-function="sigmoid"
              :rectangle-degrees="rectangleDegrees"
            ></location-selector>
          </div>
        </v-slide-y-transition>
      </v-hover>
    </div>
  </v-container>
    <div
      v-show="showGuidedContent && !narrow"
      id="top-container-resize-handle"
      role="separator"
      aria-orientation="horizontal"
      aria-label="Resize map area"
      tabindex="0"
      @mousedown="startTopContainerResize"
      @touchstart="startTopContainerResize"
      @keydown="onTopContainerResizeKeydown"
    ></div>
  </div>


    <v-dialog
      scrim="false"
      transition="slide-y-transition"
      v-model="showInfoSheet" 
      class='bottom-sheet'
      id="text-bottom-sheet"
      :style="cssVars"
    >
      <v-card
        class="bottom-sheet-card">
        <v-tabs
          v-model="infoTab"
          height="32px"
          :color="accentColor"
          :slider-color="accentColor"
          id="tabs"
          dense
        >
          <v-tab class="info-tabs" tabindex="0"><h3>Eclipse Science</h3></v-tab>
          <v-tab class="info-tabs" tabindex="0"><h3>User Guide</h3></v-tab>
        </v-tabs>
        <div
          class="dialog-close-button"
          @click="showInfoSheet = false"
          @keyup.enter="showInfoSheet = false"
          tabindex="0"
        >
          <font-awesome-icon icon="xmark" size="xl" :color="accentColor2"></font-awesome-icon>
        </div>
        <v-window v-model="infoTab" id="tab-items" class="no-bottom-border-radius">
          <v-window-item>
        <v-card class="no-bottom-border-radius scrollable">
          <v-card-text class="info-text no-bottom-border-radius">
            <v-container id="learn-more-content">
                <div id="info-text-box">

                  <div id="main-info-text">
                    <p>
                    On August 12, 2026, Europe will be treated to an awe-inspiring total eclipse. 
                    </p>
                    <p>
                    This interactive lets you explore the August total eclipse from different locations. 
                    </p>
                    <p id="safety-warning">
                      SAFETY FIRST: NEVER look directly at the Sun without proper eye protection.
                    </p>
                  </div>  
                  <div id="FAQ">
                    <details>
                      <summary>
                        What causes Solar Eclipses?
                      </summary>
                      <p>
                        A solar eclipse happens when the Moon passes between the Earth and the Sun and blocks the Sun from our view. Partial eclipses occur about every 6 months, somewhere on the Earth. 
                      </p>
                    </details>
                    
                    <details>
                      <summary> Total? Annular? What is the difference?</summary>
                      <p>
                        During a <strong>total eclipse</strong>, the Moon covers the entire face of the Sun. Because the Moon doesn't orbit the Earth in a perfect circle, sometimes it is farther away from Earth and appears smaller. When this happens, the Moon doesn't cover the entire face of the Sun. During the eclipse we can still see a bright ring of light around the Moon, sometimes called the "Ring of Fire." This is called an <strong>annular Eclipse</strong>.
                      </p>
                    </details>

                    <details>
                      <summary> What is the wispy haze around the Sun during a Total Solar Eclipse?</summary>
                      <p>
                        The <strong>corona</strong> is the outermost layer of the Sun's atmosphere, and it is made up of extremely hot, glowing gas. We usually can't see the corona because the Sun's surface shines so much more brightly. During a total solar eclipse, the Moon blocks light from the surface of the Sun, making it possible to see the ethereally beautiful corona.
                      </p>
                    </details>
                    
                    <details> 
                      <summary> Why can only some places see the eclipse?</summary>
                      <p>
                        An eclipse is caused by the Moon casting a shadow on the Earth. People who are directly behind the Moon will see an annular or total eclipse. As the Moon moves in its orbit around Earth, and as Earth rotates, the location of the shadow will move, sweeping out a path across the surface of the Earth. For a larger number of people who are not directly behind the moon, a smaller amount of the Sun will be blocked, causing a partial eclipse. Even further outside the shadow the Sun will not be blocked at all, and there will be no eclipse visible.
                      </p>
                      <p> 
                        The animated figure shows that the Moon's shadow on Earth has two distinct regions. The darker part of the shadow is directly behind the Moon, where people will experience an annular or total eclipse. The lighter part of the shadow falls where people on Earth will see a partial solar eclipse.
                      </p> 
                    </details>

                    <details> 
                      <summary>How precise are location and timing predications in this Data Story?</summary>
                      <p>
                        You may notice some discrepancies in the reported eclipse percentages or with eclipse start and end times compared with other predictions. This is caused by limitations in precision for the calculations used to display the locations and sizes of the Sun and Moon on your screen. Totality timing predictions in this Data Story should be accurate to within about 15 seconds.
                      </p> 
                    </details>
                    
                    <details>
                      <summary>Where can I learn more?</summary>
                      <div class="p">
                        Check out
                        <ul>
                          <li>
                            Infiniscope's Kingdom in Peril lessons on eclipses, available in <a href="https://infiniscope.org/collection/3" target="_blank" rel="noopener noreferrer">English</a> and <a href="https://infiniscope.org/collection/6" target="_blank" rel="noopener noreferrer">Spanish</a>
                          </li>
                          <li>
                            Fiske Planetarium's <a href="https://www.colorado.edu/fiske/projects/science-through-shadows" target="_blank" rel="noopener noreferrer">Science Through Shadows</a> videos
                          </li>
                        </ul>
                      </div>
                    </details>
                  </div>
                </div>
              <figure>
                <gif-play-pause startPaused :gif='require("./assets/eclipse.gif")' :still='require("./assets/eclipse_static.gif")' alt="Animated schematic of a solar eclipse showing how the Moon moves between the Sun and Earth."/>
                <figcaption>Image credit: NASA Goddard / Katy Mersmann</figcaption>
                <div class="disclaimer">Not to scale</div>
              </figure>
            </v-container>
          </v-card-text>
        </v-card>
          </v-window-item>
          <v-window-item>
        <v-card class="no-bottom-border-radius scrollable">
          <v-card-text class="info-text no-bottom-border-radius">
            <v-container  id="user-guide">
              <p style="font-size: calc(1.1 * var(--default-font-size))">
                This Cosmic Data Story allows you to display the August 12, 2026 Total Solar Eclipse from any location.
              </p>
              <v-checkbox
                v-model="showIntroAtLaunch"
                @keyup.enter="showIntroAtLaunch = !showIntroAtLaunch"
                label="Show quickstart introduction when app opens"
                :color="accentColor"
                hide-details
                density="compact"
                class="mb-5 show-intro-checkbox"
              />
              <v-row align="center">
              <v-col cols="4">
                  <v-chip
                    label
                    outlined
                  >
                    Pan
                  </v-chip>
                </v-col>
                <v-col cols="8" class="pt-1">
                  <strong>{{ touchscreen ? "press + drag" : "click + drag" }}</strong>  {{ touchscreen ? "" : "or" }}  <strong>{{ touchscreen ? "" : "W-A-S-D" }}</strong> {{ touchscreen ? "" : "keys" }} <br>(Disabled if tracking Sun)<br>
                </v-col>
              </v-row>
              <v-row align="center">
                <v-col cols="4">
                  <v-chip
                    label
                    outlined
                  >
                    Zoom
                  </v-chip>
                </v-col>
                <v-col cols="8" class="pt-1">
                  <strong>{{ touchscreen ? "pinch in and out" : "scroll in and out" }}</strong> {{ touchscreen ? "" : "or" }} <strong>{{ touchscreen ? "" : "I-O" }}</strong> {{ touchscreen ? "" : "keys" }}<br>
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="12">
                  <div
                      style="min-height: 120px;"
                  >                   
                    <h4 class="user-guide-header">Map Options:</h4>
                    <p v-if="!showNewMobileUI">(Top of the screen)</p>
                    <p v-else>
                      (Tap <v-icon
                        class="bullet-icon"
                        icon="mdi-map-search"
                        size="large">
                      </v-icon> to open)
                    </p>
                    <ul class="text-list">
                      <li>
                        Type a location into the search box to find a specific location.
                      </li>
                      <li>
                        {{ touchscreen ? "Tap" : "Click" }}
                        <font-awesome-icon
                          class="bullet-icon"
                          icon="location-crosshairs"
                          size="lg"
                        ></font-awesome-icon> to view from <strong>My Location</strong>. (If icon is grayed out, consult your device's user guide to enable location services. This feature works most reliably on Chrome and might not be available on every browser+operating system combination.)
                      </li>
                    </ul>

                    <v-divider thickness="2px" class="solid-divider"></v-divider>

                    <h4 class="user-guide-header">Time Controls:</h4>
                    <p>(Bottom of the screen)</p>
                    <p>
                      By default, time is moving forward at 500x the real speed. Time slows down to 10x the real speed as the eclipse approaches totality.
                    </p>
                    <ul class="text-list">
                      <li>
                        {{ touchscreen ? "Tap" : "Click" }} <font-awesome-icon
                          class="bullet-icon"
                          icon="play"
                          size="lg"
                        ></font-awesome-icon>/
                        <font-awesome-icon
                          class="bullet-icon"
                          icon="pause"
                          size="lg"
                        ></font-awesome-icon>
                        to play or pause time.
                      </li>
                      <li>
                        {{ touchscreen ? "Tap" : "Click" }} <font-awesome-icon
                              class="bullet-icon"
                              icon="angles-down"
                              size="lg"
                            ></font-awesome-icon>
                        to decrease speed by 5x.
                      </li>
                      <li>
                        {{ touchscreen ? "Tap" : "Click" }} <font-awesome-icon
                          class="bullet-icon"
                          icon="angles-up"
                          size="lg"
                        ></font-awesome-icon>
                        to increase speed by 5x.
                      </li>
                      <li>
                        {{ touchscreen ? "Tap" : "Click" }} <v-icon
                          class="bullet-icon"
                          icon="mdi-step-backward-2"
                          size="medium">
                        </v-icon>/
                        <v-icon
                          class="bullet-icon"
                          icon="mdi-step-forward-2"
                          size="medium">
                        </v-icon>
                        to play time backward or forward.
                      </li>
                      <li>
                        {{ touchscreen ? "Tap" : "Click" }} <font-awesome-icon
                              class="bullet-icon"
                              icon="house"
                              size="lg"
                            ></font-awesome-icon>
                        to reset starting time, speed, and location.
                      </li>
                      <li>
                        {{ touchscreen ? "Tap" : "Click" }} <font-awesome-icon
                              class="bullet-icon"
                              icon="gauge-high"
                              size="lg"
                            ></font-awesome-icon>
                        to open more speed controls.
                      </li>
                        <ul>
                          <li class="ml-5">
                            Use the slider to fine-tune desired speed.
                          </li>
                          <li class="ml-5">
                            {{ touchscreen ? "Tap" : "Click" }} <font-awesome-icon
                              class="bullet-icon"
                              icon="times"
                              size="lg"
                            ></font-awesome-icon>
                            to close speed controls.
                          </li>
                        </ul>
                      <li>
                        Drag <v-icon
                          class="bullet-icon"
                          icon="mdi-circle"
                          size="medium"
                        ></v-icon> along the main slider to move to any time.
                      </li>
                    </ul>

                    <v-divider thickness="2px" class="solid-divider"></v-divider>

                    <h4 class="user-guide-header">Location and Eclipse Status:</h4>
                    <p>(Upper-left of the screen)</p>
                    <ul class="text-list">
                      <li>
                        Selected Location: the location currently displayed in the view.
                      </li>
                      <li>
                        Eclipse Status: The type of eclipse (total, partial, or no eclipse) visible from your selected location on August 12, 2026.
                        <ul>
                          <li class="ml-5">
                            If Total: (amount of time in totality)
                          </li>
                          <li class="ml-5">
                            If Partial: (Maximum % eclipsed).
                          </li>
                        </ul>
                      </li>
                      <li>
                        {{ touchscreen ? "Tap" : "Click" }}
                        <v-icon
                          class="bullet-icon"
                          icon="mdi-sun-clock"
                          size="large">
                        </v-icon> to display detailed <span class="user-guide-emphasis-white">eclipse timing</span> predictions for your selected location.
                      </li>
                    </ul>

                    <v-divider thickness="2px" class="solid-divider"></v-divider>

                    <h4 class="user-guide-header">Display Options:</h4>
                    <p>(Upper-right of the screen)</p>
                    <ul class="text-list">
                      <li>
                        {{ touchscreen ? "Tap" : "Click" }} <font-awesome-icon
                              class="bullet-icon"
                              icon="sliders"
                              size="lg"
                            ></font-awesome-icon> to open controls.
                        <ul>
                          <li class="ml-5">
                            <span class="user-guide-emphasis-white">Track Sun:</span> Camera follows the Sun. Turn off to keep the camera fixed and show motion of Sun (and Moon) against the sky.
                          </li>
                          <li class="ml-5">
                            <span class="user-guide-emphasis-white">Horizon / Sky:</span> Display a virtual "ground" that delineates where the Sun rises and sets. Show a blue sky when the Sun is above the horizon.
                          </li>
                          <li class="ml-5">
                            <span class="user-guide-emphasis-white">Sky Grid:</span> Display altitude/azimuth grid with cardinal directions.
                          </li>
                          <li class="ml-5">
                            <span class="user-guide-emphasis-white">Visible Moon:</span> Solar Eclipses occur during a New Moon, when the Moon is not normally visible in the sky. This option makes it easier to see the Moon against the sky.
                          </li>
                        </ul>
                      </li>
                      <li>
                        {{ touchscreen ? "Tap" : "Click" }}
                        <font-awesome-icon
                          class="bullet-icon"
                          icon="circle-info"
                          size="lg"
                        ></font-awesome-icon> to open this guide.
                      </li>
                      <li>
                        {{ touchscreen ? "Tap" : "Click" }} <font-awesome-icon
                              class="bullet-icon"
                              icon="share-nodes"
                              size="lg"
                            ></font-awesome-icon> to copy <strong>share-url</strong> for a specific location.
                      </li>
                    </ul>

                  </div>
                          
                  <v-divider thickness="2px" class="solid-divider"></v-divider>
                  
                </v-col>
              </v-row>
              <div id="text-credits">
                <h3>Credits:</h3>
                <p>Atmospheric Physicist <a href="https://www.cfa.harvard.edu/people/caroline-nowlan" target="_blank" rel="noopener noreferrer">Caroline Nowlan</a> provided valuable guidance on interpreting the <a href="https://neo.gsfc.nasa.gov/view.php?datasetId=MYDAL2_E_CLD_FR&date=2023-04-07"  target="_blank" rel="noopener noreferrer">MODIS Cloud Cover</a> data.</p>

                <p>The path of totality data are from <a href="https://svs.gsfc.nasa.gov/5123" target="_blank" rel="noopener noreferrer">NASA's Scientific Visualization Studio</a>.</p>

                <p>Eclipse Timing Predictions are by <a href="https://eclipse.gsfc.nasa.gov/JSEX/JSEX-NA.html" target="_blank" rel="noopener noreferrer">Fred Espenak and Chris O'Byrne</a> (NASA's GSFC). <em>Adapted for TypeScript by CosmicDS Team</em></p>

                <p>Image of Sun is courtesy of NASA/SDO and the AIA, EVE, and HMI science teams.</p>

                <p>This Cosmic Data Story is powered by WorldWide Telescope (WWT).</p>

                <h4><a href="https://www.cosmicds.cfa.harvard.edu/" target="_blank" rel="noopener noreferrer">CosmicDS</a> Team:</h4> 
                
                John Lewis<br>
                Jon Carifio<br>
                Pat Udomprasert<br>
                Alyssa Goodman<br>
                Harry Houghton<br>
                Evaluator: Sue Sunbury<br>
                
                <h4><a href="https://www.worldwidetelescope.org/" target="_blank" rel="noopener noreferrer">WorldWide Telescope</a> Team:</h4>
                Peter Williams<br>
                A. David Weigel<br>
                Jon Carifio<br>
              </div>
              
              <funding-acknowledgment/>

            </v-container>
          </v-card-text>
        </v-card>
          </v-window-item>
        </v-window>
      </v-card>
    </v-dialog>

  
  <div
    id="main-content"
  >
    <!-- <debug-eclipse-timer
      
      :prediction="eclipsePrediction"
      :timezone="selectedTimezone"
      :lat-deg="locationDeg.latitudeDeg"
      :lon-deg="locationDeg.longitudeDeg"
    /> -->
    <div id="center-page-banner" v-if="(sunPosition.altRad < -.25 * Math.PI/180)">
      <p>
        The Sun has {{ sunPosition.azRad < Math.PI ? 'not risen yet' : 'set' }}
      </p>
    </div>
    <WorldWideTelescope
      :wwt-namespace="wwtNamespace"
    ></WorldWideTelescope>
    <div
      id="eclipse-percent-indicator"
      v-if="currentFractionEclipsed > 0"
      :style="{ top: eclipsedIndicatorTop + 'px', left: eclipsedIndicatorLeft + 'px' }"
    >
      {{ percentEclipsedText }}
    </div>
    <div>
      <div id="left-buttons-wrapper" :class="[!showGuidedContent ?'budge' : '']">
        <div id="location-date-display">
          <div
            id="location-status-box"
            :class="{ 'non-interactive': !narrow }"
            @click="() => {
              if (!narrow) {
                return;
              }
              showGuidedContent = true;
              onResize();
              }"
          >
            <div class="location-status-name"><strong>{{ selectedLocationText }}</strong></div>
            <div>{{ selectedLocalDateString }}</div>
            <div v-if="eclipsePredictionText" class="eclipse-status-line">{{ eclipsePredictionText }}</div>
          </div>

          <div id="location-secondary-row">
            <!-- Mobile-only replacement for the old text "Path & Weather"
                 button -- desktop keeps that button as its own separate
                 standalone control (#closed-top-container). -->
            <icon-button
              v-if="narrow"
              v-model="showGuidedContent"
              id="show-guided-content-mobile"
              md-icon="map-search"
              md-size="20"
              :color="accentColor"
              :focus-color="accentColor"
              tooltip-text="Map and Weather"
              :tooltip-location="'bottom'"
              :show-tooltip="!mobile"
              :box-shadow="false"
              @activate="onResize"
            ></icon-button>

            <icon-button
              id="eclipse-details-button"
              md-icon="sun-clock"
              :md-size="showNewMobileUI ? '20' : '24'"
              :color="accentColor"
              :focus-color="accentColor"
              tooltip-text="View eclipse timing details"
              tooltip-location="start"
              @activate="() => { showEclipsePredictionSheet = true; }"
              >
            </icon-button>
          </div>
        </div>

        <div id="location-progress" :class="[!showGuidedContent ?'budge' : '']">
          <geolocation-button
            :color="accentColor"
            :show-text-progress = "true"
            hide-button
            show-progress-circle
            ref="geolocation"
            @geolocation="(loc: GeolocationCoordinates) => {
              myLocation = {
                latitudeDeg: loc.latitude,
                longitudeDeg: loc.longitude
              };
              showMyLocationDialog = false;

              if (myLocation.latitudeDeg !== locationDeg.latitudeDeg || myLocation.longitudeDeg !== locationDeg.longitudeDeg) {
                locationDeg = myLocation;
                $nextTick(() => {
                  updateSelectedLocationText();
                });
              }
            }"
            @error="(error: GeolocationPositionError) => {
              $notify({
                group: 'geolocation-error',
                title: 'Error',
                text: error.message,
                type: 'error',
              });
              if (error.code === 1) {
                geolocationPermission = 'denied';
              }
              console.log(error);
            }"
            @permission="(p: PermissionState) => {
              geolocationPermission = p;
              // we're always gonna show the button,
              // just leaving this if we wanna change
              if (p == 'granted') {
                getMyLocation = true;
              } else if (p == 'prompt') {
                getMyLocation = true;
              } else {
                getMyLocation = true;
              }
            }"
          ></geolocation-button>
        </div>
      </div>
    </div>


    
    <v-overlay
      :model-value="showSplashScreen"
      absolute
      opacity="0.6"
      :style="cssVars"
      id="splash-overlay"
      :class="[showNewMobileUI ? 'new-mobile-ui' : '']"
    >
      <div
        id="splash-screen"
        v-click-outside="closeSplashScreen"
        :style="cssVars"
      >
        <div
            id="first-splash-row"
        >
          <div
            id="close-splash-button"
            tabindex="0"
            @click="closeSplashScreen"
            @keyup.enter="closeSplashScreen"
            >&times;</div>
          <div id="splash-screen-text">
            <p>See how the </p>
            <p class="highlight">August 12, 2026</p> 
            <p class="highlight">TOTAL Solar Eclipse</p>
            <p>will look from any 
            <span class="highlight">location</span>
            </p>
          </div>
        </div>

        <div>
          <v-btn
            class="splash-get-started"
            @click="closeSplashScreen"
            :color="accentColor"
            :density="xSmallSize ? 'compact' : 'default'"
            size="x-large"
            variant="elevated"
            rounded="lg"
          >
            Get Started
          </v-btn>
        </div>

        <div v-if="!narrow">
          <p v-if="onDayOfEclipse" class="splash-small-text">
            <v-icon icon="mdi-creation" size="small" class="bullet-icon"></v-icon> New! NOW button, active starting at 6:40am EDT
          </p>
        </div>

        <div id="splash-screen-acknowledgements">
          <div>
            <img
              src="./assets/eclipseds.png"
              alt="Cosmic Data Stories Eclipse logo"
              class="eclipse-ds-logo" 
              />
          </div>
          Brought to you by <a href="https://www.cosmicds.cfa.harvard.edu/" target="_blank" rel="noopener noreferrer">Cosmic Data Stories</a> and <a href="https://www.worldwidetelescope.org/home/" target="_blank" rel="noopener noreferrer">WorldWide Telescope</a>.
        </div>
      </div>
    </v-overlay>

    <transition name="fade">
      <div
        class="modal"
        id="modal-loading"
        v-show="isLoading"
      >
        <div class="container">
          <div class="spinner"></div>
          <p>Loading …</p>
        </div>
      </div>
    </transition>

  <!-- Opening Dialog Sequence -->
    <v-overlay
      v-if="showNewMobileUI && introSlide === 2"
      v-model="inIntro"
      id="intro-overlay-mobile"
      opacity="1"
      :scrim="false"
      :style="cssVars"
      >
      <div class="instruction-overlay instruction-overlay-mobile elevation-10">
        <div class="inst-quad top-left">
          <div class="inst-arrow"><v-icon  class="the-arrow" :color="accentColor" :size="Math.min($vuetify.display.width*0.16,$vuetify.display.height*0.16,70)">mdi-arrow-up-bold</v-icon></div>
          <div class="inst-text">
            Location,<br> Path, + <br> Timing
          </div>
        </div>
        <div class="inst-quad top-right">
          <div class="inst-arrow"><v-icon  class="the-arrow" :color="accentColor" :size="Math.min($vuetify.display.width*0.16,$vuetify.display.height*0.16,70)">mdi-arrow-up-bold</v-icon></div>
          <div class="inst-text">
            Settings, <br> Info + <br> Sharing
          </div>
        </div>
        <div class="inst-quad bottom-left">
          <div class="inst-arrow"><v-icon  class="the-arrow" :color="accentColor" :size="Math.min($vuetify.display.width*0.16,$vuetify.display.height*0.16,70)">mdi-arrow-up-bold</v-icon></div>
          <div class="inst-text">
            <template v-if="onDayOfEclipse">New! Set time to "Now," or control time yourself!</template>
            <template v-else>Control time yourself!</template>
          </div>
        </div>

        <div class="intro-bottom-controls">
          <v-btn
            class="intro-back-button"
            :color="accentColor"
            @click="introSlide--"
            elevation="0"
            >
            Back
          </v-btn>

          <v-btn
            class="intro-next-button"
            :color="accentColor"
            @click="introSlide++"
            elevation="0"
            >
            Let's go!
          </v-btn>
        </div>
      </div>
    </v-overlay>

    <v-overlay
      v-if="!showNewMobileUI && introSlide === 2"
      v-model="inIntro"
      id="intro-overlay-desktop"
      opacity="1"
      :scrim="false"
      :style="cssVars"
      >
      <div class="instruction-overlay instruction-overlay-desktop elevation-10">
        <div class="inst-quad top-left">
          <div class="inst-arrow"><v-icon class="the-arrow" :color="accentColor" :size="Math.min($vuetify.display.width*0.07,$vuetify.display.height*0.07,48)">mdi-arrow-up-bold</v-icon></div>
          <div class="inst-text">
            Location<br>+ Timing
          </div>
        </div>
        <div class="inst-quad top-center">
          <div class="inst-arrow"><v-icon class="the-arrow" :color="accentColor" :size="Math.min($vuetify.display.width*0.07,$vuetify.display.height*0.07,48)">mdi-arrow-up-bold</v-icon></div>
          <div class="inst-text">
            Eclipse path <br>+ weather
          </div>
        </div>
        <div class="inst-quad top-right">
          <div class="inst-arrow"><v-icon class="the-arrow" :color="accentColor" :size="Math.min($vuetify.display.width*0.07,$vuetify.display.height*0.07,48)">mdi-arrow-up-bold</v-icon></div>
          <div class="inst-text">
            Settings, <br> Info +<br> Sharing
          </div>
        </div>
        <div class="intro-bottom-controls">
          <v-btn
            class="intro-back-button"
            :color="accentColor"
            @click="introSlide--"
            elevation="0"
            >
            Back
          </v-btn>

          <div class="inst-quad bottom-left">
            <div class="inst-arrow"><v-icon class="the-arrow" :color="accentColor" :size="Math.min($vuetify.display.width*0.07,$vuetify.display.height*0.07,48)">mdi-arrow-up-bold</v-icon></div>
            <div class="inst-text">
              <template v-if="onDayOfEclipse">New! Set time to "Now," or control time yourself!</template>
              <template v-else>Control time yourself!</template>
            </div>
          </div>

          <v-btn
            class="intro-next-button"
            :color="accentColor"
            @click="introSlide++"
            elevation="0"
            >
            Let's go!
          </v-btn>
        </div>
      </div>
    </v-overlay>

    <v-dialog
      v-if="introSlide === 1"
      v-model="inIntro"
      id="intro-dialog"
      :style="cssVars"
      :scrim="false"
      :persistent="false"
      >
      <div v-if="inIntro" id="introduction-overlay" class="elevation-10">
        <v-window v-model="introSlide">
          <template v-slot:additional>
            <div
              class="dialog-close-button"
              @click="inIntro = !inIntro"
              @keyup.enter="inIntro = !inIntro"
              tabindex="0"
            >
              <font-awesome-icon
                size="xl"
                :color="accentColor2"
                icon='xmark'
              />
            </div>
          </template>
          <v-window-item :value="1">
            <div class="intro-text">
              <p>
              On August 12, 2026, a lucky stretch of Spain, Iceland, and Greenland will witness an awe-inspiring <b>total eclipse</b>.
              </p>
              <p>
               Other parts of Europe will see a <em>partial</em> eclipse, where the Moon blocks out some, but not all of the Sun's light.
              </p>
              <p>
              Choose your location on the map to see what the eclipse will look like where you are, and what the average cloud coverage has been during the week of August 12 from 2003&#8211;2023.
              </p>
            </div>
          </v-window-item>
        </v-window>

        <div class="intro-bottom-controls">
          <div>
            <v-checkbox
              v-model="dontShowIntro"
              @keyup.enter="dontShowIntro = !dontShowIntro"
              label="Don't show this introduction at launch"
              :color="accentColor"
              hide-details
            />
          </div>


          <v-btn
            class="intro-next-button"
            :color="accentColor"
            @click="introSlide++"
            elevation="0"
            >
            Next
          </v-btn>
        </div>
      </div>
    </v-dialog>
    
  
  <div id="top-wwt-content" :class="[!showGuidedContent ? 'budge' : '']">
    <!-- Right-to-left: controls, info, share -->
    <div id="top-right-buttons">
      <icon-button
        id="share"
        fa-icon="share-nodes"
        :color="accentColor"
        :focus-color="accentColor"
        :box-shadow="false"
        tooltip-text="Share view of this location"
        :show-tooltip="!mobile"
        @activate="copyShareURL"
        faSize="lg"
      ></icon-button>

      <icon-button
        v-model="showInfoSheet"
        id="info-button"
        fa-icon="circle-info"
        fa-size="lg"
        :color="accentColor"
        :focus-color="accentColor"
        :tooltip-text="showInfoSheet ? null : 'Information & User Guide'"
        :tooltip-location="'bottom'"
        :show-tooltip="!mobile"
        :box-shadow="false"
      ></icon-button>

      <div
        id="controls"
        class="control-icon-wrapper"
      >
        <!-- Mirrors the speed-control icon's open/close toggle pattern --
             the activator itself becomes an X when the panel is open,
             rather than a separate close chevron inside the panel. -->
        <icon-button
          v-model="showControls"
          id="controls-toggle"
          :fa-icon="showControls ? 'xmark' : 'sliders'"
          fa-size="lg"
          :color="accentColor"
          :focus-color="accentColor"
          :box-shadow="false"
        ></icon-button>
      </div>
    </div>

    <div v-if="showControls" id="control-checkboxes">
      <v-checkbox
        :color="accentColor"
        v-model="toggleTrackSun"
        @keyup.enter="toggleTrackSun = !toggleTrackSun"
        label="Track Sun"
        hide-details
      />
      <v-checkbox
        :color="accentColor"
        v-model="showHorizon"
        @keyup.enter="showHorizon = !showHorizon"
        label="Horizon / Sky"
        hide-details
      />
      <v-checkbox
        :color="accentColor"
        v-model="showAltAzGrid"
        @keyup.enter="showAltAzGrid = !showAltAzGrid"
        label="Sky Grid"
        hide-details
      />
      <v-checkbox
        :color="accentColor"
        v-model="useRegularMoon"
        @keyup.enter="useRegularMoon = !useRegularMoon"
        label="Visible Moon"
        hide-details
      />
    </div>
  </div>
    
    <div class="bottom-content">
      
      <v-dialog
        v-model="showForecastSheet"
        :max-width="xSmallSize ? '85%' : '45%'"
        transition="slide-y-transition"
        id="weather-forecast-sheet"
        :style="cssVars"
        >
      <v-card>
          <v-card-text class="pb-8">
            <div
              class="dialog-close-button"
              @click="showForecastSheet = false"
              @keyup.enter="showForecastSheet = false"
              tabindex="0"
            >
              <font-awesome-icon icon="xmark" size="xl" :color="accentColor2"></font-awesome-icon>
            </div>
            <open-meteo-forecast
              :location="locationDeg"
              :location-str="selectedLocationText"
              :time="(eclipsePrediction !== null && eclipseType != 'None') ? eclipsePrediction.maxTime[0] : null"
            />
          </v-card-text>
        </v-card>
      </v-dialog>
     
      <v-dialog
        v-model="showEclipsePredictionSheet"
        :max-width="xSmallSize ? '95%' : 'fit-content'"
        transition="slide-y-transition"
        id="eclipse-prediction-sheet"
        :style="cssVars"
        >
        <v-card>
          <v-card-text>
            <div
              class="dialog-close-button"
              @click="showEclipsePredictionSheet = false"
              @keyup.enter="showEclipsePredictionSheet = false"
              tabindex="0"
            >
              <font-awesome-icon icon="xmark" size="xl" :color="accentColor2"></font-awesome-icon>
            </div>
            <eclipse-timer show-timer :prediction="eclipsePrediction" :timezone="selectedTimezone" :color="accentColor" :location="selectedLocationText"/>
          </v-card-text>
        </v-card>
      </v-dialog>

      <icon-button
        v-if="withinForecastRange"
        v-model="showForecastSheet"
        md-icon="mdi-cloud-clock"
        :md-size="showNewMobileUI ? '20' : '24'"
        :color="accentColor"
        :focus-color="accentColor"
        :tooltip-text="showForecastSheet ? null : 'August 12 Weather Forecast'"
        :tooltip-location="'left'"
        :show-tooltip="!mobile"
        :box-shadow="false"
      ></icon-button>

      <div id="eclipse-percent-chip">
        <v-btn
          v-if="onDayOfEclipse"
          id="set-time-now-button"
          variant="outlined"
          rounded="xl"
          :disabled="nowOutsideTimeRange"
          :color="nowOutsideTimeRange ? 'gray' : '#eac402'"
          @click="() => {
            selectedTime = Math.max(minTime, Math.min(maxTime, Date.now()));
            playbackRate=1;
            playing=true;
            }"
        >
          Now
        </v-btn>
      </div>
      
      <div id="tools">
        <span class="tool-container">
          <div style="position: relative">
            <div id="speed-control">
              <icon-button
                id="play-pause-icon"
                :fa-icon="!(playing) ? 'play' : 'pause'"
                @activate="() => {
                  playing = !(playing);
                }"
                :color="accentColor"
                :focus-color="accentColor"
                tooltip-text="Play/Pause"
                tooltip-location="top"
                tooltip-offset="5px"
                faSize="lg"
                :show-tooltip="!mobile"
              ></icon-button>
              <icon-button
                id="backward-speed"
                :fa-icon="'angles-down'"
                @activate="() => {
                      decreasePlaybackRate();
                      // playing = true;
                    }"
                :color="accentColor"
                :focus-color="accentColor"
                :tooltip-text="'Slower'"
                tooltip-location="top"
                tooltip-offset="5px"
                faSize="lg"
                :show-tooltip="!mobile"
              ></icon-button>
              <icon-button
                id="forward-speed"
                :fa-icon="'angles-up'"
                @activate="() => {
                      increasePlaybackRate();
                      // playing = true;
                    }"
                :color="accentColor"
                :focus-color="accentColor"
                :tooltip-text="'Faster'"
                tooltip-location="top"
                tooltip-offset="5px"
                faSize="lg"
                :show-tooltip="!mobile"
              ></icon-button>
              <icon-button
                v-if="!xSmallSize"
                id="reverse-speed"
                :md-icon="playbackRate < 0 ? 'mdi-step-forward-2' : 'mdi-step-backward-2'"
                @activate="() => {
                      reversePlaybackRate();
                      // playing = true;
                    }"
                :color="accentColor"
                :focus-color="accentColor"
                :tooltip-text="playbackRate < 0 ? 'Play time forwards' : 'Play time backwards'"
                tooltip-location="top"
                tooltip-offset="5px"
                mdSize="22"
                :show-tooltip="!mobile"
              ></icon-button>
              <icon-button
                id="reset"
                :fa-icon="'house'"
                @activate="() => {

                  selectedTime = initialSelectedTime;
                  playbackRate = 500;
                  playing = false;
                  forceRate = false;
                  location = defaultLocation;
                  selectedLocationText = defaultLocationText;
                  toggleTrackSun = true;
                  sunPlace.set_zoomLevel(20);
                  gotoTarget({
                    place: sunPlace,
                    instant: true,
                    noZoom: false,
                    trackObject: true
                  });
                }"
                :color="accentColor"
                :focus-color="accentColor"
                tooltip-text="Reset"
                tooltip-location="top"
                tooltip-offset="5px"
                faSize="lg"
                :show-tooltip="!mobile"
              ></icon-button>

              <v-dialog
                v-if="!xSmallSize"
                v-model="playbackVisible"
                :scrim="false"
                location="top end"
                offset="40"
                location-strategy="connected"
                persistent
                no-click-animation
                :retain-focus="false"
                >
                <template v-slot:activator="{ props }">
                  <icon-button
                    id="speed-control-icon"
                    @activate="() => {
                      playbackVisible = !playbackVisible;
                    }"
                    :fa-icon="playbackVisible ? 'times' : 'gauge-high'"
                    :color="accentColor"
                    :focus-color="accentColor"
                    tooltip-text="Speed Controls"
                    tooltip-location="top"
                    tooltip-offset="5px"
                    faSize="lg"
                    :show-tooltip="!mobile"
                    v-bind="props"
                  ></icon-button>
                </template>
                    <playback-control
                    class="desktop-playback-control"
                      v-if="playbackVisible"
                      :model-value="playbackRate"
                      @update:modelValue="(value: number) => {
                        forceRate = false;
                        playbackRate = value;
                      }"
                      :max-power="3"
                      :max="Math.log10(1000) + 1"
                      :color="accentColor"
                      :inline="false"
                    />
              </v-dialog>
      

                <div v-if="xSmallSize" id="inline-speed-control">
                  <icon-button
                    id="speed-control-icon"
                    @activate="() => {
                      playbackVisible = !playbackVisible;
                    }"
                    :fa-icon="playbackVisible ? 'times' : 'gauge-high'"
                    :color="accentColor"
                    :focus-color="accentColor"
                    tooltip-text="Time Controls"
                    tooltip-location="top"
                    tooltip-offset="5px"
                    faSize="lg"
                    :show-tooltip="!mobile"
                  ></icon-button>

                    <playback-control
                      class="mobile-playback-control"
                      v-show="playbackVisible"
                      :model-value="playbackRate"
                      @update:modelValue="(value: number) => {
                        forceRate = false;
                        playbackRate = value;
                      }"
                      :max-power="3"
                      :max="Math.log10(1000) + 1"
                      :color="accentColor"
                      :inline="true"
                    />

                </div>
            </div>
            <div id="speed-text">
              {{ niceRound(playbackRate) }}x Real Time<span v-if="!playing"> (paused)</span><span v-else-if="forceRate"> (slowed for totality)</span>
            </div>
          </div>
          <div id="slider">
            <v-slider
              v-model='selectedTime'
              :max="maxTime"
              :min="minTime"
              :color="accentColor"
              :ripple="false"
              hide-details
              track-size="8px"
              thumb-size="20px"
              thumb-label="always"
              :step="millisecondsPerInterval"
              @mousedown="() => {playing = false;}"
              >
              <template v-slot:thumb-label="item">
                {{ toTimeString(new Date(item.modelValue))  }}
              </template>
            </v-slider>
          </div>
          <div id="change-optout">
            <icon-button
              md-icon="mdi-lock"
              @activate="() => showPrivacyDialog = true"
              :color="accentColor"
              :focus-color="accentColor"
              tooltip-text="Change privacy settings"
              tooltip-location="bottom"
              tooltip-offset="5px"
              :show-tooltip="!mobile"
              mdSize="1em"
            >
            </icon-button>
          </div>
        </span>      
      </div>
      <div id="body-logos" v-if= "!smallSize">
        <credit-logos
          :default-logos="['cosmicds', 'wwt', 'sciact', 'nasa-grantee']"
        />
      </div>
    </div>

<!--  -->
    <!-- Data collection opt-out dialog -->
    <v-dialog
      scrim="false"
      v-model="showPrivacyDialog"
      max-width="400px"
      id="privacy-popup-dialog"
    >
      <v-card>
        <v-card-text>
          To evaluate usage of this app, <strong>anonymized</strong> data may be collected, including locations viewed and map quiz responses. "My Location" data is NEVER collected.
        </v-card-text>
        <v-card-actions class="pt-3">
          <v-spacer></v-spacer>
          <v-btn
            color="#BDBDBD"
            href="https://www.cfa.harvard.edu/privacy-statement"
            target="_blank"
            rel="noopener noreferrer"
          >
          Privacy Policy
          </v-btn>
          <v-btn
            color="#ff6666"
            @click="() => {
              responseOptOut = true;
              showPrivacyDialog = false;
            }"
          >
          Opt out
          </v-btn>
          <v-btn 
            color="green"
            @click="() => {
              responseOptOut = false;
              showPrivacyDialog = false;
            }"
          >
            Allow
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  <notifications group="copy-url" position="center top" classes="url-notification"/>
  <notifications dangerouslySetInnerHtml group="geolocation-error" position="center top" />
  </div>
  <v-expand-transition>
    <user-experience
      v-if="showRating"
      :question="question"
      icon-size="3x"
      @dismiss="(_rating: UserExperienceRating | null, _comments: string | null) => {
        showRating = false;
      }"
      @rating="(rating: UserExperienceRating | null) => {
        currentRating = rating;
        updateUserExperienceInfo(currentRating, currentComments);
      }"
      @finish="(rating: UserExperienceRating | null, comments: string | null) => {
        currentRating = rating;
        currentComments = comments;
        updateUserExperienceInfo(currentRating, currentComments);
        showRating = false;
      }"
    >
      <template #footer>
        <div id="user-experience-footer">
          <v-btn
            class="rating-opt-put"
            color="#BDBDBD"
            size="small"
            variant="text"
            @click="() => {
              showRating = false;
              ratingOptOut = true;
            }"
          >
          Don't show again
          </v-btn>
          <v-btn
            class="privacy-button"
            color="#BDBDBD"
            @click="showRatingPrivacyPolicy = true"
            size="small"
            target="_blank"
            rel="noopener noreferrer"
          >
          What is this?
          </v-btn>
        </div>
      </template>
    </user-experience>
  </v-expand-transition>
  <cds-privacy-policy v-model="showRatingPrivacyPolicy" />
</v-app>
</template>

<script lang="ts">
import { defineComponent, toRaw, PropType } from "vue";
import { MiniDSBase, BackgroundImageset, skyBackgroundImagesets, API_BASE_URL, UserExperienceRating } from "@cosmicds/vue-toolkit";
import { GotoRADecZoomParams } from "@wwtelescope/engine-pinia";
import { Classification, SolarSystemObjects } from "@wwtelescope/engine-types";
import { Grids, LayerManager, Planets, Settings, WWTControl, Place, Texture, CAAMoon } from "@wwtelescope/engine";
import { Annotation2, Poly2 } from "./Annotation2";

import { getTimezoneOffset, formatInTimeZone } from "date-fns-tz";
import tzlookup from "tz-lookup";
import { v4 } from "uuid";

import { drawPlanets, drawSkyOverlays, getScreenPosForCoordinates, makeAltAzGridText, layerManagerDraw, updateViewParameters, renderOneFrame } from "./wwt-hacks";
import pointInPolygon from 'point-in-polygon';

import { recalculateForObserverUTC } from "./eclipse_predict";
import { EclipseData } from "./eclipse_types";
import { sunPlace } from "./horizon_sky";
import { spaceHMS } from './utils';
import nso from './nso_coordinates';

interface CloudData {
  lat: number;
  lon: number;
  cloudCover: number;
}

type SheetType = "text" | null;
type LearnerPath = "Location" | "Clouds" | 'CloudDetail' | "Learn";
type ViewerMode = "Horizon";
type MoonImageFile = "moon.png" | "moon-dark-gray-overlay.png" | `moon-sky-blue-overlay-${number}.png` | "empty.png";

const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;

// The field names here come from MapBox
export interface MapBoxFeature {
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

export interface MapBoxFeatureCollection {
  type: "FeatureCollection";
  features: MapBoxFeature[];
}

export interface MapBoxContextItem {
  id: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  mapbox_id: string;
  text: string;
  wikidata: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  short_code?: string;
}


// number of milliseconds since January 1, 1970, 00:00:00 UTC
// month is indexed from 0..?!
// instead of eclipse start/end times this shouldj ust be 24 hours
const eclipseStartTime = Date.UTC(2026, 7, 12, 4, 1); // partial eclipse starts at 15:40 UTC
const eclipseFinishTime = Date.UTC(2026, 7, 13, 3, 59); // partial eclipse ends at  20:55 UTC
const extraTime = 1000 * 60 * 60 * 0; // add 2 hours to the end time to make sure we get the full eclipse
const minTime = eclipseStartTime - extraTime;
const maxTime = eclipseFinishTime + extraTime;
const onDayOfEclipse = (Date.now() >= minTime) && (Date.now() <= maxTime);
const withinForecastRange = (Date.now() >= (eclipseStartTime - 1000 * 60 * 60 * 24 * 15)) && (Date.now() <= (eclipseStartTime + 1000 * 60 * 60 * 24 * 2));
const SECONDS_PER_DAY = 60 * 60 * 24;
const MILLISECONDS_PER_DAY = 1000 * SECONDS_PER_DAY;

const secondsInterval = 40;
const MILLISECONDS_PER_INTERVAL = 1000 * secondsInterval;

const times: number[] = [];

let t = minTime;
while (t <= maxTime) {
  times.push(t);
  times.push(t + MILLISECONDS_PER_INTERVAL);
  t += MILLISECONDS_PER_INTERVAL;
}

type LocationRad = {
  longitudeRad: number;
  latitudeRad: number;
};

type LocationDeg = {
  longitudeDeg: number;
  latitudeDeg: number;
};


type EquatorialRad = {
  raRad: number;
  decRad: number;
};

type HorizontalRad = {
  altRad: number;
  azRad: number;
};

type OptionalFieldsShallow<T> = {
  [P in keyof T]?: T[P]
};

type QueryData = OptionalFieldsShallow<LocationDeg & { splash: boolean } & {awv: boolean}>;

let queryData: QueryData = {};
const UUID_KEY = "eclipse-2026-mini-uuid" as const;
const OPT_OUT_KEY = "eclipse-2026-mini-optout" as const;
const RATING_OPT_OUT_KEY = "eclipse-2026-mini-rating-optout" as const;
const DONT_SHOW_INTRO_KEY = "eclipse-2026-mini-dontshowintro" as const;


const RELEVANT_FEATURE_TYPES = ["postcode", "place", "region", "country"];
const NA_COUNTRIES = ["United States", "Canada", "Mexico"];
const NA_ABBREVIATIONS = ["US-", "CA-", "MX-"];


/** PARSE CLOUD COVERAGE DATA **/
import cloudCover from "./assets/cloud_cover.csv";
import { csvParseRows } from "d3-dsv";

// the first row is the longitude values
// the first column is the latitude values
// the data lies in the interior of the matrix
let cloudData: number[][] = csvParseRows(cloudCover, (d, _i) => {
  // loop over the row and convert each value to a number ("+v")
  return d.map((v) => +v);
});

// lon and lat are first col and row (dropping the first value)
const minLat = Math.min(...cloudData.map(d => d[0]).slice(1));
const maxLat = Math.max(...cloudData.map(d => d[0]).slice(1));
const minLon = Math.min(...cloudData[0].slice(1));
const dLon = cloudData[0][2] - cloudData[0][1];
const dLat = cloudData[2][0] - cloudData[1][0];
console.log("minLat, minLon, dLat, dLon", minLat, minLon, dLat, dLon);
// get just the inner data grid
cloudData = cloudData.slice(1).map(row => row.slice(1));

// conver cloudData from array to CloudData[] for locationselector
const cloudDataArray: CloudData[] = [];
cloudData.forEach((row, i) => {
  row.forEach((cc, j) => {
    cloudDataArray.push({
      lat: maxLat + dLat * i,
      lon: minLon + dLon * j,
      cloudCover: cc
    });
  });
});

console.log("cloud cover data loaded");

const MAX_PLAYBACK_RATE = 5**6;

const wwtMove = WWTControl.singleton.move;

/* READ IN Eclipse Umbra */
// import eclipseUmbra from "./assets/upath_lo.json";

export default defineComponent({
  extends: MiniDSBase,
  
  props: {
    wwtNamespace: {
      type: String,
      required: true
    },
    initialCameraParams: {
      type: Object as PropType<Omit<GotoRADecZoomParams, 'instant'>>,
      default() {
        return {
          // RA/Dec of Sun in Nazas, Mexico close to max totality
          raRad: 3.481,
          decRad: -0.145,
          zoomDeg: 20,
        };
      },
    },
  },
  data() {
    const totalEclipseTimeUTC = new Date("2026-08-12T18:30:59Z");

    const moonPlace = new Place();
    moonPlace.set_names(["Moon"]);
    moonPlace.set_classification(Classification.solarSystem);
    moonPlace.set_target(SolarSystemObjects.moon);
    const initialView = {
      initialLocation: {
        // Map center for the default view — deliberately not the same as
        // the default selected location (Antiguita, Spain, below), so the
        // eclipse path is visible instead of being centered on the pin.
        latitudeDeg: 54.2,
        longitudeDeg: -14.7
      },
      initialZoom: 3
    };

    const userSelectedLocations: [number, number][] = [];
    const [latitudeDeg, longitudeDeg] = [queryData.latitudeDeg, queryData.longitudeDeg];
    
    let initialMapOptions = initialView;
    if (latitudeDeg !== undefined && longitudeDeg !== undefined) {
      userSelectedLocations.push([longitudeDeg, latitudeDeg]);
      initialMapOptions = {
        initialLocation: { latitudeDeg, longitudeDeg },
        initialZoom: 5
      };
    }

    const maybeUUID = window.localStorage.getItem(UUID_KEY);
    const existingUser = maybeUUID !== null;
    const uuid = maybeUUID ?? v4();
    if (!existingUser) {
      window.localStorage.setItem(UUID_KEY, uuid);
    }
    
    const storedOptOut = window.localStorage.getItem(OPT_OUT_KEY);
    const responseOptOut = typeof storedOptOut === "string" ? storedOptOut === "true" : null;
    
    const storedRatingOptOut = window.localStorage.getItem(RATING_OPT_OUT_KEY);
    const ratingOptOut = typeof storedRatingOptOut === "string" ? storedRatingOptOut === "true" : null;

    const dontShowIntro = window.localStorage.getItem(DONT_SHOW_INTRO_KEY) === "true";

    // Captured once here so the reset button can return to this exact
    // location later, rather than independently recomputing the same
    // literal (and risking the two silently drifting apart).
    const defaultLocation: LocationRad = { latitudeRad: D2R * 41.05651083190793, longitudeRad: D2R * -2.3823344069458017 };
    const defaultLocationText = "Antiguita, Spain";

    const location: LocationRad = (latitudeDeg !== undefined && longitudeDeg !== undefined) ?
      { latitudeRad: D2R * latitudeDeg, longitudeRad: D2R * longitudeDeg } :
      defaultLocation;
    return {

      showForecastSheet: false,

      cloudCoverData: cloudDataArray as CloudData[],
      rectangleDegrees: Math.abs(dLat),
      
      uuid,
      showRating: false,
      storyRatingUrl: `${API_BASE_URL}/solar-eclipse-2026/user-experience`,
      ratingOptOut: responseOptOut || ratingOptOut,
      currentRating: null as UserExperienceRating | null,
      currentComments: null as string | null,
      question: Math.random() > 0.5 ? 
        "Does this spark your curiosity?" :
        "Are you learning something new?",
      questionTimeout: null as ReturnType<typeof setTimeout> | null,
      canTrackStory: false,
      infoTimeMs: 0,
      userGuideTimeMs: 0,
      weatherTimeMs: 0,
      weatherInfoTimeMs: 0,
      eclipseTimerTimeMs: 0,
      forecastInfoTimeMs: 0,
      appStartTimestamp: Date.now(),
      infoStartTimestamp: null as number | null,
      userGuideStartTimestamp: null as number | null,
      weatherStartTimestamp: null as number | null,
      weatherInfoStartTimestamp: null as number | null,
      eclipseTimerStartTimestamp: null as number | null,
      forecastInfoStartTimestamp: null as number | null,
      weatherInfoOpen: false,
      responseOptOut: responseOptOut as boolean | null,
      onDayOfEclipse,
      withinForecastRange,

      showSplashScreen: queryData.splash ?? true, 
      backgroundImagesets: [] as BackgroundImageset[],
      sheet: null as SheetType,
      layersLoaded: false,
      positionSet: false,

      wwtMove: null as ((x: number, y: number) => void) | null,

      searchOpen: true,
      searchText: null as string | null,
      searchErrorMessage: null as string | null,

      getMyLocation: true,
      myLocation: null as LocationDeg | null,
      geolocationPermission: '' as 'granted' | 'denied' | 'prompt',
      
      // Information and User Guide are now tabs (0/1) within one dialog
      // (showInfoSheet), rather than two separately-toggled sheets.
      infoTab: 0,
      showAdvancedWeather: queryData.awv ?? false,

      showEclipsePredictionSheet: false,

      totalEclipseTimeUTC,
      // Captured once here so the reset button can return to this exact
      // value later, rather than independently recomputing the same
      // formula (and risking the two silently drifting apart).
      initialSelectedTime: totalEclipseTimeUTC.getTime() - 60*60*1000*1.5,
      selectedTime:  totalEclipseTimeUTC.getTime() - 60*60*1000*1.5,
      selectedTimezone: "Europe/Madrid",
      location,
      defaultLocation,
      selectedLocationText: defaultLocationText,
      defaultLocationText,

      syncDateTimeWithWWTCurrentTime: true,

      initialMapOptions,

      userSelectedMapOptions: {
        // templateUrl: "https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png",
        templateUrl: "https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryTopo/MapServer/tile/{z}/{y}/{x}",
        attribution: 'Tiles courtesy of the <a href="https://usgs.gov/">U.S. Geological Survey</a>',
        ...(queryData ? { ...queryData, initialZoom: 5 } : initialView)
      },

      currentFractionEclipsed: 0,

      placeCircleOptions: {
        color: "#0000FF",
        fillColor: "#0000FF",
        fillOpacity: 0.7,
        radius: 5 
      },

      selectedCircleOptions: {
        color: "#FF0000",
        fillColor: "#FF0000",
        fillOpacity: 0.7,
        radius: 5
      },

      learnerPath: "Location" as LearnerPath,
      visitedCloudCover: false,
      
      playing: false,
      playingWaitCount: 0,

      showControls: false,
      showAltAzGrid: false,
      showHorizon: true,

      toggleTrackSun: true,
      
      times,
      minTime,
      maxTime,
      millisecondsPerInterval: MILLISECONDS_PER_INTERVAL,
      nowOutsideTimeRange: false,
      
      accentColor: "#eac402",
      // Lighter variant of the CosmicDS logo blue -- used for links and,
      // to keep them visually distinct from the app's primary yellow
      // accent, every "x to close" button.
      accentColor2: "#7996DA",
      moonColor: "#CFD8DC",
      normalBorderRadius: "10px",
      tightBorderRadius: "5px",
      guidedContentHeight: "300px",
      // Position (px, relative to #main-content's own top/left edges) for
      // the eclipse-percent indicator -- see updateEclipsedIndicatorPosition().
      eclipsedIndicatorTop: 0,
      eclipsedIndicatorLeft: 0,
      showGuidedContent: true,
      topContainerCustomHeight: null as number | null,
      isResizingTopContainer: false,
      topContainerResizeStartY: 0,
      topContainerResizeStartHeight: 0,
      nonMapContainerWidthPercent: null as number | null,
      isResizingMapWidth: false,
      mapWidthResizeStartX: 0,
      mapWidthResizeStartWidth: 0,
      nonMapContainerMobileHeightPercent: null as number | null,
      isResizingMobileNonMapHeight: false,
      mobileNonMapHeightResizeStartY: 0,
      mobileNonMapHeightResizeStartHeight: 0,

      inIntro: false,
      scrollUp: false,

      showPrivacyDialog: false,
      showMyLocationDialog: false,
      showRatingPrivacyPolicy: false,

      tab: 0,
      introSlide: 1,
      dontShowIntro,

      viewerMode: 'Horizon' as ViewerMode,

      showSky: true,
      skyColorLight: "#4190ED",
      skyColor: "#4190ED",
      skyOpacity: 0.6,
      horizonOpacity: 1,
      useRegularMoon: false,
      moonTexture: 'moon-sky-blue-overlay.png' as MoonImageFile,

      playbackRateValue: 1,
      forceRate: false,
      playbackVisible: false,
      maxPlaybackRate: MAX_PLAYBACK_RATE,
      
      horizonRate: 500,
      scopeRate: 100,

      sunPlace,
      moonPlace,

      queryData,
      //  source https://svs.gsfc.nasa.gov/5123/ shapefiles converted to geojson using mapshaper.org/
      // the order is the layer order form bottom to top
      geojson: [
        {
          // geojson: eclipseUmbra as GeoJSON.GeometryCollection,
          geojson: nso.umbra as GeoJSON.GeometryCollection,
          style: {fillColor: '#333', weight: 1, opacity: 0, fillOpacity: 0.3, id:"upath"}
        },
        {
          'geojson': {'type': 'FeatureCollection', 'features': [nso.centerline]} as GeoJSON.FeatureCollection,
          style: {color: '#ff0000', weight: 1, opacity: 1, fillOpacity: 0}
        },
      ],
      

      userSelectedLocations,
      cloudCoverSelectedLocations: [] as [number, number][],
      textSearchSelectedLocations: [] as [number, number][],
      advancedWeatherSelectedCount: 0,
      cloudCoverSelectedCount: 0,
      eclipsePrediction: null as EclipseData<Date> | null,
      eclipseStart: 0 as number | null,
      eclipseMid: 0 as number | null,
      eclipseEnd: 0 as number | null,
      eclipseType: null as "Partial" | "Total" | "Annular" | 'None' | null,
    };
  },

  beforeCreate() {
    const searchParams = new URLSearchParams(window.location.search);
    const lat = parseFloat(searchParams.get("lat") ?? "");
    const lon = parseFloat(searchParams.get("lon") ?? "");
    if (lat && lon) {
      queryData = {
        latitudeDeg: lat, longitudeDeg: lon
      };
    }
    const splashQuery = searchParams.get("splash");
    queryData.splash = splashQuery !== "false";
    const awv = searchParams.get("awv");
    queryData.awv = awv === "true";
  },

  mounted() {  

    setInterval(() => {
      this.nowOutsideTimeRange = Date.now() < this.minTime || Date.now() > this.maxTime;
    }, 1000);

    if (queryData.latitudeDeg !== undefined && queryData.longitudeDeg !== undefined) {
      this.selectedTimezone = tzlookup(...[queryData.latitudeDeg, queryData.longitudeDeg]);
      this.updateSelectedLocationText();
    }

    this.createUserEntry();

    // We just need to force these to get around some Safari issues whose cause is TBD
    Planets._loadPlanetTextures();
    Planets.updatePlanetLocations(false);

    this.waitForReady().then(async () => {

      this.backgroundImagesets = [...skyBackgroundImagesets];

      this.setTime(this.dateTime);

      this.wwtSettings.set_localHorizonMode(true);
      this.wwtSettings.set_showAltAzGrid(this.showAltAzGrid);
      this.wwtSettings.set_showAltAzGridText(this.showAltAzGrid);

      // This is kinda horrible, but it works!

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      this.wwtControl._drawSkyOverlays = drawSkyOverlays;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      Grids._makeAltAzGridText = makeAltAzGridText;

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      LayerManager._draw = layerManagerDraw;      

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      this.wwtControl._updateViewParameters = updateViewParameters.bind(this.wwtControl);

      this.wwtMove = this.wwtControl.move;

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      this.wwtControl.roll = function(_angle) {};
      this.wwtControl._tilt = function(_angle) {};
      this.updatePan();

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const boundRenderOneFrame = renderOneFrame.bind(this.wwtControl);

      // NB: Unlike in the Seasons story,
      // this has to be an arrow function so that we can use the component `this`.
      // This is ultimately a Composition vs. Options API difference
      const newFrameRender = () => {
        boundRenderOneFrame(
          this.showHorizon,
          this.showSky,
        );
      };
      this.wwtControl.renderOneFrame = newFrameRender;

      // Force the render of one frame so that planet textures will be loaded
      // We don't want to attach the callback before this so that we don't mess up sun tracking
      this.wwtControl.renderOneFrame();

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      this.wwtControl.renderFrameCallback = this.onWWTRenderFrame;

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      Planets.drawPlanets = (renderContext: RenderContext, opacity: number) => {
        drawPlanets(renderContext, opacity, this.currentFractionEclipsed);
      };


      /* eslint-disable @typescript-eslint/no-var-requires */
      Planets['_planetTextures'][0] = Texture.fromUrl(require("./assets/2023-09-19-SDO-Sun.png"));
      this.setForegroundImageByName("Digitized Sky Survey (Color)");
      this.setForegroundOpacity(100);

      // The initial Moon position is incorrect, and we use it to set the Moon sprite.
      // Thus, we explicitly call for an update here.
      this.moonPlace.updatePlanetLocation(this.wwtCurrentTime.getTime());
      this.updateMoonTexture(true);

      this.updateWWTLocation();

      this.setClockSync(false);
      this.playing = false;

      this.setClockRate(1); //

      this.playbackRate = 1;  //this.setplaybackRate('8 minutes per second'); // 500;

      this.layersLoaded = true;

      this.startHorizonMode();

      this.trackSun().then(() => this.positionSet = true);
      this.getEclipsePrediction();

      setInterval(() => {
        if (this.playing) {
          const time = this.wwtCurrentTime;
          this.selectedTime = time.getTime();
          this.updateFrontAnnotations(time);
        }
      }, 500);

      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") {
          this.sendUpdateData();
        } else {
          this.resetData();
        }
      });

    });

    this.$nextTick(() => {
      window.addEventListener('resize', this.onResize);
      this.onResize();
    });

    this.$nextTick(() => {
      window.addEventListener('resize', this.updateEclipsedIndicatorPosition);
      this.updateEclipsedIndicatorPosition();
    });

    document.addEventListener('keydown', this.onSpeedControlTabKeydown);

    // Tracks keyboard vs mouse/touch use so the oreo focus ring can stay
    // keyboard-only even on text inputs (see the body.keyboard-focus-only
    // CSS override above -- browsers show :focus-visible for text fields
    // on click by default, which this needs to suppress explicitly).
    document.addEventListener('keydown', this.onKeydownForFocusIndicator);
    document.addEventListener('mousedown', this.onPointerForFocusIndicator);
    document.addEventListener('touchstart', this.onPointerForFocusIndicator);

    this.applyLayoutDefaults(this.narrow);

    this.updateSkyOpacityForSunAlt(10 * D2R); // 10 degrees above horizon

    const element = document.getElementById("guided-content-container");
    if (element) {
      element.addEventListener("scroll", () => this.onScroll());
    }
    
  },

  computed: {

    // The User Guide's checkbox reads more naturally phrased as "show",
    // but the underlying stored preference (and the intro dialog's own
    // checkbox) is phrased as "don't show" -- this just flips the sense.
    showIntroAtLaunch: {
      get(): boolean {
        return !this.dontShowIntro;
      },
      set(value: boolean) {
        this.dontShowIntro = !value;
      }
    },

    eclipsePredictionText(): string {
      if (!this.eclipsePrediction) {
        return '';
      }
      const { type, maxTime, duration, partialStart, centralStart, centralEnd, partialEnd } = this.eclipsePrediction;
      if (type === '' || type === null || maxTime[0] === null) {
        return "No Eclipse";
      }

      const anyVisible = [partialStart, centralStart, maxTime, centralEnd, partialEnd]
        .some(c => c[0] !== null && c[1] === null);
      if (!anyVisible) { // The entire eclipse is below the horizon here
        return "No Eclipse";
      }
      
      // Max eclipse must be above the horizon. The NSO boundary cuts at the
      // day/night terminator at max eclipse, so this matches being inside it
      // (sun can set between C2 and max: C2 visible but totality not).
      if (type === "T" && maxTime[1] !== null) {
        return "Total Eclipse below Horizon";
      }
      
      // rising case: it must end after sunrise: centrality end = null
      // setting case: it must start before sunset: centrality start = null
      if (type === "P" && partialStart[1] !== null && partialEnd[1] !== null) {
        return "Eclipse below Horizon";
      }

      if (!this.onDayOfEclipse) {
        // Until the actual day of the eclipse, just show the simple status
        // — the detailed begins-at/duration timing below is only useful
        // once "today" is a meaningful reference point.
        if (type === "T") {
          if (duration) {
            return `Total Eclipse\n(${spaceHMS(duration)} of totality)`;
          }
          return "Total Eclipse";
        }
        const maxCoverage = this.eclipsePrediction.coverage[0];
        if (maxCoverage) {
          return `Partial Eclipse\n(Max: ${Math.round(maxCoverage * 100)}%)`;
        }
        return "Partial Eclipse";
      }

      const typeString = (new Map([
        ["P", "Partial"],
        ["T", "Total"],
        ["A", "Annular"],
      ])).get(type);

      if (type == "T") {
        const begins = formatInTimeZone(centralStart[0], this.selectedTimezone, "h:mm:ss aa (zzz)");
        if (this.$vuetify.display.xs) {
          return `Totality starts: ${begins} Duration: ${spaceHMS(duration)}`;
        }
        return `Totality begins at ${begins} and lasts ${spaceHMS(duration)}`;
      }

      if (duration === '') {
        // get the duration of the partial eclipse
        const starting = formatInTimeZone(partialStart[0], this.selectedTimezone, "h:mm aa (zzz)");
        if (this.$vuetify.display.xs) {
          return `${typeString} starts: ${starting}`;
        }
        return `${typeString} eclipse begins at ${starting}`;
      }
      return '';
    },

    selectedCloudCoverData(): CloudData[] | null {
      if (this.cloudCoverData != null) {
        return this.cloudCoverData;
      } else {
        console.log('selectedCloudCoverData: cloud cover data not loaded');
        return null;
      }
    },


    dateTime() {
      return new Date(this.selectedTime);
    },

    selectedTimezoneOffset() {
      return getTimezoneOffset(this.selectedTimezone);
    },

    selectedLocalDateString() {
      return formatInTimeZone(this.dateTime, this.selectedTimezone, 'MMMM d, yyyy');
    },
    
    selectedLocationCloudCover(): number | null {
      if (this.locationDeg) {
        return this.getCloudCover(this.locationDeg.latitudeDeg, this.locationDeg.longitudeDeg);
      } else {
        return null;
      }
    },
    
    cloudIcon() {
    
      if (this.selectedLocationCloudCover == null) {
        return 'mdi-cloud-cancel';
      } 
      else if (this.selectedLocationCloudCover < .25) {
        return 'mdi-weather-sunny';
      }
      else if (this.selectedLocationCloudCover < .5) {
        return 'mdi-weather-partly-cloudy';
      } 
      else if (this.selectedLocationCloudCover < 0.9) {
        return 'mdi-weather-cloudy';
      } 
      else {
        return 'mdi-clouds';
      } 
    },
    
    myLocationToolTip() {
      if (this.geolocationPermission === 'denied') {
        return "Geolocation disabled. Check browser and site permissions and reload page.";
      } else if (this.geolocationPermission === 'prompt') {
        return "Click to enable location permissions";
      } else {
        return "Use my location";
      } 
    },
    
    myLocationColor() {
      console.log(this.geolocationPermission);
      if (this.geolocationPermission === 'denied') {
        return "grey";
      }
      
      if (this.geolocationPermission === 'prompt') {
        return "grey";
      }
      
      if (this.geolocationPermission === 'granted') {
        
        if (this.myLocation) {
          // check if location = myLocation. if not fade the color a bit.
          if (
            this.locationDeg.latitudeDeg === this.myLocation.latitudeDeg && this.locationDeg.longitudeDeg === this.myLocation.longitudeDeg
          ) {
            return this.accentColor;
          } else {
            return this.accentColor;
          }
        }
      }
      
      return this.accentColor;
      
      
    },

    ready(): boolean {
      return this.layersLoaded && this.positionSet;
    },
    isLoading(): boolean {
      return !this.ready;
    },
    selectedDate(): Date {
      return new Date(this.selectedTime);
    },
    smallSize(): boolean {
      return this.$vuetify.display.smAndDown;
    },
    smAndUp(): boolean {
      return this.$vuetify.display.smAndUp;
    },
    xSmallSize(): boolean {
      return this.$vuetify.display.xs;
    },
    narrow(): boolean {
      return this.$vuetify.display.width <= 600;
    },
    // The new streamlined UI is shown responsively on narrow/mobile screens;
    // wider (desktop) screens continue to use the detailed interface.
    // This is not user-toggleable.
    showNewMobileUI(): boolean {
      return this.narrow;
    },

    mobile(): boolean {
      return this.smallSize && this.touchscreen;
    },
    cssVars() {
      return {
        '--accent-color': this.accentColor,
        '--accent-color-2': this.accentColor2,
        '--sky-color': this.skyColorLight,
        '--app-content-height': this.showInfoSheet ? '100%' : '100%',
        '--top-content-height': this.showGuidedContent? this.guidedContentHeight : this.guidedContentHeight,
        '--moon-color': this.moonColor,
        '--normal-border-radius': this.normalBorderRadius,
        '--tight-border-radius': this.tightBorderRadius,
      };
    },
    topContainerStyle() {
      if (this.narrow || this.topContainerCustomHeight === null) {
        return {};
      }
      const height = `${this.topContainerCustomHeight}px`;
      return { height, minHeight: height, maxHeight: height };
    },
    nonMapContainerStyle() {
      if (this.narrow) {
        if (this.nonMapContainerMobileHeightPercent === null) {
          return {};
        }
        const basis = `${this.nonMapContainerMobileHeightPercent}%`;
        return { flexBasis: basis, flexGrow: 0, flexShrink: 0 };
      }
      if (this.nonMapContainerWidthPercent === null) {
        return {};
      }
      const basis = `${this.nonMapContainerWidthPercent}%`;
      return { flexBasis: basis, flexGrow: 0, flexShrink: 0 };
    },
    wwtControl(): WWTControl {
      return WWTControl.singleton;
    },

    wwtSettings(): Settings {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return Settings.get_active();
    },
    
    wwtContentHeight(): number | null {
      // console.log("wwtContentHeight", this.guidedContentHeight);
      const mainContent = document.getElementById('main-content');
      const windowHeight = window.innerHeight;
      
      if (mainContent) {
        console.log(windowHeight);
        return windowHeight; // - parseInt(this.guidedContentHeight.replace('px', ''));
      } else {
        return null;
      }
    } , 

    showInfoSheet: {
      get(): boolean {
        return this.sheet === 'text';
      },
      set(_value: boolean) {
        this.selectSheet('text');
      }
    },

    locationDeg: {
      get(): LocationDeg {
        return {
          latitudeDeg: R2D * this.location.latitudeRad,
          longitudeDeg: R2D * this.location.longitudeRad
        };
      },
      set(value: LocationDeg) {
        this.location = {
          latitudeRad: D2R * value.latitudeDeg,
          longitudeRad: D2R * value.longitudeDeg
        };
      }
    },

    sunPosition(): EquatorialRad & HorizontalRad {
      const sunAltAz = this.equatorialToHorizontal(this.sunPlace.get_RA() * 15 * D2R,
        this.sunPlace.get_dec() * D2R,
        this.location.latitudeRad,
        this.location.longitudeRad,
        this.dateTime);

      return {
        raRad: this.sunPlace.get_RA() * 15 * D2R,
        decRad: this.sunPlace.get_dec() * D2R,
        ...sunAltAz
      };
    },

    moonPosition(): EquatorialRad & HorizontalRad {
      const moonAltAz = this.equatorialToHorizontal(this.moonPlace.get_RA() * 15 * D2R,
        this.moonPlace.get_dec() * D2R,
        this.location.latitudeRad,
        this.location.longitudeRad,
        this.dateTime);

      return {
        raRad: this.moonPlace.get_RA() * 15 * D2R,
        decRad: this.moonPlace.get_dec() * D2R,
        ...moonAltAz
      };
    },

    sunAboveHorizon(): boolean {
      return this.sunPosition.altRad > 0;
    },

    percentEclipsedText(): string {
      let percentEclipsed = Math.round(this.currentFractionEclipsed*100);//.toFixed(0);
      if (this.currentFractionEclipsed < 0.995 && percentEclipsed === 100) {
        percentEclipsed = 99;
      }
      return `Eclipsed: ${percentEclipsed}%`;
    },

    inEclipse(): boolean | null {
      if (this.eclipsePrediction && this.eclipseStart != null && this.eclipseEnd != null) {
        return this.wwtCurrentTime.getTime() >= this.eclipseStart && this.wwtCurrentTime.getTime() <= this.eclipseEnd;
      } else {
        return null;
      }
    },
    
    eclipsePhase(): 'before' | 'during' | 'after' | null {
      if (this.eclipsePrediction && this.eclipseStart != null && this.eclipseEnd != null) {
        if (this.wwtCurrentTime.getTime() < this.eclipseStart) {
          return 'before';
        } else if (this.wwtCurrentTime.getTime() > this.eclipseEnd) {
          return 'after';
        } else {
          return 'during';
        }
      } else {
        return null;
      }
    },
    
    nearTotality(): boolean {
      let nearEclipseMax = false;
      if (this.eclipsePrediction) {
        if (this.eclipsePrediction.maxTime[0]) {
          nearEclipseMax = Math.abs(this.eclipsePrediction.maxTime[0].getTime() - this.wwtCurrentTime.getTime()) < 120_000;
        }
      }

      // if the eclipse prediction isn't available fallback on the current fraction eclipsed
      return this.locationInTotality && (nearEclipseMax || this.currentFractionEclipsed > .99);
    },
    
    playbackRate: {
      set(value: number) {
        this.playbackRateValue = Math.sign(value) * this.clampPlaybackRate(Math.abs(value));
      },
      get(): number {
        if (this.forceRate) {
          const sign = Math.sign(this.playbackRateValue);
          return sign * Math.min(10, sign * this.playbackRateValue);
        } 
        return this.playbackRateValue;        
      }
    },
    
    locationInTotality() {
      const location = this.locationDeg;
      // const poly = eclipseUmbra.geometries[0].coordinates[0];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const poly = (nso.umbra.geometries[0] as any).coordinates[0];
      const point = [location.longitudeDeg, location.latitudeDeg];
      return pointInPolygon(point, poly);
    },

    
    inPredictedTotality(): boolean {
      const p = this.eclipsePrediction;
      if (p === null || p.type !== 'T') {
        return false;
      }
      const start = p.centralStart[0];
      const end = p.centralEnd[0];
      if (!(start instanceof Date) || !(end instanceof Date)) {
        return false;
      }
      const t = this.wwtCurrentTime.getTime();
      return t >= start.getTime() && t <= end.getTime();
    },


  },

  methods: {
    
    clearQuestionTimeout() {
      if (this.questionTimeout !== null) {
        clearTimeout(this.questionTimeout);
        this.questionTimeout = null;
      }
    },

    updateUserExperienceInfo(rating: UserExperienceRating | null, comments: string | null) {
      const body: Record<string, unknown> = {
        uuid: this.uuid,
        question: this.question,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        story_name: "solar-eclipse-2026",
      };
      if (rating) {
        body.rating = rating;
      }
      if (comments) {
        body.comments = comments;
      }
      fetch(this.storyRatingUrl, {
        method: "PUT",
        headers: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          "Authorization": process.env.VUE_APP_CDS_API_KEY ?? "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
    },
    pauseForOverlay() {
      const increment = this.playing  || this.playingWaitCount > 0;
      this.playingWaitCount = increment ? this.playingWaitCount + 1 : this.playingWaitCount;
      this.playing = false;
      
    },
    
    playForOverlay() {
      if (this.playingWaitCount === 1) {
        console.log('playForOverlay');
        this.playing = true;
      } 
      
      this.playingWaitCount = this.playingWaitCount === 0 ? 0 : this.playingWaitCount - 1;

    },

    updatePan() {
      this.wwtControl.move = this.toggleTrackSun ? function(_x, _y) {} : wwtMove;
    },

    onScroll() {
      const el = document.getElementById('guided-content-container');

      if (el) {
        const scrollUp = el.scrollTop > 0;
        if (this.scrollUp !== scrollUp) {
          this.scrollUp = scrollUp;
        }
      }

    },
    
    sigmoid(val: number | null): number {
      if (val === null) {
        return 0;
      }
      const y = (val - 0.5) / .12;
      const z = Math.exp(y);
      return z / (1 + z);
    },

    async trackSun(): Promise<void> {
      return this.gotoTarget({
        place: this.sunPlace,
        instant: true,
        noZoom: true,
        trackObject: true
      });
    },

    angleInZeroToTwoPi(angle: number): number {
      const twoPi = 2 * Math.PI;
      return ((angle% twoPi) + twoPi) % twoPi;
    },

    // This assumes that the input angles are in the range [0, 2pi)
    angleBetween(test: number, lower: number, upper: number): boolean {
      if (lower < upper) {
        return test >= lower && test <= upper;
      } else {
        return test >= lower || test <= upper;
      }
    },
    
    updateIntersection() {

      if (Planets['_planetLocations'] == null) {
        return;
      }

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const canvasHeight: number = this.wwtControl.canvas.height;

      const sunPosition = Planets['_planetLocations'][0];
      const moonPosition = Planets['_planetLocations'][9];
      const sunPoint = getScreenPosForCoordinates(this.wwtControl, sunPosition.RA, sunPosition.dec);
      const moonPoint = getScreenPosForCoordinates(this.wwtControl, moonPosition.RA, moonPosition.dec);
      moonPoint.y = canvasHeight - moonPoint.y;
      sunPoint.x -= moonPoint.x;
      sunPoint.y = canvasHeight - sunPoint.y - moonPoint.y;

      const jd = this.getJulian(this.selectedDate);
      const distanceToMoon = CAAMoon.radiusVector(jd);
      const distanceToSun = 149_597_871;

      const rMoon = 1737.4;  // radius of the moon in km
      const rSun = 696_340;
      const thetaMoon = Math.atan2(rMoon, distanceToMoon);
      const thetaSun = Math.atan2(rSun, distanceToSun);

      // The factor of 6 comes from the relation between wwtZoomDeg and the actual size of the FOV in degrees
      const rMoonPx = 6 * thetaMoon * canvasHeight / (this.wwtZoomDeg * D2R);
      const rSunPx = 6 * thetaSun * canvasHeight / (this.wwtZoomDeg * D2R);

      const points: { x: number; y: number }[] = [];
      const sunMoonDistance = Math.sqrt(sunPoint.x * sunPoint.x + sunPoint.y * sunPoint.y);

      // If there's no sun/moon intersection, no need to continue
      if (sunMoonDistance > rMoonPx + rSunPx) {
        this.currentFractionEclipsed = 0;
        return;
      }

      const moonInsideSun = sunMoonDistance < rSunPx - rMoonPx;
      const sunInsideMoon = sunMoonDistance < rMoonPx - rSunPx;

      const dSq = sunMoonDistance * sunMoonDistance;
      const rMoonSq = rMoonPx * rMoonPx;
      const rSunSq = rSunPx * rSunPx;

      const moonArea = Math.PI * rMoonSq;
      const sunArea = Math.PI * rSunSq;
      let fractionEclipsed = 0;
      if (moonInsideSun || sunInsideMoon) {
        fractionEclipsed = moonArea / sunArea;
      } else {
        // See https://mathworld.wolfram.com/Circle-CircleIntersection.html
        const intersectionArea =
          rMoonSq * Math.acos((dSq + rMoonSq - rSunSq) / (2 * sunMoonDistance * rMoonPx)) +
          rSunSq * Math.acos((dSq + rSunSq - rMoonSq) / (2 * sunMoonDistance * rSunPx)) -
          0.5 * Math.sqrt(
            (rSunPx + rMoonPx - sunMoonDistance) * (sunMoonDistance + rMoonPx - rSunPx) * (sunMoonDistance - rMoonPx + rSunPx) * (sunMoonDistance + rSunPx + rMoonPx)
          );
        fractionEclipsed = intersectionArea / sunArea;
      }
      
      let forceTotality = false;
      if ((this.locationInTotality || this.inPredictedTotality) && this.inEclipse) {
        if (this.currentFractionEclipsed <= 1) {
          this.currentFractionEclipsed = 1;
          forceTotality = true;
        }
      } else {
        const cfe = isNaN(fractionEclipsed) ? 1 : Math.max(Math.min(fractionEclipsed, 1), 0);
        if (cfe == 1) {
          // force a lower value to hide corona
          this.currentFractionEclipsed = .999;
        } else {
          this.currentFractionEclipsed = cfe;
        }
      }

      // If we're using the regular WWT moon, or in sun scope mode, we don't want the overlay but did want the percentage eclipsed
      if (this.useRegularMoon) {
        return;
      }

      const n = 50;
      // If the moon/sun is completely "inside" of the sun/moon
      if (moonInsideSun || sunInsideMoon || forceTotality) {
        for (let i = 0; i <= n; i++) {
          const angle = (i / n) * 2 * Math.PI;
          points.push({ x: rMoonPx * Math.cos(angle), y: rMoonPx * Math.sin(angle) });
        }
      } else {
        let x1: number;
        let y1: number;
        let x2: number;
        let y2: number;

        if (sunPoint.x === 0) {

          let ysh = 0.5 * sunPoint.y;
          if (ysh >= rMoonPx) {
            return;
          } else if (ysh === 0) {
            ysh = Math.min(rMoonPx, rSunPx);
          }
          x1 = Math.sqrt(rMoonPx * rMoonPx - ysh * ysh);
          if (isNaN(x1)) {
            console.error("x1 is NaN");
            this.currentFractionEclipsed = 0;
            return;
          }
          y1 = ysh;
          x2 = -x1;
          y2 = ysh;

        } else {

          // m is the slope of the line joining the moon and the sun
          // mPerp is the slope of a line perpendicular to the line joining the moon and the sun
          // yInt is the y-intercept of a line passing through the two points of intersection
          const epsilon = 1e-5;
          const mPerp = -sunPoint.x / (sunPoint.y + epsilon);
          const yInt = (sunPoint.x * sunPoint.x + sunPoint.y * sunPoint.y - (rSunPx * rSunPx - rMoonPx * rMoonPx)) / (2 * (sunPoint.y + epsilon));

          // Find the x-coordinates of the edge points of the moon-sun intersection
          const a = (1 + mPerp * mPerp);
          const b = 2 * mPerp * yInt;
          const c = yInt * yInt - rMoonPx * rMoonPx;

          const sqrDisc = Math.sqrt(b * b - 4 * a * c);
          if (isNaN(sqrDisc)) {
            console.error("sqrDisc is NaN");
            this.currentFractionEclipsed = 0;
            return;
          }
          x1 = (-b + sqrDisc) / (2 * a);
          x2 = (-b - sqrDisc) / (2 * a);
          y1 = mPerp * x1 + yInt;
          y2 = mPerp * x2 + yInt;
        }

        // The standard-position angle of the sun-moon line in the moon's reference frame
        const alpha = this.angleInZeroToTwoPi(Math.atan2(sunPoint.y, sunPoint.x));

        let theta1 = Math.atan2(y1 / rMoonPx, x1 / rMoonPx);
        let theta2 = Math.atan2(y2 / rMoonPx, x2 / rMoonPx);
        theta1 = this.angleInZeroToTwoPi(theta1);
        theta2 = this.angleInZeroToTwoPi(theta2);
        if (!this.angleBetween(alpha, theta1, theta2)) {
          const t = theta1;
          theta1 = theta2;
          theta2 = t;
        }

        if (theta1 > theta2) {
          theta1 -= 2 * Math.PI;
        }

        const rangeSize = theta2 - theta1;
        for (let i = 0; i <= n; i++) {
          const angle = theta1 + (i / n) * rangeSize;
          points.push({ x: rMoonPx * Math.cos(angle), y: rMoonPx * Math.sin(angle) });
        }

        // We now need to somewhat repeat this analysis in the Sun frame

        let thetaS1 = Math.atan2((y1 - sunPoint.y) / rSunPx, (x1 - sunPoint.x) / rSunPx);
        let thetaS2 = Math.atan2((y2 - sunPoint.y) / rSunPx, (x2 - sunPoint.x) / rSunPx);
        thetaS1 = this.angleInZeroToTwoPi(thetaS1);
        thetaS2 = this.angleInZeroToTwoPi(thetaS2);
        const alphaS = this.angleInZeroToTwoPi(Math.PI + alpha);
        if (!this.angleBetween(alphaS, thetaS1, thetaS2)) {
          const t = thetaS1;
          thetaS1 = thetaS2;
          thetaS2 = t;
        }

        if (thetaS1 > thetaS2) {
          thetaS1 -= 2 * Math.PI;
        }
        const rangeSizeS = thetaS2 - thetaS1;
        for (let i = 0; i <= n; i++) {
          const angle = thetaS1 + (i / n) * rangeSizeS;
          points.push({ x: rSunPx * Math.cos(angle) + sunPoint.x, y: rSunPx * Math.sin(angle) + sunPoint.y });
        }

      }
      
      

      // We made a translation into the moon's frame, so undo that
      for (let i = 0; i < points.length; i++) {
        points[i].x += moonPoint.x;
        points[i].y += moonPoint.y;
      }

      this.updateMoonTexture();

      const centroidX = points.reduce((s, p) => s + p.x, 0) / points.length;
      const centroidY = points.reduce((s, p) => s + p.y, 0) / points.length;

      // The fact that we're going to re-flip the y axis makes the sign here opposite from what one would expect
      points.sort((p1, p2) => - Math.atan2(p2.y - centroidY, p2.x - centroidX) + Math.atan2(p1.y - centroidY, p1.x - centroidX));

      const locations = points.map(pt => this.findRADecForScreenPoint({ x: pt.x, y: canvasHeight - pt.y }));
      const overlay = new Poly2();
      overlay.set_fill(true);
      const color = "#1F1F1F";
      overlay.set_fillColor(color);
      overlay.set_lineColor(color);
      locations.forEach(pt => overlay.addPoint(pt.ra, pt.dec));
      Annotation2.addAnnotation(overlay);
    },


    onWWTRenderFrame(wwtControl: WWTControl) {
      if (this.showNewMobileUI) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if (this.toggleTrackSun && wwtControl._trackingObject !== this.sunPlace) {
          this.trackSun();
        }
      }
    },

    textureFromAssetImage(assetFilename: MoonImageFile): Texture {
      /* eslint-disable @typescript-eslint/no-var-requires */
      return Texture.fromUrl(require(`./assets/${assetFilename}`));
    },

    updateMoonTexture(force=false) {
      let filename: MoonImageFile = "moon.png";
      if (!this.useRegularMoon) {
        const blueMoon = (this.showHorizon && this.showSky) &&
                          this.moonPosition.altRad > 0 ;
        if (!blueMoon) {
          filename = "moon-dark-gray-overlay.png";
        } else {
          let opacityToUse = 100;
          if (this.skyOpacity > 0.8) {
            opacityToUse = 100;
          } else if (this.skyOpacity <= 0.8 && this.skyOpacity >0.7) {
            opacityToUse = 20;
          } else {
            opacityToUse = 10;
          }
          filename = `moon-sky-blue-overlay-${opacityToUse}.png`;
        }
      }
      if (force || (filename !== this.moonTexture && Planets._planetTextures)) {
        Planets._planetTextures[9] = this.textureFromAssetImage(filename);
        this.moonTexture = filename;
      }
    },

    toTimeString(date: Date | null, seconds = false, utc = false) {
      if (date === null) {
        return "";
      }
      
      if (seconds) {
        return formatInTimeZone(date, utc ? 'UTC' : this.selectedTimezone, 'h:mm:ss aaa (zzz)');
      }
      return formatInTimeZone(date, utc ? 'UTC' : this.selectedTimezone, 'h:mm aaa (zzz)');
    },

    closeSplashScreen() {
      this.showSplashScreen = false;
    },

    // While the speed control popup is open, Tab should cycle through
    // exactly this set, in this order, rather than the page's normal
    // DOM-based tab order -- which otherwise either escapes the popup
    // entirely (its slider lives in a teleported dialog, so tabbing off
    // it wraps around to the very start of the page) or skips over the
    // popup's slider altogether (it sits outside the toolbar's own
    // normal DOM position).
    speedControlTabStops(): HTMLElement[] {
      const stops = [
        document.querySelector('.desktop-playback-control .v-slider-thumb'),
        document.getElementById('play-pause-icon-button'),
        document.getElementById('backward-speed-button'),
        document.getElementById('forward-speed-button'),
        document.getElementById('reverse-speed-button'),
        document.getElementById('reset-button'),
        document.getElementById('speed-control-icon-button'),
        document.querySelector('#slider .v-slider-thumb'),
      ];
      return stops.filter((el): el is HTMLElement => el !== null);
    },

    onSpeedControlTabKeydown(event: KeyboardEvent) {
      if (!this.playbackVisible || event.key !== 'Tab') {
        return;
      }
      const stops = this.speedControlTabStops();
      const currentIndex = stops.indexOf(document.activeElement as HTMLElement);
      if (currentIndex === -1) {
        return;
      }
      event.preventDefault();
      const delta = event.shiftKey ? -1 : 1;
      const nextIndex = (currentIndex + delta + stops.length) % stops.length;
      stops[nextIndex].focus();
    },

    // Only Tab (not every keydown) counts as "using the keyboard to move
    // focus" -- typing letters into an already-focused field shouldn't
    // retroactively make that focus "keyboard-visible".
    onKeydownForFocusIndicator(event: KeyboardEvent) {
      if (event.key === 'Tab') {
        document.body.classList.add('keyboard-focus-only');
      }
    },

    onPointerForFocusIndicator() {
      document.body.classList.remove('keyboard-focus-only');
    },

    updateWWTLocation() {
      this.wwtSettings.set_locationLat(R2D * this.location.latitudeRad);
      this.wwtSettings.set_locationLng(R2D * this.location.longitudeRad);
    },

    updateLocationFromMap(location: LocationDeg, addToLocations=true) {
      if (location == null) {
        return;
      }
      this.locationDeg = location;
      this.updateSelectedLocationText();

      if (addToLocations) {
        const visitedLocation: [number, number] = [location.longitudeDeg, location.latitudeDeg];
        if (this.learnerPath === "Clouds" || this.learnerPath === "CloudDetail") {
          this.cloudCoverSelectedLocations.push(visitedLocation);
          this.cloudCoverSelectedCount += 1;
        } else {
          this.userSelectedLocations.push(visitedLocation);
        }
      }
    },

    async createUserEntry() {
      if (this.responseOptOut) {
        return;
      }
      let userExists = false;
      try {
        const response = await fetch(`${API_BASE_URL}/solar-eclipse-2026/data/${this.uuid}`, {
          method: "GET",
          // eslint-disable-next-line @typescript-eslint/naming-convention
          headers: { "Authorization": process.env.VUE_APP_CDS_API_KEY ?? "" }
        });
        const content = await response.json();
        userExists = response.status === 200 && content.response?.user_uuid != undefined;
        this.canTrackStory = true;
      
      
        if (!userExists) {
          fetch(`${API_BASE_URL}/solar-eclipse-2026/data`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              // eslint-disable-next-line @typescript-eslint/naming-convention
              "Authorization": process.env.VUE_APP_CDS_API_KEY ?? ""
            },
            body: JSON.stringify({
              // eslint-disable-next-line @typescript-eslint/naming-convention
              user_uuid: this.uuid, 
              // eslint-disable-next-line @typescript-eslint/naming-convention
              user_selected_locations: toRaw(this.userSelectedLocations),
              // eslint-disable-next-line @typescript-eslint/naming-convention
              cloud_cover_selected_locations: toRaw(this.cloudCoverSelectedLocations),
              // eslint-disable-next-line @typescript-eslint/naming-convention
              text_search_selected_locations: toRaw(this.textSearchSelectedLocations),
              // eslint-disable-next-line @typescript-eslint/naming-convention
              info_time_ms: 0, app_time_ms: 0, user_guide_time_ms: 0, forecast_info_time_ms: 0,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              advanced_weather_selected_locations_count: this.advancedWeatherSelectedCount,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              cloud_cover_selected_locations_count: this.cloudCoverSelectedCount,
            })
          });
        }
      } catch (e) {
        console.log(e);
      }
      
      if (this.ratingOptOut) {
        return;
      }

      let gaveRating = false;
      
      try {
        // don't care if the user exists, just if the rating does
        const ratingResponse = await fetch(`${this.storyRatingUrl}/${this.uuid}`, {
          method: "GET",
          // eslint-disable-next-line @typescript-eslint/naming-convention
          headers: { "Authorization": process.env.VUE_APP_CDS_API_KEY ?? "" }
        });
        
        const ratingContent = await ratingResponse.json();
        gaveRating = ratingResponse.status === 200 && ratingContent.ratings?.length > 0;
      } catch (e) {
        console.log(e);
      }


      if (!gaveRating) {
        this.questionTimeout = setTimeout(() => {
          this.showRating = true;
        }, 60_000);
      }
    },

    resetData() {
      this.userSelectedLocations = [];
      this.cloudCoverSelectedLocations = [];
      this.textSearchSelectedLocations = [];
      this.infoTimeMs = 0;
      this.userGuideTimeMs = 0;
      this.weatherTimeMs = 0;
      this.weatherInfoTimeMs = 0;
      this.eclipseTimerTimeMs = 0;
      this.forecastInfoTimeMs = 0;
      this.advancedWeatherSelectedCount = 0;
      this.cloudCoverSelectedCount = 0;
      const now = Date.now();
      this.appStartTimestamp = now;
      this.infoStartTimestamp = (this.showInfoSheet && this.infoTab === 0) ? now : null;
      this.userGuideStartTimestamp = (this.showInfoSheet && this.infoTab === 1) ? now : null;
      this.weatherStartTimestamp = this.showAdvancedWeather ? now : null;
      this.weatherInfoStartTimestamp = this.weatherInfoOpen ? now : null;
      this.eclipseTimerStartTimestamp = this.showEclipsePredictionSheet ? now : null;
      this.forecastInfoStartTimestamp = this.showForecastSheet ? now : null;
    },

    sendUpdateData() {
      if (this.responseOptOut) {
        return;
      }
      if (!this.canTrackStory) {
        return;
      }
      const now = Date.now();
      const infoTime = (this.showInfoSheet && this.infoTab === 0 && this.infoStartTimestamp !== null) ? now - this.infoStartTimestamp : this.infoTimeMs;
      const userGuideTime = (this.showInfoSheet && this.infoTab === 1 && this.userGuideStartTimestamp !== null) ? now - this.userGuideStartTimestamp : this.userGuideTimeMs;
      const weatherTime = (this.showAdvancedWeather && this.weatherStartTimestamp !== null) ? now - this.weatherStartTimestamp : this.weatherTimeMs;
      const weatherInfoTime = (this.weatherInfoOpen && this.weatherInfoStartTimestamp !== null) ? now - this.weatherInfoStartTimestamp : this.weatherInfoTimeMs;
      const eclipseTimerTime = (this.showEclipsePredictionSheet && this.eclipseTimerStartTimestamp !== null) ? now - this.eclipseTimerStartTimestamp : this.eclipseTimerTimeMs;
      const forecastInfoTime = (this.showForecastSheet && this.forecastInfoStartTimestamp !== null) ? now - this.forecastInfoStartTimestamp : this.forecastInfoTimeMs;
      fetch(`${API_BASE_URL}/solar-eclipse-2026/data/${this.uuid}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          // eslint-disable-next-line @typescript-eslint/naming-convention
          "Authorization": process.env.VUE_APP_CDS_API_KEY ?? ""
        },
        body: JSON.stringify({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          user_selected_locations: toRaw(this.userSelectedLocations),
          // eslint-disable-next-line @typescript-eslint/naming-convention
          cloud_cover_selected_locations: toRaw(this.cloudCoverSelectedLocations),
          // eslint-disable-next-line @typescript-eslint/naming-convention
          text_search_selected_locations: toRaw(this.textSearchSelectedLocations),
          // eslint-disable-next-line @typescript-eslint/naming-convention
          delta_info_time_ms: infoTime, delta_app_time_ms: now - this.appStartTimestamp,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          delta_advanced_weather_time_ms: weatherTime, delta_weather_info_time_ms: weatherInfoTime,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          delta_user_guide_time_ms: userGuideTime, delta_eclipse_timer_time_ms: eclipseTimerTime,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          delta_forecast_info_time_ms: forecastInfoTime,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          delta_advanced_weather_selected_locations_count: this.advancedWeatherSelectedCount,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          delta_cloud_cover_selected_locations_count: this.cloudCoverSelectedCount,
        }),
        keepalive: true,
      }).then(() => {
        this.resetData();
      });
    },

    selectSheet(name: SheetType) {
      if (this.sheet === name) {
        this.sheet = null;
        this.$nextTick(() => {
          this.blurActiveElement();
        });
      } else {
        this.sheet = name;
      }
    },

    // WWT does have all of this functionality built in
    // but it doesn't seem to be exposed
    // We should do that, but for now we just copy the web engine code
    // https://github.com/Carifio24/wwt-webgl-engine/blob/master/engine/wwtlib/Coordinates.cs
    altAzToHADec(altRad: number, azRad: number, latRad: number): { ra: number; dec: number; } {
      azRad = Math.PI - azRad;
      if (azRad < 0) {
        azRad += 2 * Math.PI;
      }
      let ra = Math.atan2(Math.sin(azRad), Math.cos(azRad) * Math.sin(latRad) + Math.tan(altRad) * Math.cos(latRad));
      if (ra < 0) {
        ra += 2 * Math.PI;
      }
      const dec = Math.asin(Math.sin(latRad) * Math.sin(altRad) - Math.cos(latRad) * Math.cos(altRad) * Math.cos(azRad));
      return { ra, dec };
    },

    getJulian(utc: Date): number {
      let year = utc.getUTCFullYear();
      let month = utc.getUTCMonth()+1;
      const day = utc.getUTCDate();
      const hour = utc.getUTCHours();
      const minute = utc.getUTCMinutes();
      const second = utc.getUTCSeconds() + utc.getUTCMilliseconds() / 1000.0;

      if (month == 1 || month == 2)
      {
        year -= 1;
        month += 12;
      }

      const a = Math.floor(year / 100);
      const b = 2 - a + Math.floor(a / 4.0);
      const c = Math.floor(365.25 * year);
      const d = Math.floor(30.6001 * (month + 1));

      // gives julian date: number of days since Jan 1, 4713 BC
      const jd = b + c + d + 1720994.5 + day + (hour + minute / 60.00 + second / 3600.00) / 24.00;
      return jd;

    },
    
    mstFromUTC2(utc: Date, longRad: number): number {
      const lng = longRad * R2D;

      const modifiedJD = this.getJulian(utc)  - 2451545;

      const julianCenturies = modifiedJD / 36525.0;
      // this form wants julianDays - 2451545
      let mst = 280.46061837 + 360.98564736629 * modifiedJD + 0.000387933 * julianCenturies * julianCenturies - julianCenturies * julianCenturies * julianCenturies / 38710000 + lng;

      if (mst > 0.0) {
        while (mst > 360.0) {
          mst = mst - 360.0;
        }
      } else {
        while (mst < 0.0) {
          mst = mst + 360.0;
        }
      }

      return mst;
    },

    horizontalToEquatorial(altRad: number, azRad: number, latRad: number, longRad: number, utc: Date): EquatorialRad {
      const st = this.mstFromUTC2(utc, longRad); // siderial time 
  
      const haDec = this.altAzToHADec(altRad, azRad, latRad); // get Hour Angle and Declination
      
      const ha = haDec.ra * R2D;

      let ra = st + ha;
      if (ra < 0) {
        ra += 360;
      }
      if (ra > 360) {
        ra -= 360;
      }

      return { raRad: D2R * ra, decRad: haDec.dec };
    },

    equatorialToHorizontal(raRad: number, decRad: number, latRad: number, longRad: number, utc: Date): HorizontalRad {
      let hourAngle = this.mstFromUTC2(utc, longRad) - R2D * raRad;
      if (hourAngle < 0) {
        hourAngle += 360;
      }

      const ha = D2R * hourAngle;
      const dec = decRad;
      const lat = latRad;
      
      const sinAlt = Math.sin(dec) * Math.sin(lat) + Math.cos(dec) * Math.cos(lat) * Math.cos(ha);
      const altitude = Math.asin(sinAlt);
      const cosAz = (Math.sin(dec) - Math.sin(altitude) * Math.sin(lat)) / (Math.cos(altitude) * Math.cos(lat));
      let azimuth = Math.acos(cosAz);

      azimuth = azimuth + (Math.PI * 80) % (Math.PI * 2);

      if (Math.sin(ha) > 0) {
        azimuth = 2 * Math.PI - azimuth;
      }
      return { altRad: altitude, azRad: azimuth };

    },

    removeAnnotations() {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      Annotation2.clearAll();
      this.clearAnnotations();
    },

    updateForDateTime() {
      if (this.syncDateTimeWithWWTCurrentTime) {
        this.setTime(this.dateTime);
      }
      this.updateFrontAnnotations(this.dateTime);
    },

    updateFrontAnnotations(_when: Date | null = null) {
      try {
        this.removeAnnotations();
      }
      finally {
        this.updateIntersection();
      }
    },

    updateGuidedContentHeight() {
      let guidedContentContainer = null as HTMLElement | null;
      let height = 0;
      this.$nextTick(() => {
        guidedContentContainer = document.getElementById('guided-content-container') as HTMLElement;
        
        if (guidedContentContainer) {
          height += guidedContentContainer.clientHeight;
        }

        this.guidedContentHeight = `${height}px`;
      });
    },
    
    onResize() {
      this.$nextTick(() => {
        this.updateGuidedContentHeight();
      });
      this.updateGuidedContentHeight();
    },

    // Positions the eclipse-percent indicator relative to the top of the
    // time controls (the toolbar's own top edge, with the speed-control
    // popup closed -- deliberately not dynamic with the popup's
    // open/closed state) and the WWT canvas (#main-content). Which of the
    // two layouts below applies depends on the canvas's own form factor
    // (its own width vs height), not the window's -- #main-content
    // doesn't necessarily share the window's aspect ratio (e.g. the
    // guided-content box eats into its effective shape).
    //
    // Canvas wider than tall: vertically centered on the canvas, with its
    // horizontal center 25% of the canvas's width in from the right edge.
    //
    // Canvas taller than wide: horizontally centered, 40% of the way from
    // the toolbar's top edge towards the canvas's vertical middle (i.e.
    // closer to the toolbar than the exact midpoint -- measuring the 40%
    // from the toolbar side, not the canvas side).
    updateEclipsedIndicatorPosition() {
      const mainContent = document.getElementById('main-content');
      const timeControlsEl = document.getElementById('tools');
      if (!mainContent || !timeControlsEl) {
        return;
      }
      const mainRect = mainContent.getBoundingClientRect();
      const controlsTop = timeControlsEl.getBoundingClientRect().top;
      const canvasMiddle = mainRect.top + mainRect.height / 2;
      const isCanvasWide = mainRect.width > mainRect.height;

      if (isCanvasWide) {
        this.eclipsedIndicatorTop = canvasMiddle - mainRect.top;
        this.eclipsedIndicatorLeft = mainRect.width * 0.75;
      } else {
        this.eclipsedIndicatorTop = controlsTop - 0.4 * (controlsTop - canvasMiddle) - mainRect.top;
        this.eclipsedIndicatorLeft = mainRect.width / 2;
      }
    },

    startTopContainerResize(event: MouseEvent | TouchEvent) {
      const container = document.getElementById('guided-content-container');
      if (!container) {
        return;
      }
      event.preventDefault();
      this.topContainerResizeStartY = 'touches' in event ? event.touches[0].clientY : event.clientY;
      this.topContainerResizeStartHeight = container.getBoundingClientRect().height;
      this.isResizingTopContainer = true;
      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';
      window.addEventListener('mousemove', this.onTopContainerResizeMove);
      window.addEventListener('mouseup', this.endTopContainerResize);
      window.addEventListener('touchmove', this.onTopContainerResizeMove, { passive: false });
      window.addEventListener('touchend', this.endTopContainerResize);
      window.addEventListener('touchcancel', this.endTopContainerResize);
      window.addEventListener('blur', this.endTopContainerResize);
    },

    onTopContainerResizeMove(event: MouseEvent | TouchEvent) {
      if (!this.isResizingTopContainer) {
        return;
      }
      // Safety net: if the mouseup/touchend was missed (e.g. released outside
      // the window), the next stray mousemove ends the drag instead of
      // continuing to resize indefinitely.
      if (event instanceof MouseEvent && event.buttons === 0) {
        this.endTopContainerResize();
        return;
      }
      event.preventDefault();
      const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
      const delta = clientY - this.topContainerResizeStartY;
      const minHeight = 150;
      const maxHeight = window.innerHeight - 100;
      this.topContainerCustomHeight = Math.min(Math.max(this.topContainerResizeStartHeight + delta, minHeight), maxHeight);
      this.updateGuidedContentHeight();
    },

    endTopContainerResize() {
      this.isResizingTopContainer = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', this.onTopContainerResizeMove);
      window.removeEventListener('mouseup', this.endTopContainerResize);
      window.removeEventListener('touchmove', this.onTopContainerResizeMove);
      window.removeEventListener('touchend', this.endTopContainerResize);
      window.removeEventListener('touchcancel', this.endTopContainerResize);
      window.removeEventListener('blur', this.endTopContainerResize);
    },

    onTopContainerResizeKeydown(event: KeyboardEvent) {
      const step = 20;
      let delta = 0;
      if (event.key === 'ArrowUp') {
        delta = -step;
      } else if (event.key === 'ArrowDown') {
        delta = step;
      } else {
        return;
      }
      event.preventDefault();
      const container = document.getElementById('guided-content-container');
      if (!container) {
        return;
      }
      const currentHeight = container.getBoundingClientRect().height;
      const minHeight = 150;
      const maxHeight = window.innerHeight - 100;
      this.topContainerCustomHeight = Math.min(Math.max(currentHeight + delta, minHeight), maxHeight);
      this.updateGuidedContentHeight();
    },

    startMapWidthResize(event: MouseEvent | TouchEvent) {
      const nonMapContainer = document.getElementById('non-map-container');
      if (!nonMapContainer) {
        return;
      }
      event.preventDefault();
      this.mapWidthResizeStartX = 'touches' in event ? event.touches[0].clientX : event.clientX;
      this.mapWidthResizeStartWidth = nonMapContainer.getBoundingClientRect().width;
      this.isResizingMapWidth = true;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      window.addEventListener('mousemove', this.onMapWidthResizeMove);
      window.addEventListener('mouseup', this.endMapWidthResize);
      window.addEventListener('touchmove', this.onMapWidthResizeMove, { passive: false });
      window.addEventListener('touchend', this.endMapWidthResize);
      window.addEventListener('touchcancel', this.endMapWidthResize);
      window.addEventListener('blur', this.endMapWidthResize);
    },

    onMapWidthResizeMove(event: MouseEvent | TouchEvent) {
      if (!this.isResizingMapWidth) {
        return;
      }
      // Safety net: if the mouseup/touchend was missed (e.g. released outside
      // the window), the next stray mousemove ends the drag instead of
      // continuing to resize indefinitely.
      if (event instanceof MouseEvent && event.buttons === 0) {
        this.endMapWidthResize();
        return;
      }
      const container = document.getElementById('guided-content-container');
      if (!container) {
        return;
      }
      event.preventDefault();
      const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
      const delta = clientX - this.mapWidthResizeStartX;
      const containerWidth = container.clientWidth;
      const minWidth = 150;
      const maxWidth = containerWidth - 150;
      const newWidth = Math.min(Math.max(this.mapWidthResizeStartWidth + delta, minWidth), maxWidth);
      this.nonMapContainerWidthPercent = (newWidth / containerWidth) * 100;
    },

    endMapWidthResize() {
      this.isResizingMapWidth = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', this.onMapWidthResizeMove);
      window.removeEventListener('mouseup', this.endMapWidthResize);
      window.removeEventListener('touchmove', this.onMapWidthResizeMove);
      window.removeEventListener('touchend', this.endMapWidthResize);
      window.removeEventListener('touchcancel', this.endMapWidthResize);
      window.removeEventListener('blur', this.endMapWidthResize);
    },

    onMapWidthResizeKeydown(event: KeyboardEvent) {
      const step = 20;
      let delta = 0;
      if (event.key === 'ArrowLeft') {
        delta = -step;
      } else if (event.key === 'ArrowRight') {
        delta = step;
      } else {
        return;
      }
      event.preventDefault();
      const nonMapContainer = document.getElementById('non-map-container');
      const container = document.getElementById('guided-content-container');
      if (!nonMapContainer || !container) {
        return;
      }
      const currentWidth = nonMapContainer.getBoundingClientRect().width;
      const containerWidth = container.clientWidth;
      const minWidth = 150;
      const maxWidth = containerWidth - 150;
      const newWidth = Math.min(Math.max(currentWidth + delta, minWidth), maxWidth);
      this.nonMapContainerWidthPercent = (newWidth / containerWidth) * 100;
    },

    startMobileNonMapHeightResize(event: MouseEvent | TouchEvent) {
      const nonMapContainer = document.getElementById('non-map-container');
      if (!nonMapContainer) {
        return;
      }
      event.preventDefault();
      this.mobileNonMapHeightResizeStartY = 'touches' in event ? event.touches[0].clientY : event.clientY;
      this.mobileNonMapHeightResizeStartHeight = nonMapContainer.getBoundingClientRect().height;
      this.isResizingMobileNonMapHeight = true;
      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';
      window.addEventListener('mousemove', this.onMobileNonMapHeightResizeMove);
      window.addEventListener('mouseup', this.endMobileNonMapHeightResize);
      window.addEventListener('touchmove', this.onMobileNonMapHeightResizeMove, { passive: false });
      window.addEventListener('touchend', this.endMobileNonMapHeightResize);
      window.addEventListener('touchcancel', this.endMobileNonMapHeightResize);
      window.addEventListener('blur', this.endMobileNonMapHeightResize);
    },

    onMobileNonMapHeightResizeMove(event: MouseEvent | TouchEvent) {
      if (!this.isResizingMobileNonMapHeight) {
        return;
      }
      // Safety net: if the mouseup/touchend was missed (e.g. released outside
      // the window), the next stray mousemove ends the drag instead of
      // continuing to resize indefinitely.
      if (event instanceof MouseEvent && event.buttons === 0) {
        this.endMobileNonMapHeightResize();
        return;
      }
      const container = document.getElementById('guided-content-container');
      if (!container) {
        return;
      }
      event.preventDefault();
      const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
      const delta = clientY - this.mobileNonMapHeightResizeStartY;
      const containerHeight = container.clientHeight;
      const minHeight = 100;
      const maxHeight = containerHeight - 100;
      const newHeight = Math.min(Math.max(this.mobileNonMapHeightResizeStartHeight + delta, minHeight), maxHeight);
      this.nonMapContainerMobileHeightPercent = (newHeight / containerHeight) * 100;
    },

    endMobileNonMapHeightResize() {
      this.isResizingMobileNonMapHeight = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', this.onMobileNonMapHeightResizeMove);
      window.removeEventListener('mouseup', this.endMobileNonMapHeightResize);
      window.removeEventListener('touchmove', this.onMobileNonMapHeightResizeMove);
      window.removeEventListener('touchend', this.endMobileNonMapHeightResize);
      window.removeEventListener('touchcancel', this.endMobileNonMapHeightResize);
      window.removeEventListener('blur', this.endMobileNonMapHeightResize);
    },

    onMobileNonMapHeightResizeKeydown(event: KeyboardEvent) {
      const step = 20;
      let delta = 0;
      if (event.key === 'ArrowUp') {
        delta = -step;
      } else if (event.key === 'ArrowDown') {
        delta = step;
      } else {
        return;
      }
      event.preventDefault();
      const nonMapContainer = document.getElementById('non-map-container');
      const container = document.getElementById('guided-content-container');
      if (!nonMapContainer || !container) {
        return;
      }
      const currentHeight = nonMapContainer.getBoundingClientRect().height;
      const containerHeight = container.clientHeight;
      const minHeight = 100;
      const maxHeight = containerHeight - 100;
      const newHeight = Math.min(Math.max(currentHeight + delta, minHeight), maxHeight);
      this.nonMapContainerMobileHeightPercent = (newHeight / containerHeight) * 100;
    },

    startHorizonMode() {
      this.wwtSettings.set_localHorizonMode(true);
      this.showAltAzGrid = false;
      this.skyColor = this.skyColorLight;
      this.showHorizon = true; // automatically calls its watcher and updates horizon
      this.horizonOpacity = 1;
      this.sunPlace.set_zoomLevel(20);
      this.gotoTarget({
        place: this.sunPlace,
        instant: true,
        noZoom: false,
        trackObject: this.toggleTrackSun
      });
      this.playbackRate = this.horizonRate;
      return;
    },
  
    getSunAltitudeAtTime(time: Date): { altRad: number; azRad: number; } {
      const sunAltAz = this.equatorialToHorizontal(this.sunPosition.raRad, this.sunPosition.decRad, this.location.latitudeRad, this.location.longitudeRad, time);
      return sunAltAz;
    },

    // function that finds at what time the sun will reach a given altitude during the current day to within 15 minutes
    getTimeforSunAlt(altDeg: number): { rising: number | null; setting: number | null; } {
      // takes about 45ms to run
      // search for time when sun is at given altitude
      // start at 12:00am and search every MINUTES_PER_INTERVAL
      const minTime = this.selectedTime - (this.selectedTime % MILLISECONDS_PER_DAY) - this.selectedTimezoneOffset;
      const maxTime = minTime + MILLISECONDS_PER_DAY;
      let time = minTime;
      let sunAlt = this.getSunAltitudeAtTime(new Date(time)).altRad; // negative
      // find the two times it crosses the given altitude
      while ((sunAlt < altDeg * D2R) && (time < maxTime)) {
        time += MILLISECONDS_PER_INTERVAL;
        sunAlt = this.getSunAltitudeAtTime(new Date(time)).altRad;
      }
      const rising = time == maxTime ? null : time;
      while ((sunAlt > altDeg * D2R) && (time < maxTime)) {
        time += MILLISECONDS_PER_INTERVAL;
        sunAlt = this.getSunAltitudeAtTime(new Date(time)).altRad;
      }
      const setting = time == maxTime ? null : time;
      
      return {
        'rising': (rising !== null && setting !== null) ? Math.min(rising, setting) : rising,
        'setting': (rising !== null && setting !== null) ? Math.max(rising, setting) : setting
      };
    }, 
    
    setTimeforSunAlt(altDeg: number) {
      const out = this.getTimeforSunAlt(altDeg);
      if (out.rising == null && out.setting == null) {
        return;
      }

      function matchTime(time: number | null, times: number[]) {
        if (time === null) {
          return -1;
        }
        const dt = time - times[0];
        return times[0] + dt - (dt % MILLISECONDS_PER_INTERVAL);
      }

      const risingTime = matchTime(out.rising, this.times);
      const settingTime = matchTime(out.setting, this.times);
      if (this.times.includes(risingTime)) {
        this.selectedTime = risingTime;
      } else if (this.times.includes(settingTime)) {
        this.selectedTime = settingTime;
      } else {
        console.log("time not in times array");
        // best to leave it alone so it doesn't jump around
      }
      

    },

    updateSkyOpacityForSunAlt(altRad: number) {
      const _civilTwilight = -6 * D2R;
      const astronomicalTwilight = 3 * _civilTwilight;
      
      const sunAlt = altRad;
      let dssOpacity = 0;
      this.skyOpacity = (1 + Math.atan(Math.PI * sunAlt / (-astronomicalTwilight))) / 2;
      let frac = this.currentFractionEclipsed;
      if (this.locationInTotality && !this.inEclipse) {
        frac = frac > 0.98 ? 0.98 : frac;
      }
      this.skyOpacity = this.skyOpacity * (1 - 0.5 * Math.pow(Math.E,-Math.pow((frac -1),2)/(0.001)));
      dssOpacity = sunAlt > 0 ? 0 : 1 - (1 + Math.atan(Math.PI * sunAlt / (-astronomicalTwilight))) / 2;
    
      this.updateMoonTexture();

      this.setForegroundOpacity(dssOpacity * 100);
    },

  
    copyShareURL() {
      const baseURL = `${window.location.origin}${window.location.pathname}`;
      const url = `${baseURL}?lat=${this.locationDeg.latitudeDeg}&lon=${this.locationDeg.longitudeDeg}`;
      navigator.clipboard
        .writeText(url)
        .then(() =>
          this.$notify({
            group: "copy-url",
            type: "success",
            text: "URL copied to clipboard. Paste to share with friends!",
            duration: 5000,
            ignoreDuplicates: true
          })
        )
        .catch((_err) =>
          this.$notify({
            group: "copy-url",
            type: "error",
            text: "Failed to copy URL",
            duration: 5000,
            ignoreDuplicates: true
          })
        );
    },

    getCloudCover(lat: number, lon: number): number | null {
      const d = this.rectangleDegrees;
      console.log(d, maxLat, minLon, lat, lon);
      const row = Math.round((maxLat - lat) / d);
      const col = Math.round((lon - minLon) / d);
      console.log(row, col);
      if (row < 0 || row >= cloudData.length || col < 0 || col >= cloudData[0].length) {
        return null;
      }
      return cloudData[row][col];
    },
    
    getEclipsePrediction() {
      const eclipsePrediction = recalculateForObserverUTC(this.locationDeg.latitudeDeg, this.locationDeg.longitudeDeg, 100);
      this.eclipsePrediction = eclipsePrediction[0];
      if (this.eclipsePrediction.centralStart[0]) {
        this.eclipseStart = this.eclipsePrediction.centralStart[0].getTime();
      } else if (this.eclipsePrediction.partialStart[0]) {
        this.eclipseStart = this.eclipsePrediction.partialStart[0].getTime();
      } else {
        this.eclipseStart = null;
      }
      
      if (this.eclipsePrediction.centralEnd[0]) {
        this.eclipseEnd = this.eclipsePrediction.centralEnd[0].getTime();
      } else if (this.eclipsePrediction.partialEnd[0]) {
        this.eclipseEnd = this.eclipsePrediction.partialEnd[0].getTime();
      } else {
        this.eclipseEnd = null;
      }
      
      // this means there is not eclipse at this location
      if (this.eclipsePrediction.maxTime[0]) {
        this.eclipseMid = this.eclipsePrediction.maxTime[0].getTime();
      } else {
        this.eclipseMid = null;
      }
      
      switch (this.eclipsePrediction.type) {
      case "T":
        this.eclipseType = "Total";
        break;
      case "A":
        this.eclipseType = "Annular";
        break;
      case "P":
        this.eclipseType = "Partial";
        break;
      default:
        this.eclipseType = "None";
      }
      
      return eclipsePrediction;
      
    },

    findBestFeature(collection: MapBoxFeatureCollection): MapBoxFeature | null {
      const relevantFeatures = collection.features.filter(feature => RELEVANT_FEATURE_TYPES.some(type => feature.place_type.includes(type)));
      const placeFeature = relevantFeatures.find(feature => feature.place_type.includes("place")) ?? (relevantFeatures.find(feature => feature.place_type.includes("postcode")) ?? undefined);
      if (placeFeature !== undefined) {
        return placeFeature;
      }
      const regionFeature = relevantFeatures.find(feature => feature.place_type.includes("region"));
      if (regionFeature !== undefined) {
        return regionFeature;
      }
      const countryFeature = relevantFeatures.find(feature => feature.place_type.includes("country"));
      if (countryFeature !== undefined) {
        return countryFeature;
      }
      return null;
    },

    textForMapboxFeature(feature: MapBoxFeature): string {
      const pieces: string[] = [];
      if (feature.text) {
        pieces.push(feature.text);
      }
      feature.context.forEach(item => {
        const itemType = item.id.split(".")[0];
        if (!RELEVANT_FEATURE_TYPES.includes(itemType)) {
          return;
        }
        let text = null as string | null;
        const shortCode = item.short_code;
        if (itemType === "region" && shortCode != null) {
          if (NA_ABBREVIATIONS.some(abbr => shortCode.startsWith(abbr))) {
            text = shortCode.substring(3);
          }
        } else if (itemType === "country") {
          const itemText = item.text;
          if (!NA_COUNTRIES.includes(itemText)) {
            text = itemText; 
          }
        }
        if (text !== null) {
          pieces.push(text);
        }
      });
      return pieces.join(", ");
    },

    textForMapboxResults(results: MapBoxFeatureCollection): string {
      const feature = this.findBestFeature(results);
      if (feature === null) {
        return "";
      }
      return this.textForMapboxFeature(feature);
    },
    
    async textForLocation(longitudeDeg: number, latitudeDeg: number): Promise<string> {
      const accessToken = process.env.VUE_APP_MAPBOX_ACCESS_TOKEN;
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitudeDeg},${latitudeDeg}.json?access_token=${accessToken}`;
      const mapBoxText = await fetch(url)
        .then(response => response.json())
        .then((result: MapBoxFeatureCollection) => {
          if (result.features.length === 0) {
            return null;
          }
          return this.textForMapboxResults(result);
        })
        .catch((_err) => {
          this.searchErrorMessage = "An error occurred while searching";
        });
      if (mapBoxText) {
        return mapBoxText;
      } else {
        const ns = this.locationDeg.latitudeDeg >= 0 ? 'N' : 'S';
        const ew = this.locationDeg.longitudeDeg >= 0 ? 'E' : 'W';
        const lat = Math.abs(this.locationDeg.latitudeDeg).toFixed(3);
        const lon = Math.abs(this.locationDeg.longitudeDeg).toFixed(3);
        return `${lat}° ${ns}\n${lon}° ${ew}`;
      }
    },

    async geocodingInfoForSearch(searchText: string): Promise<MapBoxFeatureCollection | null> {
      const accessToken = process.env.VUE_APP_MAPBOX_ACCESS_TOKEN;
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${searchText}.json?access_token=${accessToken}&types=place,postcode`;
      return fetch(url)
        .then(response => response.json())
        .then((result: MapBoxFeatureCollection) => {
          return result;
        })
        .catch((_err) => null);
    },
    

    setLocationFromFeature(feature: MapBoxFeature) {
      this.locationDeg = { longitudeDeg: feature.center[0], latitudeDeg: feature.center[1] };
      this.textForLocation(feature.center[0], feature.center[1]).then((text) => {
        this.selectedLocationText = text;
      });
    },

    setLocationFromSearchFeature(feature: MapBoxFeature) {
      this.setLocationFromFeature(feature);
      this.textSearchSelectedLocations.push(feature.center);
      if (this.showNewMobileUI) {
        setTimeout(() => {
          this.searchOpen = false;
        },3_000);
      }
    },
    
    clampPlaybackRate(val: number): number {
      const minSpeed = 1;
      const maxSpeed = this.maxPlaybackRate;
      return Math.min(Math.max(val, minSpeed), maxSpeed);
    },

    reversePlaybackRate() {
      this.forceRate = false;
      this.playbackRate = -this.playbackRate;
    },

    decreasePlaybackRate() {
      this.forceRate = false;
      const sign = Math.sign(this.playbackRate);
      const abs = Math.abs(this.playbackRate);
      this.playbackRate = sign * this.clampPlaybackRate(abs / 5);
    },

    increasePlaybackRate() {
      this.forceRate = false;
      const sign = Math.sign(this.playbackRate);
      const abs = Math.abs(this.playbackRate);
      this.playbackRate = sign * this.clampPlaybackRate(abs * 5);
    },
    
    async updateSelectedLocationText() {
      this.selectedLocationText = await this.textForLocation(this.locationDeg.longitudeDeg, this.locationDeg.latitudeDeg);
    },

    niceRound(val: number) {
      return val.toFixed(0);
    },

    // Default layout state for each of the two responsive modes: the
    // wide/detailed UI (narrow === false) and the narrow/streamlined UI
    // (narrow === true). Called at mount and whenever the viewport crosses the
    // responsive boundary, so each mode always starts from its intended layout
    // (guided content + wide book icon, location search, and controls) instead
    // of inheriting the other mode's state.
    applyLayoutDefaults(narrow: boolean) {
      // Search starts open on both mobile and desktop -- there's no close
      // X on it (closing it back up is a deliberate action, not a default
      // state), so there's no reason to hide it up front.
      this.searchOpen = true;
      // Controls panel starts closed on both mobile and desktop now --
      // it opens under the top-right button cluster on demand instead.
      this.showControls = false;
      this.showGuidedContent = !narrow;
    }
  },

  watch: {

    playingWaitCount(val: number, old: number) {
      console.log(`Playing wait count: ${old} ---> ${val}`);
    },

    // guidedContentHeight changes on every path that can resize
    // #main-content (window resize, dragging the resize handle, toggling
    // guided content) -- should reposition the eclipse-percent indicator.
    guidedContentHeight() {
      this.$nextTick(() => this.updateEclipsedIndicatorPosition());
    },

    showNewMobileUI(narrow: boolean) {
      // showNewMobileUI is driven by `narrow`, so this fires whenever the
      // viewport crosses the 600px boundary. Apply the default layout for the
      // mode we just entered — the same defaults used at mount — so the book
      // icon, guided content, location search, etc. don't get stuck in a state
      // that belongs to the other layout.
      this.applyLayoutDefaults(narrow);
    },

    showGuidedContent(show: boolean) {
      this.onResize();
      this.$nextTick(() => {
        this.onScroll();
      });
      if (show) {
        if (this.narrow) {
          this.pauseForOverlay();
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this.$refs.showGuidedContent as any).tooltip = false;
        const element = document.activeElement;
        if (element && element.id === "show-guided-content-button") {
          (element as HTMLElement).blur();
        }
      } else if (this.narrow) {
        this.playForOverlay();
      }
    },
    
    responseOptOut(optOut: boolean) {
      window.localStorage.setItem(OPT_OUT_KEY, String(optOut));
      if (optOut) {
        this.ratingOptOut = true;
        this.clearQuestionTimeout();
      }
    },

    ratingOptOut(optOut: boolean) {
      window.localStorage.setItem(RATING_OPT_OUT_KEY, String(optOut));
      if (optOut) {
        this.clearQuestionTimeout();
      }
    },

    inIntro(value: boolean) {
      if (!value) {
        this.playing = true;
        if (!this.showSplashScreen && this.responseOptOut === null) {
          this.showPrivacyDialog = true;
        }
      }
    },

    showAltAzGrid(show: boolean) {
      this.wwtSettings.set_showAltAzGrid(show);
      this.wwtSettings.set_showAltAzGridText(show);
    },

    showHorizon(_show: boolean) {
      this.updateFrontAnnotations();
      this.updateMoonTexture();
    },

    showSky(_show: boolean) {
      this.updateFrontAnnotations();
      this.updateMoonTexture();
    },

    wwtZoomDeg(_zoom: number, _oldZoom: number) {
      this.updateIntersection();
    },

    useRegularMoon(_show: boolean) {
      this.updateMoonTexture();
      this.updateFrontAnnotations(this.dateTime);
    },

    dateTime(_date: Date) {
      this.updateForDateTime();
    },

    nearTotality(near: boolean, oldNear: boolean) {
      if (near) {
        this.forceRate = (Math.abs(this.playbackRate) > 10) && this.playing;
      }
      
      // if leaving eclipse reset speed to previous
      if (oldNear && !near) {
        this.forceRate = false;
      }
    },


    wwtCurrentTime(time: Date) {
      
      if (this.forceRate && !this.nearTotality && (this.eclipsePhase === 'after' || this.eclipsePhase === 'before')) {
        this.forceRate = false;
      }

      if (time.getTime() >= this.maxTime || time.getTime() < this.minTime) {
        if (this.playing) {
          this.playing = false;
          this.selectedTime = this.minTime;
        }
        
        return;
      }
      this.updateFrontAnnotations(time);
    },

    learnerPath(path: LearnerPath) {
      if (!this.visitedCloudCover && ((path === "Clouds") || (path === "CloudDetail"))) {
        this.cloudCoverSelectedLocations.push([this.locationDeg.longitudeDeg, this.locationDeg.latitudeDeg]);
        this.cloudCoverSelectedCount += 1;
        this.visitedCloudCover = true;
      }
    },

    location(loc: LocationRad, oldLoc: LocationRad) {
      const locationDeg: [number, number] = [R2D * loc.latitudeRad, R2D * loc.longitudeRad];
      
      if (oldLoc.latitudeRad * loc.latitudeRad < 0) {
        Grids._altAzTextBatch = null;
      }

      this.selectedTimezone = tzlookup(...locationDeg);
      this.playing = false;
      this.updateWWTLocation();

      // We need to let the location update before we redraw the horizon and overlay
      // Not a huge fan of having to do this, but we really need a frame render to update e.g. sun/moon positions
      this.wwtControl.renderOneFrame();
      this.getEclipsePrediction();
      this.updateFrontAnnotations();
    },

    playing(play: boolean) {
      console.log(`${play ? 'Playing:' : 'Stopping:'} at ${this.playbackRate}x real time`);
      this.setClockSync(play);
      
      if (this.nearTotality && play) {
        this.forceRate = (Math.abs(this.playbackRate) > 10);
      }
      
    },

    showSplashScreen(val: boolean) {
      if (!val) {
        if (this.dontShowIntro) {
          return;
        }
        this.introSlide = 1;
        this.inIntro = true;
      }
    },

    dontShowIntro(val: boolean) {
      window.localStorage.setItem(DONT_SHOW_INTRO_KEY, val.toString());
    },

    showInfoSheet(show: boolean) {
      // Keep track of how long the user has the Information/User Guide
      // dialog open, split between whichever tab is active.
      if (show) {
        this.infoTab = 0;
        this.infoStartTimestamp = Date.now();
        this.pauseForOverlay();
      } else {
        const now = Date.now();
        if (this.infoStartTimestamp !== null) {
          this.infoTimeMs += (now - this.infoStartTimestamp);
          this.infoStartTimestamp = null;
        }
        if (this.userGuideStartTimestamp !== null) {
          this.userGuideTimeMs += (now - this.userGuideStartTimestamp);
          this.userGuideStartTimestamp = null;
        }
        this.playForOverlay();
      }
    },

    infoTab(tab: number) {
      if (!this.showInfoSheet) {
        return;
      }
      const now = Date.now();
      if (this.infoStartTimestamp !== null) {
        this.infoTimeMs += (now - this.infoStartTimestamp);
        this.infoStartTimestamp = null;
      }
      if (this.userGuideStartTimestamp !== null) {
        this.userGuideTimeMs += (now - this.userGuideStartTimestamp);
        this.userGuideStartTimestamp = null;
      }
      if (tab === 0) {
        this.infoStartTimestamp = now;
      } else {
        this.userGuideStartTimestamp = now;
      }
    },

    showAdvancedWeather(show: boolean) {
      if (show) {
        this.weatherStartTimestamp = Date.now();
        this.pauseForOverlay();
      } else if (this.weatherStartTimestamp !== null) {
        this.weatherTimeMs += (Date.now() - this.weatherStartTimestamp);
        this.weatherStartTimestamp = null;
      }
      
      if (!show) {
        this.playForOverlay();
      }
    },

    showEclipsePredictionSheet(show: boolean) {
      if (show) {
        this.pauseForOverlay();
        this.eclipseTimerStartTimestamp = Date.now();
      } else if (this.eclipseTimerStartTimestamp !== null) {
        this.eclipseTimerTimeMs += (Date.now() - this.eclipseTimerStartTimestamp);
        this.eclipseTimerStartTimestamp = null;
      }
      
      if (!show) {
        this.playForOverlay();
      }
    },

    showForecastSheet(show: boolean) {
      if (show) {
        this.pauseForOverlay();
        this.forecastInfoStartTimestamp = Date.now();
      } else if (this.forecastInfoStartTimestamp !== null) {
        this.forecastInfoTimeMs += (Date.now() - this.forecastInfoStartTimestamp);
        this.forecastInfoStartTimestamp = null;
      }

      if (!show) {
        this.playForOverlay();
      }

    },

    weatherInfoOpen(open: boolean) {
      if (open) {
        this.weatherInfoStartTimestamp = Date.now();
        this.pauseForOverlay();
      } else if (this.weatherInfoStartTimestamp !== null) {
        this.weatherInfoTimeMs += (Date.now() - this.weatherInfoStartTimestamp);
        this.weatherInfoStartTimestamp = null;
      }
      
      if (!open) {
        this.playForOverlay();
      }
    },
    
    showPrivacyDialog(show: boolean) {
      if (show) {
        this.pauseForOverlay();
      } else {
        this.playForOverlay();
      }
    },
    
    introSlide(val: number) {
      this.inIntro = val < 3;
      return;
    },

    viewerMode(mode: ViewerMode) {
      if (mode === 'Horizon') {
        this.startHorizonMode();
      } 
      this.updateSkyOpacityForSunAlt(this.sunPosition.altRad);
      this.updateMoonTexture();
    },

    skyColor(_color: string) {
      this.updateFrontAnnotations();
    },

    sunAboveHorizon(isAbove: boolean) {
      this.horizonOpacity = isAbove ? 1 : 0.85;
    },

    sunPosition(pos: EquatorialRad & HorizontalRad) {

      this.updateSkyOpacityForSunAlt(pos.altRad);
      return;
    },
    
    currentFractionEclipsed(_frac: number) {
      this.updateSkyOpacityForSunAlt(this.sunPosition.altRad);
      this.updateFrontAnnotations();
    },

    toggleTrackSun(val: boolean) {
      this.updatePan();
      if (val) {
        this.trackSun();
      } else {
        const currentPlace = new Place();
        currentPlace.set_RA(this.wwtRARad * R2D / 15);
        currentPlace.set_dec(this.wwtDecRad * R2D);
        this.gotoTarget({
          place: currentPlace,
          instant: true,
          noZoom: true,
          trackObject: false
        });
        return;
      }
    },

    playbackRate(val: number) {
      if (Math.abs(val) > 11_000) {
        console.warn('playbackRate too high, setting to maxPlaybackRate');
        this.playbackRate = Math.sign(val) * this.maxPlaybackRate;
      }
      
      this.setClockRate(val === 1 ? 1 : val - 1 + 0.000000001 );
    },
    

  },
});
</script>


<!-------------------------  STYLE ----------------------------->
<style lang="less">
@font-face {
  font-family: "Highway Gothic Narrow";
  src: url("./assets/HighwayGothicNarrow.ttf");
}

:root {
  --default-font-size: clamp(0.8rem, min(1.7vh, 1.7vw), 1rem);
  --default-line-height: clamp(1rem, min(2.2vh, 2.2vw), 1.6rem);
  --time-content-max-width: 700px;
}

// From Sara Soueidan (https://www.sarasoueidan.com/blog/focus-indicators/) & Erik Kroes (https://www.erikkroes.nl/blog/the-universal-focus-state/)
// checkbox will only get oreo styling when user tabs by keyboard.
:focus-visible, .v-checkbox .v-selection-control__input:has(:focus-visible) {
  outline: 9px double white !important;
  box-shadow: 0 0 0 6px black !important;
  border-radius: .125rem;
}

// :focus-visible's own browser heuristic carves out an exception for
// text inputs/textareas: unlike buttons, they're treated as
// "focus-visible" even when focused via a plain mouse click or tap (the
// reasoning being that you need to see your cursor to type) -- so the
// oreo ring above still shows up there on click, unlike everywhere else.
// #keyboard-focus-only (toggled in mounted()/methods below, tracking
// Tab presses vs mouse/touch) overrides that carve-out so text fields
// behave the same as every other oreo-styled element: keyboard only.
body:not(.keyboard-focus-only) input:focus-visible,
body:not(.keyboard-focus-only) textarea:focus-visible {
  outline: none !important;
  box-shadow: none !important;
}

// @cosmicds/vue-toolkit's icon-button bakes in its own pre-oreo focus
// styling: plain (not focus-visible) rules that swap color/border-color
// to --focus-color and, while active, the box-shadow to --focus-shadow --
// e.g. one button binds --focus-color to a leftover blue "skyColor",
// making it flash blue on focus. Neutralize both so the oreo ring above
// is the only focus indicator icon-wrapper buttons show.
.icon-wrapper:focus {
  color: var(--color) !important;
  border-color: var(--color) !important;
}

.icon-wrapper.active:focus {
  box-shadow: 0 0 10px 3px var(--active-shadow) !important;
}
 g
#text-bottom-sheet .v-overlay__content:focus-visible,
#intro-dialog .v-overlay__content:focus-visible,
#intro-overlay-mobile .v-overlay__content:focus-visible {
  outline: none !important;
  box-shadow: none !important;
}

.thin-scrollbar() {
  overflow-y: auto;
  scrollbar-gutter: stable;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.25) transparent;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.25);
    border-radius: 3px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background-color: rgba(255, 255, 255, 0.4);
  }
}

html {
  height: 100%;
  margin: 0;
  padding: 0;
  background-color: #000;
  
  overflow: hidden;
  overflow-y: hidden !important; 
  -ms-overflow-style: none;

  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
}

body {
  position: fixed;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;

  font-family: Verdana, Arial, Helvetica, sans-serif;
  font-size: var(--default-font-size);
}

.leaflet-grab {
      cursor: cell;
    }
    
.leaflet-dragging .leaflet-grab {
  cursor: all-scroll;
}

.v-chip {
  border: none;
  color: blue;
  background-color: white;
  opacity: 1;
  padding: 0.5em;
}  


#main-content {
  position: relative;
  width: 100%;
  height: calc(var(--app-content-height) - var(--top-content-height) - 1px);
  overflow: hidden;
  .icon-wrapper {
    -webkit-user-select:none;
    -moz-user-select:none;
    user-select: none;
  }


  #center-page-banner {
    position: absolute;
    width: 25%;
    top: 50%;
    transform: translateY(-50%);
    z-index: 100;
    pointer-events: none;
    
    margin-left: 1rem;
    
    padding-block: 0.7rem;
    padding-inline: 1rem;
    background-color: rgba(0, 0, 0, 0.7);
    font-size: calc(1.5 * var(--default-font-size));
    font-weight: bold;
    color: #888888;
    text-align: center;
    border-radius: var(--normal-border-radius);

    @media (max-width: 600px) {
      width: 35%;
      top: 65%;
      margin-left: 3%;
      padding-block: 2%;
      padding-inline: 3%;
      font-size: calc(1.2 * var(--default-font-size));
    }

    @media (orientation: landscape) {
      top: 50%;
      margin-left: 8%;
      font-size: calc(1.1 * var(--default-font-size));
    }
    
  }
  
}

#app {
  width: 100%;
  height: 100%;
  margin: 0;
  overflow: hidden;
  position: relative;

  .wwtelescope-component {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    margin: 0;
    padding: 0;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}

.modal {
  position: absolute;
  top: 0px;
  left: 0px;
  width: 100%;
  height: 100%;
  z-index: 100;
  color: #fff;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
}

#modal-loading {
  background-color: #000;
  .container {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    .spinner {
      background-image: url("https://projects.cosmicds.cfa.harvard.edu/cds-website/misc/lunar_loader.gif");
      background-repeat: no-repeat;
      background-size: contain;
      width: 3rem;
      height: 3rem;
    }
    p {
      margin: 0 0 0 1rem;
      padding: 0;
      font-size: 150%;
    }
  }
}

#left-buttons-wrapper {
  position: absolute;
  left: 1rem;
  display: flex;
  flex-direction: column;
  gap: 5px;
  width: fit-content;
  align-items: flex-start;

  @media (max-width: 599px) {
    top: 2.5rem;
  }

  @media (min-width: 600px) {
    top: 0.7rem;
  }

  &.budge {
    left: 0.5rem;

    @media (max-width: 599px) {
      top: calc(var(--default-font-size) + 1px);
    }

    @media (min-width: 600px) {
      top: 4.3rem;
    }
  }

  #location-date-display {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;

    @media (max-width: 250px) {
      padding-top: 3.5em;
    }
  }

  #location-secondary-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 5px;
  }

  #location-status-box {
    pointer-events: auto;

    &.non-interactive {
      pointer-events: none;
    }

    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(6px);
    color: white;
    border: 2px solid var(--accent-color);
    border-radius: var(--tight-border-radius);
    padding: 0.5rem;
    font-size: calc(0.9 * var(--default-font-size));
    text-align: center;
    width: 10rem;
    max-width: 70vw;
    transition: border-color 0.2s ease;

    @media (max-width: 600px) {
      width: 9rem;
    }

    &:not(.non-interactive):hover {
      border-color: color-mix(in srgb, var(--accent-color) 70%, black);
    }

    .location-status-name {
      font-size: calc(0.95 * var(--default-font-size));
      margin-bottom: 0.25rem;
      white-space: pre-line;
    }

    .eclipse-status-line {
      white-space: pre-line;
      margin-block: 0.25rem;
    }
  }

  pointer-events: auto;
}



#location-progress {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  left: 2.5rem;


}


.url-notification {
  margin-top: 45vh;
  border-radius: 5px;
  font-size: calc(1.1 * var(--default-font-size));
  padding: 1em;

  &.success {
    background-color: #9a009a;
  }
  &.error {
    background-color: #b30000;
  }
}

.bottom-content {
  display: flex;
  flex-direction: column;
  position: absolute;
  top: auto;
  bottom: 1rem;
  right: 0.5rem;
  width: calc(100% - 1rem);
  pointer-events: none;
  align-items: flex-end;
  gap: 10px;
  // outline: 1px solid lime;
}

#tools {
  z-index: 10;
  color: #fff;
  width: 100%;
  gap: 5px;

  select {
    background: white;
    color: black;
    border-radius: 3px;
  }
}

#set-time-now-button {
  // position: absolute;
  // bottom: 15%;
  // left: 5%;
  margin-left: 3%;
  background-color: black !important;
  pointer-events: auto;
  border: solid 2px;
}

.tool-container {
  display: flex;
  width: 99%;
  flex-direction: row;
  align-items: center;
  gap: 5px;
  pointer-events: auto;
  
  @media (max-width: 600px) {
    flex-direction: column;
    align-items: stretch;
  }
}

#controls {
  display: flex;
  pointer-events: auto;
}

#control-checkboxes {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-self: flex-end;
  padding: 0.5em;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(6px);
  border-radius: var(--tight-border-radius);
  border: solid 1px var(--accent-color);
  pointer-events: auto;

  .v-label {
    color: var(--accent-color);
    opacity: 1;
    font-size: var(--default-font-size);
    padding-left: 0.5rem;
  }

  .v-checkbox .v-selection-control {
    font-size: calc(1.1 * var(--default-font-size));
    height: calc(1.5 * var(--default-line-height));
    min-height: calc(1.2 * var(--default-line-height));
  }

  .v-checkbox .v-selection-control__input {
    width: calc(1.2 * var(--default-line-height));
    height: calc(1.2 * var(--default-line-height));
  }

  .v-checkbox .v-selection-control__wrapper {
    width: calc(1.2 * var(--default-line-height));
    height: calc(1.2 * var(--default-line-height));
  }

  .v-btn {
    align-self: center;
    padding-left: 5px;
    padding-right: 5px;
    border: solid 1px #899499;

    &:focus {
      border: 2px solid white;
    }
  }

  .v-btn__content {
    color: black;
    font-weight: 900;
    white-space: break-spaces;
    width: 150px;
  }
}

#text-credits {
  margin-block: 1rem;
  width: 100%;
  color: #ddd;
  font-size: calc(1.1 * var(--default-font-size));
  line-height: calc(1.1 * var(--default-line-height));
  display: flex;
  flex-direction: column;
  text-align: left;

  h4 {
    margin-top: 0.6rem;
    margin-bottom: 0.3rem;
  }
}

#splash-overlay {
  align-items: center;
  justify-content: center;
  font-size: min(8vw, 7vh);
  
  &.new-mobile-ui {
    font-size: clamp(10px,min(8vw, 7vh), 45px);
  }
}

#splash-screen {
  color: var(--moon-color);

  @media (max-width: 699px) {
    max-height: 90vh;
    max-width: 90vw;
  }

  @media (min-width: 700px) {
    max-height: 90vh;
    max-width: min(90vw, 800px);
  }

  background-color: black;
  backdrop-filter: blur(5px);
  justify-content: space-around;
  align-content: center;
  padding-top: 4vh;
  padding-bottom: 1vh;

  border-radius: 10%;
  border: min(1.2vw, 0.9vh) solid var(--accent-color);
  overflow: auto;
  font-family: 'Highway Gothic Narrow', 'Roboto', sans-serif;

  div {
    margin-inline: auto;
    text-align: center;
  }
  // make a paragraph inside the div centered horizontally and vertically
  p {
    font-family: 'Highway Gothic Narrow', 'Roboto', sans-serif;
    font-weight: normal;
    vertical-align: middle;
  }
    
  p.highlight {
    color: var(--accent-color);
    text-transform: uppercase;
    font-weight: bolder;

    @media (max-width: 750px) {
      font-weight: bold;
    }
  }

  span.highlight {
    color: var(--accent-color);
    font-weight: bold;
  }
  
  p.small {
    font-size: var(--default-font-size);
    font-weight: bold;
  }

  #first-splash-row {
    width: 100%;
  }

  #close-splash-button {
    position: absolute;
    top: 0.5rem;
    right: 1.75rem;
    color: var(--accent-color-2);
    font-size: min(8vw, 5vh);
    width: 1em;
    height: 1em;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      cursor: pointer;
    }
  }

  #splash-screen-text {
    // in the grid, the text is in the 2nd column
    display: flex;
    flex-direction: column;
    line-height: 110%;
    margin-inline: 5%;

    @media (max-width: 600px) {
      line-height: 125%;
    }
  }

  .splash-get-started {
    border: 2px solid white;
    font-size: calc(1.8 * var(--default-font-size));
    margin-top: 5%;
    margin-bottom: 2%;
    font-weight: bold !important;
  }

  .splash-small-text {
    margin-top: 5%;
    font-size: calc(1.4*var(--default-font-size));    
    font-weight: 300;
  }

  #splash-screen-acknowledgements {
    margin-bottom: 5%;
    font-size: calc(1.4 * var(--default-font-size));
    line-height: calc(1.2 * var(--default-line-height));
    width: 80%; 
  }

  img.eclipse-ds-logo {
    height: 20vmin;
    margin-bottom: 2px;
  }
}

#text-bottom-sheet {
  z-index: 9999 !important;
}

.bottom-sheet {

  #learn-more-content{
    display: flex;

    @media (max-width: 959px ) {
      flex-direction: column;
    }

    @media (min-width: 960px ) {
      flex-direction: row;
    }

  }

  #info-text-box {
    font-size: var(--default-font-size);
    line-height: var(--default-line-height);

    @media (min-width: 960px ) {
      min-width: 50%;
      padding-right: 1em;
    }
  }
  #main-info-text {
    padding-inline: 0.5em;
    p {
      margin-bottom: 0.5em;
    }
  }

  #safety-warning{
    margin-top: 0.4em;
    font-weight: bold;
    color: var(--accent-color);
    font-size: calc(1.2 * var(--default-font-size));
    line-height: calc(1.2 * var(--default-line-height));
  }
  
  #FAQ{
    margin-top: 1em;

    details {
      padding-block: 0.7em;
      padding-inline: 1.2em;
      height: fit-content;
      background-color: #38464f;
      
      summary {
        font-weight: bold;
        cursor: pointer;
      }
      
      p, div.p {
        padding-top: 0.5em;
        padding-inline: 1em;
      }
    
    }
  }
  
  
  figure {
    // make it stick in the viewport
    position: sticky;
    height: 100%;
    padding-top: 1em;

    @media (max-width: 960px ) {
      width: 100%;
    }

    @media (min-width: 960px ) {
      width: 50%;
    }

    flex-shrink: 0;
    top: 0;
    margin-top: 1em;

    figcaption{
      bottom: -2em;
      right: 0;
      font-size: calc(0.8 * var(--default-font-size));
      line-height: calc(0.8 * var(--default-line-height));
      background-color: rgba(0, 0, 0, .33);
      padding-inline: 10px 5px;
    }
    
    .disclaimer {
      position: absolute;
      font-size: calc(0.8 * var(--default-font-size));
      top: 2em;
      right: 1em;
      font-weight: bold;
    }
    
  }
  
  .v-overlay__content {
    align-self: center;
    padding: unset;
    margin: unset;

    @media (max-width: 400px) {
      width: calc(100% - 16px) !important;
      max-width: calc(100% - 16px) !important;
    }
  }

  .bottom-sheet-card {
    height: fit-content;
    width: 100%;

    align-self: center;
    border: 1px solid var(--accent-color-2);
    border-bottom: solid #212121 0.5em;
  }

  #tabs {
    width: calc(100% - 3em - 12px);
    margin: 12px 0 12px 12px;
    align-self: left;
    position: relative;
    z-index: 1;
    overflow: visible !important;

    .v-slide-group__container {
      overflow: visible !important;
      contain: none !important;
    }

    .v-slide-group__content {
      gap: 0.5em;
    }

    .info-tabs {
      min-width: 0;
      padding-inline: 0.5em;
      flex: 0 1 auto;

      h3 {
        margin: 0;
        font-size: calc(1.05 * var(--default-font-size));
        white-space: nowrap;
      }
    }
  }

  .v-card-text {
    height: 40vh;
  }

  .scrollable {
    overflow-y: auto;
  }

  .no-bottom-border-radius {
    // border-bottom-left-radius: 0px !important;
    // border-bottom-right-radius: 0px !important;
    width: auto;
    height: fit-content;
    max-height: 50vh;
    
    @media (max-width: 700px ) {
      max-height: 70vh;
    }
    
  }
  

  // This prevents the tabs from having some extra space to the left when the screen is small
  // (around 400px or less)
  .v-tabs:not(.v-tabs--vertical).v-tabs--right>.v-slide-group--is-overflowing.v-tabs-bar--is-mobile:not(.v-slide-group--has-affixes) .v-slide-group__next, .v-tabs:not(.v-tabs--vertical):not(.v-tabs--right)>.v-slide-group--is-overflowing.v-tabs-bar--is-mobile:not(.v-slide-group--has-affixes) .v-slide-group__prev {
    display: none;
  }

  #user-guide {
    font-size: var(--default-font-size);
    line-height: calc(1.1 * var(--default-line-height));

    .text-list li {
      margin-bottom: 0.5em;
    }

    .text-list li + li {
      margin-bottom: 0.5em;
    }
    .text-list ul {
      margin-top: 0.5em;
    }

    p {
      margin-bottom: 0.5em;
    }

    .v-chip {
      color: unset;
      background-color: unset;
      // font-size: var(--default-font-size);
    }

    .user-guide-header {
      margin-top: 1rem;
      margin-bottom: 0.2em;
      color: var(--accent-color);
      font-size: calc(1.2 * var(--default-font-size));
    }

    .user-guide-emphasis-white {
      font-weight: bold;
    }

    .show-intro-checkbox .v-label {
      font-size: var(--default-font-size);
      opacity: 1;
    }

    .solid-divider {
      margin-top: 1rem;
      color: var(--sky-color);
      opacity: 0.7;
    }
  }
}

.dialog-close-button {
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 1;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  touch-action: manipulation;
}

#eclipse-prediction-sheet {
  .v-card {
    border: 1px solid var(--accent-color-2);
  }

  @media (max-width: 350px) {
    .v-card-text {
      padding-inline: 12px;
    }
  }
}

#body-logos {
  margin-left: auto;
  margin-right: 0;

  img {
    height: 35px;
    vertical-align: middle;
    margin: 2px;
  }
}

#slider .v-slider {
  .v-slider-track {
    // --v-slider-track-size: 4px !important;

    .v-slider-track__background {
      background-color: #CCC !important;
    }

    .v-slider-track__fill {
      background-color: rgb(255 193 203)!important;
      height: var(--v-slider-track-size) !important;
    }

    .v-slider-track__background--opacity {
      opacity: 1 !important;
    }
  }

  .v-slider-thumb {
    
    .v-slider-thumb__surface {
      border: 1px solid black !important;
    }
  }
  
  .v-slider-thumb__label {
    min-width: fit-content;
    white-space: nowrap;
    color: white;
    font-weight: 600;
    background-color: rgba(0, 0, 0, 0.5);
    border: 2px solid var(--accent-color);
    border-radius: 5px;
    padding-inline: 0.7rem;

    // Matches .location-status-name's size.
    font-size: calc(0.95 * var(--default-font-size));
    padding-block: calc(0.5 * var(--default-line-height));

    @media (max-width: 600px) {
      font-size: calc(0.95 * var(--default-font-size));
      padding-block: 4px;
      padding-inline: 0.3rem;
    }
  }

  .v-slider-thumb__label-wedge {
    background: var(--accent-color);

    &::before {
      content: '';
      position: absolute;
      inset: 0;
      clip-path: inherit;
      background: rgba(0, 0, 0, 0.5);
      transform: scale(0.7);
      transform-origin: top center;
    }
  }
}

#slider {
  width: calc(100% - 11rem) !important;
  margin-left: 5.5rem;
  margin-right: 5.5rem;
  position: relative;

  @media (max-width: 600px) {
    width: calc(100% - 9rem) !important;
    margin-left: 4.5rem;
    margin-right: 4.5rem;
  }
}

.v-container {
  max-width: 100%;
}

#closed-top-container {
    position: absolute;
    left: 0.5rem;
    z-index: 500;
    top: calc(var(--default-font-size) + 1px);
    font-size: calc(1.2 * var(--default-font-size));
    font-weight: bold;

    @media (max-width: 600px) {
      font-size: var(--default-font-size);
    }

    #show-guided-content-button {
      width: fit-content;
      height: fit-content;
      padding: 6px 12px;
      border-radius: var(--normal-border-radius);

      @media (max-width: 600px) {
        padding-left: 6px;
      }
    }
  }

#guided-content-wrapper {
  --margin: 0.5rem;
  position: relative;

  @media (max-width: 600px) {
    &.mobile-fullscreen {
      position: fixed;
      inset: 0;
      z-index: 700;

      #guided-content-container {
        margin: 0;
        width: 100%;
        --top-content-max-height: 100%;
        --top-content-min-height: 100%;
        border-radius: 0;
      }
    }
  }
}

#guided-content-container {
  --top-content-max-height: max(340px, 35vh);
  --top-content-min-height: var(--top-content-max-height);
  z-index: 400;

  @media (max-width: 600px) {
    --top-content-max-height: calc(100% - 1rem);
    --top-content-min-height: calc(100% - 1rem);
    box-sizing: border-box;
  }

  font-size: var(--default-font-size);
  @media (max-width: 350px) and (max-height: 600px) {
      font-size: min(3vw, 1.75vh);
  }

  --container-padding: 0.5rem;
  position: relative;
  margin: var(--margin);
  padding: var(--container-padding);

  width: calc(100% - 2*var(--margin));
  max-height: var(--top-content-max-height);
  min-height: var(--top-content-min-height);
  align-items: center;
  gap: 0.5rem;
  // border-bottom: 1px solid var(--accent-color);
  background-color: #272727;
  user-select: none;
  border: solid 1.5px var(--accent-color);
  
  line-height: var(--default-line-height);
  .thin-scrollbar();
  scrollbar-gutter: auto;

  transition: height 0.5s ease-in-out;
  
  display: flex;
  flex-direction: row;
  
  @media (max-width: 600px) {
    flex-direction: column;
    gap: 0.25rem;
  }
  
  
  #map-column {
    flex-basis: 100%;

    display: flex;
    flex-direction: column;
    justify-content: space-evenly;
    align-items: center;

    @media (max-width: 600px) {
      flex: 1 1 auto;
      min-height: 120px;
    }

    @media (min-width: 960px) {
      flex: 1 1 62%;
    }
  }

  #map-column-resize-handle {
    flex: 0 0 10px;
    align-self: stretch;
    cursor: col-resize;
    touch-action: none;
    display: flex;
    align-items: center;
    justify-content: center;

    @media (max-width: 600px) {
      display: none;
    }

    &::before {
      content: "";
      width: 4px;
      height: 40px;
      border-radius: 2px;
      background-color: var(--accent-color);
      opacity: 0.6;
    }

    &:hover::before,
    &:active::before {
      opacity: 1;
    }
  }

  #mobile-map-height-resize-handle {
    display: none;

    @media (max-width: 600px) {
      display: flex;
      flex: 0 0 10px;
      align-self: stretch;
      cursor: row-resize;
      touch-action: none;
      align-items: center;
      justify-content: center;

      &::before {
        content: "";
        width: 40px;
        height: 4px;
        border-radius: 2px;
        background-color: var(--accent-color);
        opacity: 0.6;
      }

      &:hover::before,
      &:active::before {
        opacity: 1;
      }
    }
  }


  #non-map-container { // Keep content away from the x to close
    height: 100%;
    flex-basis: 100%;
    min-width: 0;
    @media (max-width: 600px) {
      height: auto;
      flex: 0 0 auto;
    }
    @media (min-width: 960px) {
      flex: 0 1 38%;
    }
    --padding-left: 0.5rem;
    // @media (max-width: 600px) {
    //   --padding-left: 0;
    // }
    padding-left: var(--padding-left);
    padding-right: calc(var(--padding-left) + var(--container-padding));

    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: stretch;
    gap: 0.5em;
    .thin-scrollbar();
    overflow-x: hidden;

    position: relative;

    .non-map-row {
      margin: 0;
      padding: 0;
      flex: 0 0 auto;
    }

  }
    
  #title-row {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 0.5em;
    color: var(--accent-color);
    font-weight: bold;
    font-size: 1.3em;

    #title {
      flex: 1 1 auto;
      min-width: 0;
      text-align: left;
    }

    #hide-guided-content-button {
      flex: 0 0 auto;
      border: none;
      background: transparent;
    }

    .title-row-close-button {
      position: static;
      flex: 0 0 auto;
    }
  }
  
  #instructions-row {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    border: 1.5px solid var(--sky-color);
    border-radius: 5px;
    align-items: stretch;
    justify-content: center;

    // v-col
    #top-container-main-text {
      height: 100%;
      min-width: 0;
      min-height: 0;
      display: flex;
      flex-direction:column;


      // div
      .instructions-text {
        min-width: 0;
        min-height: 0;
        flex: 1;
        width: 100%;
        .thin-scrollbar();

        padding-inline: 0.7em;
        padding-block: 0.4em;

        // span
        .description {
          line-height: 1.4em;
          color: white;
          text-align: left;
          user-select: text;

          p {
            margin-bottom: 0.5em;
          }
        }

      }
    }
  }

  #button-row {
    width: 100%;

    #top-container-buttons{
      display: flex;
      flex-direction: row;
      justify-content: space-evenly;
      gap: 0.5em;

      .icon-wrapper {
        background-color: rgba(209, 209, 209, .2);
        border: none;
        border-radius: 5px;
        padding-block: 4px;
        // be as large as you can but shrink if needed
        width: 100%;
        height: auto;
        min-width: 0;
        flex-shrink: 1;


        &.active {
          border: 2px solid var(--sky-color);

          &:focus {
            border-color: var(--sky-color) !important;
          }
        }
      }
    }
  }

  &.no-height-transition {
    transition: none !important;
  }

}

#top-container-resize-handle {
  position: absolute;
  left: 0;
  right: 0;
  bottom: var(--margin);
  height: 10px;
  z-index: 401;
  cursor: row-resize;
  touch-action: none;
  display: flex;
  align-items: center;
  justify-content: center;

  &::before {
    content: "";
    width: 40px;
    height: 4px;
    border-radius: 2px;
    background-color: var(--accent-color);
    opacity: 0.6;
  }

  &:hover::before,
  &:active::before {
    opacity: 1;
  }
}

#map-column { // v-col
  position: relative;
  --map-edge-gap: 4px;
  align-self: stretch;
  width: 100%;
  min-height: 0;
  // outline: 1px solid red;

  #map-container {
    flex: 1 1 auto;
    min-height: 0;
    width: 100%;
    box-sizing: border-box;
    padding: var(--map-edge-gap);
    position: relative;

    display: flex;
    align-items: stretch;
    justify-content: center;

    --map-overlay-margin: 0.5em;

    .map-bottomleft-stack {
      position: absolute;
      z-index: 600;
      bottom: var(--map-overlay-margin);
      left: var(--map-overlay-margin);
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 5px;
    }

    #location-status-box-overmap {
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(6px);
      color: white;
      border: 2px solid var(--accent-color);
      border-radius: var(--tight-border-radius);
      padding: 0.35em 0.5em;
      font-size: calc(0.8 * var(--default-font-size));
      text-align: center;
      width: 8rem;
      max-width: 70vw;

      .location-status-name {
        font-size: calc(0.9 * var(--default-font-size));
        white-space: pre-line;
      }

      .eclipse-status-line {
        white-space: pre-line;
      }
    }

    #my-location-overmap-button {
      position: absolute;
      z-index: 600;
      bottom: var(--map-overlay-margin);
      right: var(--map-overlay-margin);
    }

    .map-topright-stack {
      position: absolute;
      z-index: 600;
      top: calc(1em + var(--map-overlay-margin));
      right: var(--map-overlay-margin);
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 5px;
    }

    .map-container {
      height: 100%;
      width: 100%;
      min-width: 0;
      min-height: 0;
    }
  
    span {
      padding: 0;
      margin: 0;
    }
    
    .leaflet-control-zoom-in, .leaflet-control-zoom-out {

      background-color: #fff;
      cursor: pointer; /* Change cursor on hover */
      
      span {
        color: black;
      }
    } 

    .leaflet-touch {
      line-height: 1;
    }
    
    .leaflet-control-attribution {
      font-size: .75em;
    }
    
    .leaflet-pane.leaflet-overlay-pane > svg > g > path[fill="#333"] {
      pointer-events: none;
    }
    
    .leaflet-pane.leaflet-overlay-pane > svg > g > path[fill="#ff0000"] {
      pointer-events: none;
    }
  }
}

.bullet-icon {
  color: var(--accent-color);
  width: 1.5em;

  &.v-icon {
    opacity: 1;
  }
}

.instruction-overlay {
  position: relative;
  display: grid;
  min-height: max-content;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 0.5fr 0.5fr;
  gap: 1em;

  background-color: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(5px);
  border-radius: var(--tight-border-radius);



  div.inst-quad {
    display: flex;
    flex-direction: column;
    gap: 5px;
    box-sizing: content-box;
  }
  
  
  div.inst-quad > div {
    flex-grow: 1;
    flex-shrink: 0;
    flex-basis: 50%;
    display: flex;
    gap: 1em;
  }
  
  .inst-text {
    font-size: clamp(0.8rem, min(3.5vw, 3vh), 1.1rem);
    color: white;
    font-weight: bold;

    @media (orientation: landscape) {
      font-size: clamp(0.8rem, min(3vw, 4vh), 1.1rem);
    }

  }
  
  
  .inst-arrow {
    .the-arrow {
      max-width: calc(0.1 * var(--width)) !important;
      max-height: calc(0.1 * var(--height)) !important;
    }
  }
  
  div.inst-quad.top-left {
    // grid-area shorthand: row-start / column-start / row-end / column-end;
    grid-area: 1 / 1 / 2 / 2;
    margin-bottom: auto;
    .the-arrow {
      transform: translateY(-5px) rotateZ(-30deg);
    }
  }
  
  
  
  div.inst-quad.top-right {
    grid-area: 1 / 2 / 2 / 3;
    margin-bottom: auto;
    text-align: right;
    .inst-text {
      justify-content: flex-end;
    }
    .inst-arrow {
      align-self: end;
    }
    .the-arrow {
      transform: translateY(-5px) rotateZ(30deg);
    }
  }
  
  div.inst-quad.bottom-left {
    grid-area: 2 / 1 / 3 / 3;
    flex-direction: column-reverse;
    align-items: center;
    margin-top: auto;
    text-align: center;
    .inst-text {
      justify-content: center;
    }
    .the-arrow {
      transform: translateY(5px) rotateX(180deg);
    }
  }


}

.instruction-overlay-mobile {
  --width: 80dvw;
  --height: 50dvh;
  border: 1px solid var(--accent-color-2);
  padding: 1rem;
  top: calc(5rem + 1vh);

  @media (min-height: 500px) {
    top: calc(5rem + 11vh);
  }

  @media (orientation: landscape) {
    --height: 60dvh;
    top: calc(3rem + 5vh);
  }

  left: calc((100dvw - var(--width)) / 2);
  width: var(--width);
  height: var(--height);

  grid-template-rows: 0.5fr 0.5fr auto;

  .inst-arrow .the-arrow {
    max-width: calc(0.1 * var(--width)) !important;
    max-height: calc(0.1 * var(--height)) !important;
  }

  div.inst-quad.top-left, div.inst-quad.top-right {
    margin-top: 1rem;
  }

  div.inst-quad.bottom-left {
    margin-bottom: 0.25rem;
  }

  .intro-bottom-controls {
    grid-area: 3 / 1 / 4 / 3;
    margin-top: 0;

    .v-btn {
      padding-inline: 8px;
    }
  }
}

.instruction-overlay-desktop {
  --width: 68dvw;
  --height: 36dvh;
  border: 1px solid var(--accent-color-2);
  padding: 0.5rem;
  padding-inline: 1rem;
  top: calc(50dvh + var(--top-content-height) / 2 - var(--height) / 2);
  left: calc((100dvw - var(--width)) / 2);
  width: var(--width);
  height: var(--height);
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: 1fr auto;

  .intro-bottom-controls {
    grid-area: 2 / 1 / 3 / 4;
    margin-top: 0;
    margin-bottom: 0.5em;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    align-items: end;

    .intro-back-button {
      justify-self: start;
    }

    .intro-next-button {
      justify-self: end;
    }

    .inst-quad.bottom-left {
      grid-area: auto / 2 / auto / 3;
      justify-self: center;
      margin-top: 0;
      margin-bottom: 1.6rem;
    }
  }

  .inst-arrow .the-arrow {
    max-width: clamp(20px, calc(0.07 * var(--width)), 48px) !important;
    max-height: clamp(20px, calc(0.07 * var(--height)), 48px) !important;
  }

  .inst-text {
    font-size: clamp(0.9rem, min(1.6vw, 2.2vh), 1.3rem);
  }

  div.inst-quad.top-left, div.inst-quad.top-center, div.inst-quad.top-right {
    margin-top: 1.75rem;
  }

  div.inst-quad.top-left {
    grid-area: 1 / 1 / 2 / 2;
  }

  div.inst-quad.top-left .the-arrow {
    transform: translateY(-5px) rotateZ(-60deg);
  }

  div.inst-quad.top-center {
    grid-area: 1 / 2 / 2 / 3;
    margin-bottom: auto;
    align-items: center;
    text-align: center;

    .inst-text {
      justify-content: center;
    }
  }

  div.inst-quad.top-right {
    grid-area: 1 / 3 / 2 / 4;
  }

  div.inst-quad.top-right .the-arrow {
    transform: translateY(-5px) rotateZ(60deg);
  }
}

#introduction-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translateX(-50%) translateY(-50%);
  height: fit-content;
  border: 1px solid var(--accent-color-2);
  background-color: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(5px);
  border-radius: var(--tight-border-radius);

  @media (max-width: 700px) {
    width: 95%;
    padding: 4em 0.5em 0.5em;
  }

  @media (min-width: 701px) {
    width: 75%;
    padding: 3.25em 1em 1em;
  }

  .span-accent {
    color: var(--accent-color);
  }

  font-size: calc(1.1 * var(--default-font-size));
  line-height: var(--default-line-height);

  .v-list-item__prepend {
    margin-right: 0.75em;

    > .v-icon ~ .v-list-item__spacer {
      width: 0;
    }
  }

  .v-list-item {
    color: #eee;
  }
  
  .intro-text {
    color: white;
    padding-inline: 1rem;

    p {
      margin-bottom: 0.5em;
    }
  }

  strong {
    color: white;
  }

  .v-checkbox .v-label {
    font-size: calc(1.1 * var(--default-font-size));
    opacity: 1;
  }

  @media (max-width: 500px) {
    .intro-bottom-controls {
      flex-direction: column;
      align-items: stretch;

      .intro-next-button {
        align-self: flex-end;
      }
    }
  }
}

.intro-bottom-controls {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;

  gap: 1em;
  margin-top:0.5em;

  .v-btn.v-btn--density-default {
      max-height: calc(1.6 * var(--default-line-height));
    }

  .v-btn--size-default {
    font-size: calc(0.9 * var(--default-font-size));
  }

  .intro-next-button, .intro-back-button {
    background-color: rgba(18, 18, 18,.5);
  }
}

#speed-control {
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  gap: 5px;
  margin-left: 10px;

  @media (orientation: landscape) {
    margin-left: 3rem;
  }

  @media (max-width: 370px) {
    justify-content: center;
  }

  @media (max-width: 600px) {
    .icon-wrapper {
      width: 30px;
      height: 34px;
    }
    margin-bottom: 10px;
  }
}

#enclosing-playback-container.desktop-playback-control {
  --tick-font-size: 12px;
  margin-bottom: calc(2.5rem + 5px);
  margin-left: 5px;
  padding-right: 1rem;
  max-width: 235px;

  @media (orientation: landscape) {
    margin-left: 3rem;
  }
}

#enclosing-playback-container.inset.mobile-playback-control {
  padding-right: 1rem;
}

#inline-speed-control {
  display: flex;
  flex-grow:1;
  align-items: flex-end;
  position: relative;
  gap: 5px;

  @media (max-width: 370px) {
    flex-grow: 0;
    position: static;
    #enclosing-playback-container.mobile-playback-control {
      position: absolute;
      width: calc(90% - 1rem);
      left: 50%;
      bottom: calc(100% + 5px);
      transform: translateX(-50%);
    }
  }
}

#speed-text {
  position: absolute;
  background-color: rgba(0, 0, 0, 0.5);
  padding-inline: 0.4em;
  padding-block: 0.15em;
  border-radius: 0.3em;
  font-size: calc(1 * var(--default-font-size));
  text-wrap: nowrap;  
  width: fit-content;

  left: calc(100% + 1rem);
  top: 1.5rem;
  
  @media (max-width: 600px) {
    position: relative;
    top: 3rem;
    left: 0.5rem;
    display: inline;
  }
}

#eclipse-percent-chip {
    display: flex;
    width: 100%;
}

#eclipse-percent-indicator {
  position: absolute;
  transform: translate(-50%, -50%);
  background-color: rgba(0, 0, 0, 0.5);
  padding-inline: 0.4em;
  padding-block: 0.15em;
  border-radius: 0.3em;
  font-size: calc(1 * var(--default-font-size));
  text-wrap: nowrap;
  width: fit-content;
  color: white;
  z-index: 50;
  pointer-events: none;
}

#top-wwt-content {
  position: absolute;
  right: 0.5rem;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 5px;

  @media (max-width: 599px) {
    top: 2.5rem;
  }

  @media (min-width: 600px) {
    top: 0.7rem;
  }

  &.budge {
    top: calc(var(--default-font-size) + 1px);
  }

  #top-right-buttons {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 5px;
  }

  pointer-events: auto;
}

#change-optout {
  
  @media (max-width: 600px) {
    position: absolute;
    bottom: -0.5rem ;
    right: 0.5rem;
  }
  
  .icon-wrapper {
    width: auto;
    height: auto;
    margin: 0;
    padding: 0.15em;
    border: none;
    border-radius: 4px;
    min-width: 0;
  }
}

#privacy-popup-dialog {

  .v-card-text {
    color: #BDBDBD;
  }

  .v-overlay__content {
    font-size: var(--default-font-size);
    background-color: purple;
    position: absolute;
    bottom: 0;
    right: 0;
  }

  .v-btn--size-default {
      font-size: calc(0.9 * var(--default-font-size));
    }  

  .v-card-actions .v-btn {
    padding: 0 4px;
  }
}

a {
    text-decoration: none;
    font-weight: bold;
    color: var(--accent-color-2);
    pointer-events: auto;
  }

.icon-wrapper {
  box-sizing: border-box;
  width: 35px;
  height: 37px;
  padding: 0;
  border-radius: var(--normal-border-radius);
  border: 2px solid var(--color);
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(6px);
}



.rating-root {
  position: absolute !important;
  right: 5px;
  bottom: 0;
  padding: 5px;
  width: fit-content !important;
  // left: 50%;
  // transform: translateX(-50%);
  gap: 0 !important;
  border: solid 1px #EFEFEF !important;
  border-radius: var(--tight-border-radius) !important;
  background-color: #222222 !important;
  opacity: 0.95 !important;
  z-index: 20000 !important;

  .rating-title {
    color: #EFEFEF;
    font-size: var(--default-font-size);
  }

  .rating-icon-row {
    
    padding: 0px;

    .svg-inline--fa {
      height: 30px;
    }
  }

  .comments-box {
    width: 100%;
    margin-top: 20px;
  }

  .v-card-text {
    padding-bottom: 0;
  }

  .v-card-actions {
    padding: 0;
  }

  #user-experience-footer {
    margin: auto;
    display: flex;
    flex-direction: row;
    gap: 5px;
  }

  .close-button {
    position: absolute !important;
    color: white !important;
  }
}

</style>
