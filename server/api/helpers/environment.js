var state = require('../models/state.js');

var actionHelper = require('./action.js');

var actionHistory = [];
var stateHistory = [];

stateHistory.push( state.current );
var envStartResult = actionHelper.applicable('environment/start', [], 'Environment started');
envStartResult.action.agentToken = 'environment';
actionHistory.push( envStartResult.action );

module.exports = {
	addResult: addResult,
	getHistory: getHistory,
};

function addResult( agent, result, fullResponse ) {
	// Complete the result
	result.action.agentToken = agent.token;
	if( fullResponse ) {
		result.state = state.current; // Adding this here ensures that it is on the answer to the client for the action
	}

	// Add latest action to agent
	agent.performedAction(result.action);

	// Update history
	actionHistory.push( result.action );
	stateHistory.push( state.current );
}

function getHistory(since, count) {
	if (typeof since === 'undefined') {
		// If 'since' is not specified, return the latest point
		since = stateHistory.length - 1;
	}

	var noEntriesToReturn = Number.MAX_VALUE;
	if (!(typeof count === 'undefined' || count === 0)) {
		// If 'count' is specified, limit the number of entries returned
		noEntriesToReturn = count;
	}

	if ( since > stateHistory.length ) {
		return {
			since: since,
			next: stateHistory.length,
			actions: [],
			states: []
		};
	}

	var ahist = [];
	var shist = [];

	for (var i = stateHistory.length - 1, counter = 0; i >= since && counter < noEntriesToReturn; i--, counter++) {
		ahist.push( actionHistory[i] );
		shist.push( stateHistory[i] );
	}

	ahist.reverse();
	shist.reverse();

	return {
		since: since,
		next: stateHistory.length,
		actions: ahist,
		states: shist
	};
}
