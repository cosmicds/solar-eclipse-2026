import { createApp } from "vue";

import { CreditLogos, IconButton } from "@cosmicds/vue-toolkit";
import LocationSelector from "./LocationSelector.vue";
import { FundingAcknowledgment, UserExperience } from "@cosmicds/vue-toolkit";
import SolarEclipse2026 from "./SolarEclipse2026.vue";
import GifPlayPause from "./GifPlayPause.vue";
import GeolocationButton from "./GeolocationButton.vue";
import CloudCover from "./CloudCover.vue";
import DefineTerm from "./DefineTerm.vue";
import PlaybackControl from "./PlaybackControl.vue";

import EclipseTimer from "./EclipseTimer.vue";
// import DebugEclipseTimer from "./DebugEclipseTimer.vue";
import LocationSearch from "./LocationSearch.vue";
import OpenMeteoForecast from "./OpenMeteoForecast.vue";
import CDSPrivacyPolicy from "./CDSPrivacyPolicy.vue";

import "./polyfills";

import VueSlider from "vue-slider-component";
import 'vue-slider-component/theme/default.css';

import Notifications from "@kyvg/vue3-notification";

import vuetify from "../plugins/vuetify";

import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

import { WWTComponent, wwtPinia } from "@wwtelescope/engine-pinia";

import { library } from "@fortawesome/fontawesome-svg-core";
import {
  faTimes,
  faXmark,
  faGear,
  faChevronDown,
  faClock,
  faPlay,
  faPause,
  faMapLocationDot,
  faSun,
  faPuzzlePiece,
  faLocationDot,
  faChevronUp,
  faQuestion,
  faAngleDoubleDown,
  faAngleDoubleUp,
  faArrowsRotate,
  faMountainSun,
  faShareNodes,
  faSquareXmark,
  faToolbox,
  faCircleInfo,
  faRotate,
  faCircleChevronDown,
  faStreetView,
  faCloudSun,
  faGaugeHigh,
  faAnglesLeft,
  faAnglesRight,
  faMagnifyingGlass,
  faChartColumn,
  faLocationCrosshairs,
  faHouse,
  faAnglesUp,
  faAnglesDown,
  faSliders,

} from "@fortawesome/free-solid-svg-icons";

library.add(faTimes);
library.add(faXmark);
library.add(faGear);
library.add(faChevronDown);
library.add(faClock);
library.add(faPlay);
library.add(faPause);
library.add(faMapLocationDot);
library.add(faSun);
library.add(faPuzzlePiece);
library.add(faLocationDot);
library.add(faChevronUp);
library.add(faQuestion);
library.add(faAngleDoubleDown);
library.add(faAngleDoubleUp);
library.add(faArrowsRotate);
library.add(faMountainSun);
library.add(faShareNodes);
library.add(faSquareXmark);
library.add(faToolbox);
library.add(faCircleInfo);
library.add(faRotate);
library.add(faCircleChevronDown);
library.add(faStreetView);
library.add(faCloudSun);
library.add(faGaugeHigh);
library.add(faAnglesLeft);
library.add(faAnglesRight);
library.add(faMagnifyingGlass);
library.add(faChartColumn);
library.add(faLocationCrosshairs);
library.add(faHouse);
library.add(faAnglesUp);
library.add(faAnglesDown);
library.add(faSliders);


createApp(SolarEclipse2026, {
  wwtNamespace: "wwt-minids-solar-eclipse-2026",
})

  // Plugins
  .use(wwtPinia)
  .use(vuetify)
  .use(Notifications)

  // Components
  .component("WorldWideTelescope", WWTComponent)
  .component('font-awesome-icon', FontAwesomeIcon)
  .component('icon-button', IconButton)
  .component('location-selector', LocationSelector)
  .component('vue-slider', VueSlider)
  .component('gif-play-pause', GifPlayPause)
  .component('credit-logos', CreditLogos)
  .component('funding-acknowledgment', FundingAcknowledgment)
  .component('geolocation-button', GeolocationButton)
  .component('cloud-cover', CloudCover)
  .component('define-term', DefineTerm)
  .component('playback-control', PlaybackControl)
  .component('eclipse-timer', EclipseTimer)
  // .component('debug-eclipse-timer', DebugEclipseTimer)
  .component('location-search', LocationSearch)
  .component('open-meteo-forecast', OpenMeteoForecast)
  .component('user-experience', UserExperience)
  .component('cds-privacy-policy', CDSPrivacyPolicy)
  // Mount
  .mount("#app");
