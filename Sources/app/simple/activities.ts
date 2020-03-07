import * as utils from "./utils";
// To know user activities
import { goals, today } from "user-activity";
import { me as appbit } from "appbit";
import { units } from "user-settings";

// Types used as result
export class Activities {
    steps: Activity;
    elevationGain: Activity;
    calories: Activity;
    activeMinutes: Activity;
    distance: Activity;
}
export class Activity {
    // constructor
    constructor(acual: number, goal: number) {
        this.actual = acual;
        this.goal = goal;
    }
    // Properties
    goal: number;
    actual: number;
}

// Last values
let _lastSteps: Activity;
let _lastElevationGain: Activity;
let _lastCalories: Activity;
let _lastActiveMinutes: Activity;
let _lastDistance: Activity;

// Call back to requestin interface update
let _updateCallback: () => void;

// Detect limitations of versa light
const _elevationIsAvailable = appbit.permissions.granted("access_activity")
    && today.local.elevationGain !== undefined;

// Allow to detect elevation capacity on others device than versa light
export function elevationIsAvailable(): Boolean {
    return _elevationIsAvailable;
}

// Initialize this helper
export function initialize(callback: () => void): void {
    // Set call back
    _updateCallback = callback;
}

// When goal is reached
goals.onreachgoal = (evt) => {
    if (_updateCallback === undefined) return;
    _updateCallback();
};

// Return activities if updates and updated values form previous states (if requested)
// No values are set if the old values haven't changed
export function getNewValues(): Activities {
    // Init
    const result = new Activities();

    // Get current acticities
    const steps = new Activity(today.local.steps, goals.steps);
    const calories = new Activity(today.local.calories, goals.calories);
    const activeMinutes = new Activity(today.local.activeMinutes, goals.activeMinutes);
    const distance = getDistances();

    if (valueChanged(steps, _lastSteps)) {
        _lastSteps = steps;
        result.steps = steps;
    }
    if (valueChanged(calories, _lastCalories)) {
        _lastCalories = calories;
        result.calories = calories;
    }
    if (valueChanged(activeMinutes, _lastActiveMinutes)) {
        _lastActiveMinutes = activeMinutes;
        result.activeMinutes = activeMinutes;
    }
    if (valueChanged(distance, _lastDistance)) {
        _lastDistance = distance;
        result.distance = distance;
    }
    if (_elevationIsAvailable) {
        const elevationGain = new Activity(today.local.elevationGain, goals.elevationGain);
        if (valueChanged(elevationGain, _lastElevationGain)) {
            _lastElevationGain = elevationGain;
            result.elevationGain = elevationGain;
        }
    }

    // Return the result
    return result;
}

// Get Distances based on user units
function getDistances(): Activity {
    // Metric
    if (units.distance === "metric") {
        return new Activity(today.local.distance, goals.distance);
    }
    // Us
    // Then metric->miles
    return new Activity(
        metrics2Miles(today.local.distance),
        metrics2Miles(goals.distance));
}

// Convert metric to milles
function metrics2Miles(value: number): number {
    return (value * 0.00062137).toFixed(2) as unknown as number;
}

// Test if a activity has changed
function valueChanged(actual: Activity, last: Activity) {
    return last === undefined
        || actual.actual !== last.actual
        || actual.goal !== last.goal;
}

// Render an activity to an arc control (with goal render and colors update)
export function updateActivityArc(container: GraphicsElement, activity: Activity, appBackgroundColor: string): void {
    let arc = container.getElementsByTagName("arc")[1] as ArcElement; // First Arc is used for background
    let circle = container.getElementsByTagName("circle")[0] as CircleElement;
    let image = container.getElementsByTagName("image")[0] as ImageElement;

    // Goals ok
    if (activity.actual >= activity.goal) {
        circle.style.display = "inline";
        arc.style.display = "none";
        image.style.fill = appBackgroundColor;
    }
    else {
        circle.style.display = "none";
        arc.style.display = "inline";
        arc.sweepAngle = utils.activityToAngle(activity.goal, activity.actual);
        if (container.style.fill)
            image.style.fill = container.style.fill;
    }
}

// Reset stats (force the interface update)
export function reset(): void {
    _lastSteps = undefined;
    _lastElevationGain = undefined;
    _lastCalories = undefined;
    _lastActiveMinutes = undefined;
    _lastDistance = undefined;
}