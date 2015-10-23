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

Map.prototype.navigationEntered = function(agent, activityDefinition) {
	var currSeed = parseInt( activityDefinition.config.seed );
	var locIds = Object.keys( this.locations );
	var activityCount = this.activityCount( 'navigation' );
	var map = this;

	var originalSeed = activityDefinition.config.seed;

	var fractionWidth = Math.floor( parseInt( activityDefinition.config.size.columns ) / 4 );
	var price = originalSeed * fractionWidth;
	agent.utility -= price;

	var newSeed = parseInt( originalSeed / 2 );
	var distSeed = originalSeed - newSeed;
	if( distSeed > activityCount ) {
		var putbackSeed = distSeed % ( activityCount - 1 );
		distSeed -= putbackSeed;
		activityDefinition.config.seed = newSeed + putbackSeed;
		var giveSeed = distSeed / ( activityCount - 1 );

		locIds.forEach(function(key) {
	  	var activity = map.getActivityDef(key, 'navigation');
			if ( activity ) {
				if( JSON.stringify( activity ) !== JSON.stringify( activityDefinition ) ) {
					activity.config.seed = activity.config.seed + giveSeed;
				}
			}
		});
	}
};
var _activityCount = {};
Map.prototype.activityCount = function( activityId ) {
	if ( !_activityCount.hasOwnProperty(activityId) ) {
		_activityCount[activityId] = 0;
		var map = this;
		Object.keys( this.locations ).forEach( function( key ) {
	  	var activity = map.getActivityDef( key , 'navigation');
			if ( activity ) {
				_activityCount[activityId]++;
			}
		});
	}

	return _activityCount[activityId];
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
