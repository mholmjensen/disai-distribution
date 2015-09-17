var hat = require('hat');
var rack = hat.rack();

var actionHelper = require('../helpers/action');
var environmentHelper = require('../helpers/environment');

var state = require('../models/state');
var Agent = require('../models/Agent');

var connectionsMade = 0;

module.exports = {
	history: history,
	connect: connect,
	leave: leave,
	agent_say: agent_say,
};

function history(req, res) {
	var since = req.swagger.params.since.value;
	var count = req.swagger.params.count.value;
	res.json(environmentHelper.getHistory(since, count));
}

function connect(req, res) {
	var name = req.swagger.params.name.value;

	var token = rack();
	var newAgent = new Agent( token, name );
	state.current.agents[newAgent.token] = newAgent;
	connectionsMade++;
	res.json({
		agentToken: newAgent.token,
		state: state.current
	});
}

function leave(req, res) {
	var agent = state.current.agents[req.dai.agentToken];

	// Cleanup problem instances
	for (var stateProp in state.current) {
		if (state.current.hasOwnProperty(stateProp)) {
			if (stateProp in state.notActivities) {
				// Don't cleanup in those
				continue;
			}

			var sProp = state.current[stateProp];

			for (var innerProp in sProp) {
				if (sProp.hasOwnProperty(innerProp)) {
					if (innerProp === agent.token) {
						// Deleting agent data for some problem instance
						delete sProp[innerProp];
					}
				}
			}
		}
	}

	// Cleanup Agent
	agent.leave();

	var result = actionHelper.applicable('environment/leave', []);

	environmentHelper.addResult(agent, result);

	res.json(result);
}

function agent_say(req, res) {
	var message = req.swagger.params.message.value;
	var agent = state.current.agents[req.dai.agentToken];

	var result = agent.actionSay(message);

	environmentHelper.addResult(agent, result );
	res.json(result);
}
