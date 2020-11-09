import { me } from "appbit";
import { display } from "display";
import { HeartRateSensor } from "heart-rate";
import { user } from "user-profile";

type DefaultZone = 'out-of-range' | 'fat-burn' | 'cardio' | 'peak';
type UserDefinedZone = 'below-custom' | 'custom' | 'above-custom';

let hrm: HeartRateSensor;
let watchID: number | null;
declare type HrmCallback = (newValue: boolean,
  bpm: number,
  zone: DefaultZone | UserDefinedZone | undefined,
  restingHeartRate: number | undefined) => void;

let hrmCallback: HrmCallback;
let lastReading: number | null;

export function initialize(callback: HrmCallback): void {
  if (HeartRateSensor
    && me.permissions.granted("access_heart_rate")
    && me.permissions.granted("access_user_profile")) {
    hrmCallback = callback;
    hrm = new HeartRateSensor();
    setupEvents();
    start();
    lastReading = hrm.timestamp;
  } else {
    console.log("Denied Heart Rate or User Profile permissions");
    callback(false, 0, undefined, undefined);
  }
}

// Read data
function getReading(): void {
  let newValue = hrm.timestamp !== lastReading;
  let heartRate = hrm.heartRate || 0;
  lastReading = hrm.timestamp;

  hrmCallback(
    newValue,
    heartRate,
    user.heartRateZone(heartRate),
    user.restingHeartRate);
}

// Manage Events 
function setupEvents(): void {
  // Dispay chanded
  display.onchange = (e) => {
    if (display.on) {
      start();
    } else {
      stop();
    }
  };
  // Errors
  hrm.onerror = (e) => {
    hrmCallback(false, 0, undefined, undefined);
  };
}

// Start Hrm
export function start(): void {
  if (!watchID) {
    hrm.start();
    getReading();
    watchID = setInterval(getReading, 1000);
  }
}

// Stop hrm
export function stop(): void {
  hrm.stop();
  if (watchID !== null) clearInterval(watchID);
  watchID = null;
}