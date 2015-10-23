var state = require('../models/state.js');
var actionHelper = require('../helpers/action');
var environmentHelper = require('../helpers/environment');

var Papersoccer = require('../models/Papersoccer');

module.exports = {
  enter: enter,
  play: play,
  leave: leave,
};

function enter(req, res) {
  var agent = state.current.agents[req.dai.agentToken];

  agent.setBusyWith('papersoccer');
  var activityDefinition = state.current.map.getActivityDef(agent.locationId, 'papersoccer');
  state.current.papersoccer[agent.token] = new Papersoccer(activityDefinition);
  var result = actionHelper.applicable('papersoccer/enter', []);

  environmentHelper.addResult(agent, result, true);
  res.json(result);
}

function play(req, res) {
  var direction = req.swagger.params.direction.value;
  var agent = state.current.agents[req.dai.agentToken];

  var psModel = state.current.papersoccer[agent.token];
  var result = psModel.actionPlay(agent, direction);

  environmentHelper.addResult(agent, result);
  res.json(result);
}

function leave(req, res) {
  var agent = state.current.agents[req.dai.agentToken];
  var psModel = state.current.papersoccer[agent.token];
  var penalty = psModel.costOfLeaving();

  agent.setBusyWith();
  delete state.current.papersoccer[agent.token];
  var result = actionHelper.applicable('papersoccer/leave', []);
  if ( penalty > 0 ) {
    agent.utility -= penalty;
    result = actionHelper.applicable('papersoccer/leave', [], 'Your forfeit lost you ' + penalty + ' discredits');
  }

  environmentHelper.addResult(agent, result, true);
  res.json(result);
}
