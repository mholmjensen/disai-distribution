var fs = require('fs');

var extend = require('extend');

var actionHelper = require('../helpers/action');

var Map = function(jsonPath) {
	extend(this, JSON.parse(fs.readFileSync(jsonPath)));
};

Map.prototype.actionEnter = function(agent) {
	agent.locationId = Object.keys(this.locations)[0];

	return actionHelper.applicable('map/enter', []);
};

Map.prototype.actionMetro = function(agent, direction) {
	var currentLocation = agent.locationId;
	var edge = this.metro[currentLocation][direction];
	var nextLocation = Object.keys( edge )[0];
	var weight = edge[nextLocation];

	agent.locationId = nextLocation;
	agent.utility -= weight;

	var description = 'Moving from ' + currentLocation + ' to ' + nextLocation + ' with w = ' + weight;
	return actionHelper.applicable('map/metro', [direction], description);
};

Map.prototype.actionBike = function(agent, locationId) {
	if (!this.locations.hasOwnProperty(locationId)) {
		return actionHelper.notApplicable('map/bike', [locationId], 'Unknown locationId');
	}

	var currentLocation = agent.locationId;
	agent.locationId = locationId;
	agent.utility -= 15;

	var description = 'Moving from ' + currentLocation + ' to ' + locationId + ' with w = -15';
	return actionHelper.applicable('map/bike', [locationId], description);
};

Map.prototype.actionLeave = function(agent) {
	agent.locationId = undefined;

	return actionHelper.applicable('map/leave', []);
};

Map.prototype.getActivityDef = function(locationId, activityId) {
	if (typeof locationId === 'undefined' || typeof activityId === 'undefined') {
		return false;
	}

	var locationActivities = this.locations[locationId].activities;
	if (locationActivities && locationActivities.hasOwnProperty(activityId)) {
		return locationActivities[activityId];
	}

	return false;
};

Map.prototype.getActivityTitle = function(locationId, activityId) {
	var title = this.getActivityDef(locationId, activityId).title;
	var info = locationId + '/' + activityId;
	if (title) {
		title += ' (' + info + ')';
	} else {
		title = info;
	}

	return title;
};

module.exports = Map;
