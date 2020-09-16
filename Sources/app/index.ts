import document from "document";
import * as util from "./simple/utils";
import * as font from "./simple/font";
// Display & AOD
import * as simpleDisplay from "./simple/display";

// Simpl activities
import * as simpleActivities from "simple-fitbit-activities";

// import clock from "clock";
import * as simpleMinutes from "./simple/clock-strings";

// Device form screen detection
import { me as device } from "device";

// Elements for style
const _container = document.getElementById("container") as GraphicsElement;
const _background = document.getElementById("background") as RectElement;
const _batteryBackground = document.getElementById("battery-bar-background") as GradientArcElement;

// Date
const _datesContainer = document.getElementById("date-container") as GraphicsElement
const _dates1Container = document.getElementById("date1-container") as GraphicsElement;
const _dates1 = _dates1Container.getElementsByTagName("image") as ImageElement[];
const _dates2Container = document.getElementById("date2-container") as GraphicsElement;
const _dates2 = _dates2Container.getElementsByTagName("image") as ImageElement[];

// Hours
const _clocksContainer = document.getElementById("clock-container") as GraphicsElement;
const _clocks = document.getElementById("clock-container").getElementsByTagName("image") as ImageElement[];
const _cloksHours = _clocks.slice(0, 2);
const _cloksMinutes = _clocks.slice(3, 5);

// Battery
const _batteryValueContainer = document.getElementById("battery-bar-container") as GraphicsElement;
const _batteryBar = document.getElementById("battery-bar-value") as GradientRectElement;
const _batteryTextContainer = document.getElementById("battery-container") as GraphicsElement;
const _batteries = document.getElementById("battery-text").getElementsByTagName("image");

// Stats
const _statcontainer = document.getElementById("stats-container") as GraphicsElement;
const _stepsContainer = document.getElementById("steps-container") as GraphicsElement;
const _calsContainer = document.getElementById("cals-container") as GraphicsElement;
const _amContainer = document.getElementById("am-container") as GraphicsElement;
const _distContainer = document.getElementById("dist-container") as GraphicsElement;
const _elevationContainer = document.getElementById("elevation-container") as GraphicsElement;

// Heart rate management
const _hrmContainer = document.getElementById("hrm-container") as GroupElement;
const _iconHRM = document.getElementById("iconHRM") as GraphicsElement;
const _imgHRM = document.getElementById("icon") as ImageElement;
const _hrmTexts = document.getElementById("hrm-text-container").getElementsByTagName("image") as ImageElement[];

import { Settings } from "../common";
// Current settings
const _settings = new Settings();

// --------------------------------------------------------------------------------
// Clock
// --------------------------------------------------------------------------------
// Update the clock every seconds
simpleMinutes.initialize("seconds", (clock) => {
  const folder: font.folder = simpleDisplay.isInAodMode()
    ? "chars-aod"
    : "chars";

  // Hours
  if (clock.Hours) {
    font.print(clock.Hours, _cloksHours, folder);
  }

  // Minutes
  if (clock.Minutes) {
    font.print(clock.Minutes, _cloksMinutes, folder);
  }

  // Date 1
  if (clock.Date1 !== undefined) {
    // Position
    _dates1Container.x = (device.screen.width) - (clock.Date1.length * 20);
    // Values
    font.print(clock.Date1, _dates1);
  }

  // Date 2
  if (clock.Date2 !== undefined) {
    // Position
    _dates2Container.x = (device.screen.width) - (clock.Date2.length * 20);
    // Values
    font.print(clock.Date2, _dates2);
  }

  // update od stats
  UpdateActivities();
});

function setHoursMinutes(folder: font.folder) {
  // Hours
  font.print(simpleMinutes.last.Hours + ":" + simpleMinutes.last.Minutes, _clocks, folder);
}
// --------------------------------------------------------------------------------
// Power
// --------------------------------------------------------------------------------
import * as batterySimple from "./simple/battery";

// Method to update battery level informations
batterySimple.initialize((battery) => {
  let batteryString = battery.toString() + "%";
  // Battery text
  font.print(batteryString, _batteries);
  // Battery bar
  _batteryBar.width = Math.floor(battery) * device.screen.width / 100;
});

// --------------------------------------------------------------------------------
// Activity
// --------------------------------------------------------------------------------

// Init
simpleActivities.initialize(UpdateActivities);

// Elevation is available
if (!simpleActivities.elevationIsAvailable()) {
  util.hide(_elevationContainer);
  const container = document.getElementById("stats-container") as GraphicsElement;
  container.y = 36;
}

// Update Activities informations
function UpdateActivities() {
  // Get activities
  const activities = simpleActivities.getNewValues();

  // Steps
  UpdateActivity(_stepsContainer, activities.steps);

  // Calories
  UpdateActivity(_calsContainer, activities.calories);

  // Active minutes
  UpdateActivity(_amContainer, activities.activeZoneMinutes);

  // Disance
  UpdateActivity(_distContainer, activities.distance);

  // Elevation
  UpdateActivity(_elevationContainer, activities.elevationGain);
}

function UpdateActivity(container: GraphicsElement, activity: simpleActivities.Activity): void {
  if (activity === undefined) return;
  let achievedString = activity.actual.toString();

  // Bar
  updateActivityBar(container, activity, _background.style.fill);

  // Text
  // container.x = device.screen.width / 2 + 20 - (achievedString.toString().length * 20);
  let texts = container.getElementsByClassName("stats-text-container")[0].getElementsByTagName("image") as ImageElement[];
  font.print(achievedString, texts);
}

function updateActivityBar(container: GraphicsElement, activity: simpleActivities.Activity, appBackgroundColor: string): void {
  const maxWidth = device.screen.width - 156;
  const bar = container.getElementsByClassName("stat-container-bar")[0] as GraphicsElement;
  const star = container.getElementsByClassName("stat-container-star")[0] as GraphicsElement;
  const circle = container.getElementsByClassName("stats-icon-container")[0].getElementsByTagName("circle")[0] as CircleElement;

  circle.style.fill = appBackgroundColor;
  // Goals ok
  if (activity.goalReached()) {
    util.show(star);
    bar.width = maxWidth;
  }
  else {
    util.hide(star);
    bar.width = activity.asPourcent() * maxWidth / 100;
  }
}

// --------------------------------------------------------------------------------
// Heart rate manager
// --------------------------------------------------------------------------------
import * as simpleHRM from "./simple/hrm";
let lastBpm: number;

simpleHRM.initialize((newValue, bpm, zone, restingHeartRate) => {
  // Zones
  if (zone === "out-of-range") {
    _imgHRM.href = "images/stat_hr_open_48px.png";
  } else {
    _imgHRM.href = "images/stat_hr_solid_48px.png";
  }

  // Animation
  if (newValue) {
    _iconHRM.animate("highlight");
  }

  // BPM value display
  if (bpm !== lastBpm) {
    if (bpm > 0) {
      util.show(_hrmContainer);
      font.print(bpm.toString(), _hrmTexts);
    } else {
      util.hide(_hrmContainer);
    }
  }
});

// --------------------------------------------------------------------------------
// Settings
// --------------------------------------------------------------------------------
import * as simpleSettings from "simple-fitbit-settings/app";

simpleSettings.initialize(
  _settings,
  (settingsNew: Settings) => {
    if (!settingsNew) {
      return;
    }

    if (settingsNew.showBatteryPourcentage !== undefined) {
      util.setVisibility(_batteryTextContainer, settingsNew.showBatteryPourcentage);
    }

    if (settingsNew.showBatteryBar !== undefined) {
      util.setVisibility(_batteryValueContainer, settingsNew.showBatteryBar);
    }

    if (settingsNew.colorBackground !== undefined) {
      util.fill(_background, settingsNew.colorBackground);
      _batteryBackground.gradient.colors.c1 = settingsNew.colorBackground;
      simpleActivities.reset(); // Reset data to force update
      UpdateActivities(); // For achivement color
    }

    if (settingsNew.colorForeground !== undefined) {
      util.fill(_container, settingsNew.colorForeground);
    }

    if (settingsNew.colorForegroundStats !== undefined) {
      util.fill(
        document.getElementById("stats-container") as GraphicsElement,
        settingsNew.colorForegroundStats);
    }

    // Display based on 12H or 24H format
    if (settingsNew.clockDisplay24 !== undefined) {
      simpleMinutes.updateClockDisplay24(settingsNew.clockDisplay24);
    }
  });

// --------------------------------------------------------------------------------
// Allways On Display
// --------------------------------------------------------------------------------
simpleDisplay.initialize(onEnteredAOD, onLeavedAOD);

function onLeavedAOD() {
  setHoursMinutes("chars");

  // Show elements & start sensors
  _background.style.display = "inline";
  if (_settings.showBatteryPourcentage) _batteryTextContainer.style.display = "inline";
  if (_settings.showBatteryBar) _batteryValueContainer.style.display = "inline";
  _datesContainer.style.display = "inline";
  _statcontainer.style.display = "inline";
  _hrmContainer.style.display = "inline";

  // 100%-150
  _clocksContainer.x = device.screen.width - 150;

  // Start sensors
  simpleHRM.start();
}

function onEnteredAOD() {
  // Stop sensors
  simpleHRM.stop();

  setHoursMinutes("chars-aod");
  // Clock position
  // 50%-75
  _clocksContainer.x = (device.screen.width - 150) / 2;

  // Hide elements
  _background.style.display = "none";
  _datesContainer.style.display = "none";
  _batteryTextContainer.style.display = "none";
  _batteryValueContainer.style.display = "none";
  _statcontainer.style.display = "none";
  _hrmContainer.style.display = "none";
}