var debug = require('debug')('disai:middleware:applicability');

var actionHelper = require('./action');
var environmentHelper = require('./environment');

var state = require('../models/state.js');

var pathRegEx = /([^/]+)/g;

module.exports = {
	middleware: middleware,
};

function middleware() {
	debug('Initializing disai applicability middleware');

	return function(req, res, next) {
		var apiPath = req.swagger.apiPath;

		// Early out for /environment
		if (apiPath.indexOf('/environment') === 0) {
			return next();
		}

		var agent = state.current.agents[req.dai.agentToken];

		// Find Swagger parameters
		var params = [];
		var swaggerParams = req.swagger.params;
		for (var paramName in swaggerParams) {
			if (swaggerParams.hasOwnProperty(paramName) && swaggerParams[paramName].hasOwnProperty('value')) {
				params.push(swaggerParams[paramName].value);
			}
		}

		// If 'result' gets defined here, answer will be sent to client without consulting controllers.
		var result;

		// Early out for server paused
		if (!state.current.actionsEnabled) {
			result = actionHelper.notApplicable(apiPath, params, 'Actions not enabled');
		}

		// In /map or /<activity>
		var pathSegments = apiPath.match(pathRegEx);
		if (!result && pathSegments.length > 1) {
			var activityId = pathSegments[0];
			var action = pathSegments[1];

			// Allow map/enter for agents without locationId (i.e. hasn't entered map)
			if (typeof agent.locationId === 'undefined' && !(activityId === 'map' && action === 'enter')) {
				result = actionHelper.notApplicable(activityId + '/' + action, params, 'Agent has not entered the map');
			}

			// Check map actions
			if (!result && activityId === 'map') {
				if (agent.isBusy) {
					result = actionHelper.notApplicable(activityId + '/' + action, params, 'Agent is busy');
				}
			}

			// Check activity actions
			if (!result && !(activityId in state.notActivities)) {
				switch (action) {
					case 'enter': {
						var activityDefinition = state.current.map.getActivityDef(agent.locationId, activityId);
						if (agent.isBusy) {
							result = actionHelper.notApplicable(activityId + '/' + action, params, 'Agent is busy');
						} else if (!activityDefinition) {
							result = actionHelper.notApplicable(activityId + '/' + action, params, 'Activity "' + activityId + '" not available at the agents current location.');
						}
						break;
					}
					default: {
						if (!agent.isBusyWith(activityId)) {
							result = actionHelper.notApplicable(activityId + '/' + action, params, 'Agent has not entered this activity');
						}
					}
				}
			}
		}

		if (result) {
			environmentHelper.addResult(agent, result);
			return res.json(result);
		}

		next();
	};
}