var state = require('../models/state.js');
var actionHelper = require('../helpers/action');
var environmentHelper = require('../helpers/environment');

var Navigation = require('../models/Navigation');

module.exports = {
  enter: enter,
  lane: lane,
  leave: leave,
};

function enter(req, res) {
  var agent = state.current.agents[req.dai.agentToken];

  agent.setBusyWith('navigation');
	var activityDefinition = state.current.map.getActivityDef(agent.locationId, 'navigation');
  state.current.navigation[agent.token] = new Navigation(activityDefinition);
  var result = actionHelper.applicable( 'navigation/enter', [] );

  environmentHelper.addResult(agent, result );
  res.json(result);
}

function lane(req, res) {
  var direction = req.swagger.params.direction.value;
  var agent = state.current.agents[req.dai.agentToken];

	var navModel = state.current.navigation[agent.token];
	var result = navModel.actionLane( agent, direction );

  environmentHelper.addResult(agent, result );
  res.json( result );
}

function leave(req, res) {
  var agent = state.current.agents[req.dai.agentToken];

	agent.setBusyWith();
	delete state.current.navigation[agent.token];
	var result = actionHelper.applicable( 'navigation/leave', [] );

  environmentHelper.addResult(agent, result );
  res.json( result );
}
