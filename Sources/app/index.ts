import document from "document";
import * as util from "./simple/utils";

// import clock from "clock";
import * as simpleMinutes from "./simple/clock-strings";

// Device form screen detection
import { me as device } from "device";

// Elements for style
const container = document.getElementById("container") as GraphicsElement;
const background = document.getElementById("background") as RectElement;
const batteryBackground = document.getElementById("battery-bar-background") as GradientArcElement;

// Date
const dates1Container = document.getElementById("date1-container") as GraphicsElement;
const dates1 = dates1Container.getElementsByTagName("image") as ImageElement[];
const dates2Container = document.getElementById("date2-container") as GraphicsElement;
const dates2 = dates2Container.getElementsByTagName("image") as ImageElement[];

// Hours
const cloks = document.getElementById("clock-container").getElementsByTagName("image") as ImageElement[];

// Battery
const _batteryBarContainer = document.getElementById("battery-bar-container") as GraphicsElement;
const _batteryBar = document.getElementById("battery-bar-value") as GradientRectElement;
const _batteriesContainer = document.getElementById("battery-container") as GraphicsElement;
const _batteries = _batteriesContainer.getElementsByTagName("image") as ImageElement[];

// Stats
const _stepsContainer = document.getElementById("steps-container") as GraphicsElement;
const _calsContainer = document.getElementById("cals-container") as GraphicsElement;
const _amContainer = document.getElementById("am-container") as GraphicsElement;
const _distContainer = document.getElementById("dist-container") as GraphicsElement;
const _elevationContainer = document.getElementById("elevation-container") as GraphicsElement;

// Heart rate management
const hrmContainer = document.getElementById("hrm-container") as GroupElement;
const iconHRM = document.getElementById("iconHRM") as GraphicsElement;
const imgHRM = document.getElementById("icon") as ImageElement;
const hrmTexts = document.getElementById("hrm-text-container").getElementsByTagName("image") as ImageElement[];

// --------------------------------------------------------------------------------
// Clock
// --------------------------------------------------------------------------------
// Update the clock every seconds
simpleMinutes.initialize("seconds", (clock) => {
  // date for screenshots
  //clock.Date = "jun 23";

  // Hours
  if (clock.Hours) {
    cloks[0].href = util.getImageFromLeft(clock.Hours, 0);
    cloks[1].href = util.getImageFromLeft(clock.Hours, 1);
  }

  // Minutes
  if (clock.Minutes) {
    cloks[3].href = util.getImageFromLeft(clock.Minutes, 0);
    cloks[4].href = util.getImageFromLeft(clock.Minutes, 1);
  }

  // Date 1
  if (clock.Date1 !== undefined) {
    // Position
    dates1Container.x = (device.screen.width) - (clock.Date1.length * 20);
    // Values
    util.display(clock.Date1, dates1);
  }

  // Date 2
  if (clock.Date2 !== undefined) {
    // Position
    dates2Container.x = (device.screen.width) - (clock.Date2.length * 20);
    // Values
    util.display(clock.Date2, dates2);
  }

  // update od stats
  UpdateActivities();
});

// --------------------------------------------------------------------------------
// Power
// --------------------------------------------------------------------------------
import * as batterySimple from "./simple/power-battery";

// Method to update battery level informations
batterySimple.initialize((battery) => {
  let batteryString = battery.toString() + "%";
  // Battery bar
  _batteryBar.width = Math.floor(battery) * device.screen.width / 100;

  // Battery text
  let max = _batteries.length - 1;
  for (let i = 0; i < max; i++) {
    _batteries[i + 1].href = util.getImageFromLeft(batteryString, i);
  }
});
// --------------------------------------------------------------------------------
// Settings
// --------------------------------------------------------------------------------
import * as simpleSettings from "./simple/device-settings";

simpleSettings.initialize((settings: any) => {
  if (!settings) {
    return;
  }

  if (settings.showBatteryPourcentage !== undefined) {
    _batteriesContainer.style.display = settings.showBatteryPourcentage === true
      ? "inline"
      : "none";
  }

  if (settings.showBatteryBar !== undefined) {
    _batteryBarContainer.style.display = settings.showBatteryBar === true
      ? "inline"
      : "none";
  }

  if (settings.colorBackground) {
    background.style.fill = settings.colorBackground;
    batteryBackground.gradient.colors.c1 = settings.colorBackground;
    simpleActivities.reset(); // Reset data to force update
    UpdateActivities(); // For achivement color
  }

  if (settings.colorForeground) {
    container.style.fill = settings.colorForeground;
  }

  if(settings.colorForegroundStats!==undefined){
    (document.getElementById("stats-container") as GraphicsElement).style.fill = settings.colorForegroundStats;
  }

  // Display based on 12H or 24H format
  if (settings.clockDisplay24 !== undefined) {
    simpleMinutes.updateClockDisplay24(settings.clockDisplay24 as boolean);
  }
});
// --------------------------------------------------------------------------------
// Activity
// --------------------------------------------------------------------------------
import * as simpleActivities from "./simple/activities"

// Init
simpleActivities.initialize(UpdateActivities);

// Elevation is available
if (!simpleActivities.elevationIsAvailable()) {
  _elevationContainer.style.display = "none";
  const container = document.getElementById("stats-container") as GraphicsElement;
  container.y = 36;
}

// Update Activities informations
function UpdateActivities() {
  // Get activities
  const activities = simpleActivities.getNewValues();

  // Steps
  if (activities.steps !== undefined) {
    UpdateActivity(_stepsContainer, activities.steps);
  }

  // Calories
  if (activities.calories !== undefined) {
    UpdateActivity(_calsContainer, activities.calories);
  }

  // Active minutes
  if (activities.activeMinutes !== undefined) {
    UpdateActivity(_amContainer, activities.activeMinutes);
  }

  // Disance
  if (activities.distance !== undefined) {
    UpdateActivity(_distContainer, activities.distance);
  }

  // Elevation
  if (simpleActivities.elevationIsAvailable() && activities.elevationGain !== undefined) {
    UpdateActivity(_elevationContainer, activities.elevationGain);
  }
}

function UpdateActivity(container: GraphicsElement, activity: simpleActivities.Activity): void {
  let achievedString = activity.actual.toString();

  // Bar
  updateActivityBar(container, activity, background.style.fill);

  // Text
  // container.x = device.screen.width / 2 + 20 - (achievedString.toString().length * 20);
  let texts = container.getElementsByClassName("stats-text-container")[0].getElementsByTagName("image") as ImageElement[];
  util.display(achievedString, texts);
}

function updateActivityBar(container: GraphicsElement, activity: simpleActivities.Activity, appBackgroundColor: string): void {
  const maxWidth = device.screen.width - 156;
  const bar = container.getElementsByClassName("stat-container-bar")[0] as GraphicsElement;
  const star = container.getElementsByClassName("stat-container-star")[0] as ImageElement;
  const circle = container.getElementsByClassName("stats-icon-container")[0].getElementsByTagName("circle")[0] as CircleElement;

  circle.style.fill = appBackgroundColor;
  // Goals ok
  if (activity.actual >= activity.goal) {
    star.style.display = "inline";
    bar.width = maxWidth;
  }
  else {
    star.style.display = "none";
    bar.width = activityToPercent(activity, maxWidth);
  }
}

function activityToPercent(activity: simpleActivities.Activity, maxWidth: number): number {
  if (activity.goal <= 0) {
    return 0;
  }
  if (activity.goal) {
    return (activity.actual || 0) * maxWidth / activity.goal;
  }
  return 0;
}
// --------------------------------------------------------------------------------
// Heart rate manager
// --------------------------------------------------------------------------------
import * as simpleHRM from "./simple/hrm";
let lastBpm: number;

simpleHRM.initialize((newValue, bpm, zone, restingHeartRate) => {
  // Zones
  if (zone === "out-of-range") {
    imgHRM.href = "images/stat_hr_open_48px.png";
  } else {
    imgHRM.href = "images/stat_hr_solid_48px.png";
  }

  // Animation
  if (newValue) {
    iconHRM.animate("highlight");
  }

  // BPM value display
  if (bpm !== lastBpm) {
    if (bpm > 0) {
      hrmContainer.style.display = "inline";
      let bpmString = bpm.toString();
      hrmTexts[0].href = util.getImageFromLeft(bpmString, 0);
      hrmTexts[1].href = util.getImageFromLeft(bpmString, 1);
      hrmTexts[2].href = util.getImageFromLeft(bpmString, 2);
    } else {
      hrmContainer.style.display = "none";
    }
  }
});