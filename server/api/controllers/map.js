var state = require('../models/state');
var actionHelper = require('../helpers/action');
var environmentHelper = require('../helpers/environment');

module.exports = {
	enter: enter,
	metro: metro,
	bike: bike,
	leave: leave,
};

function enter(req, res) {
	var agent = state.current.agents[req.dai.agentToken];

	var result = state.current.map.actionEnter(agent);

	environmentHelper.addResult(agent, result, true);
  res.json(result);
}

function metro(req, res) {
	var direction = req.swagger.params.direction.value;
	var agent = state.current.agents[req.dai.agentToken];

	var result = state.current.map.actionMetro(agent, direction);

	environmentHelper.addResult(agent, result );
	res.json(result);
}

function bike(req, res) {
	var locationId = req.swagger.params.locationId.value;
	var agent = state.current.agents[req.dai.agentToken];

	var result = state.current.map.actionBike(agent, locationId);

	environmentHelper.addResult(agent, result );
	res.json(result);
}

function leave(req, res) {
	var agent = state.current.agents[req.dai.agentToken];

	var result = state.current.map.actionLeave(agent);

	environmentHelper.addResult(agent, result, true);
  res.json(result);
}
