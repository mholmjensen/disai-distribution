var Soccerfield = require('./Soccerfield');
var util = require('../helpers/util');

var PapersoccerAISearch = function( extraSearch ) {
	this.extraSearch = extraSearch;
};

var allDirections = ['w', 'nw', 'sw', 'e', 'n', 's', 'ne', 'se'];

PapersoccerAISearch.prototype.actions = function( soccerfield, currentVertex ) {
	var actions = [];
	for( var i = 0; i < allDirections.length; i++ ) {
		if( soccerfield.canPlay( currentVertex, allDirections[i] ) ) {
			actions.push( allDirections[i] );
		}
	}
	return actions;
};

PapersoccerAISearch.prototype.cutoffTest = function( soccerfield, currentVertex, player, depth, strategy ) {
	if ( strategy.maxDepth < depth ) {
		strategy.maxDepthCount++;
		return true;
	}

	if( strategy.maxNodeCount <= strategy.nodeCount ) {
		return true;
	}

	if( soccerfield.terminalTest( currentVertex ) ) {
		strategy.terminalCount++;
		return true;
	}

	return false;
};

PapersoccerAISearch.prototype.heuristicEval = function( soccerfield, currentVertex, player ) {
	if( soccerfield.terminalTest( currentVertex ) ) {
		var util = soccerfield.agentUtility( currentVertex, player === 'agent' );
		
		return util;
	}



	return currentVertex.column; // As we are Min this means we want low columns; i.e. to the left
};

PapersoccerAISearch.prototype.value = function( soccerfield, currentVertex, player, depth, alpha, beta, plan, strategy ) {
	strategy.nodeCount++;
	if( this.cutoffTest( soccerfield, currentVertex, player, depth, strategy ) ) {
		var h = this.heuristicEval( soccerfield, currentVertex, player, depth );
		return h;
	}
	var v = Number.MAX_SAFE_INTEGER; // MIN / opponent
	if( player === 'agent' ) { // MAX
			v = Number.MIN_SAFE_INTEGER;
	}

	var actions = this.actions( soccerfield, currentVertex );
	for( var i = 0; i < actions.length; i++ ) {
		var act = actions[i];
		var resPlan;
		if( depth === 0 ) {
			resPlan = [].concat( plan, [ act ] );
		}

		var cl = soccerfield.sfClone();
		var moveAgain = cl.isVisited( currentVertex, act );
		var resVertex = cl.resultingVertex( currentVertex, act );
		cl.addPlay( currentVertex, act, player );
		moveAgain = moveAgain && !cl.isGoal( resVertex );

		var resPlayer = player;
		var resDepth = depth;

		if( !moveAgain ) {
			resDepth += 1;
			resPlayer = player === 'agent' ? 'opponent' : 'agent';
		}

		// Prune candidates
		if( !moveAgain && depth === 0 && strategy.candidates.length > strategy.maxCandidates ) {
			continue;
		}

		// Candidate plan even before we know its value
		if( !moveAgain && depth === 0 ) {
			var candidate = {
				plan: resPlan,
				value: undefined
			};
			strategy.candidates.push( candidate );
		}

		var resValue = this.value( cl, resVertex, resPlayer, resDepth, alpha, beta, resPlan, strategy );

		if( !moveAgain && depth === 0 ) {
			var candIndex = strategy.candidates.length - 1;
			strategy.candidates[candIndex].value = resValue; // We now have the value
			if( resValue < strategy.bestPlanValue ) {
				strategy.bestPlan = resPlan;
				strategy.bestPlanValue = resValue;
			}
		}


		if( player === 'agent' ) {
			v = Math.max(v, resValue);
			if( v >= beta ) {
				return v;
			}
			alpha = Math.max( alpha, v );
		}

		if( player === 'opponent' ) {
			v = Math.min(v, resValue);
			if( v <= alpha ) {
				return v;
			}
			beta = Math.min( beta, v );
		}
	}
	return v;
};

var searchStrategy = function( maxDepth, maxNodeCount, maxCandidates ) {
	return {
		nodeCount: 0,
		terminalCount: 0,
		maxDepthCount: 0,
		candidates: [],
		bestPlan: undefined,
		bestPlanValue: Number.MAX_SAFE_INTEGER,
		maxDepth: maxDepth,
		maxNodeCount: maxNodeCount,
		maxCandidates: maxCandidates
	};
};

PapersoccerAISearch.prototype.alphaBetaSearch = function( soccerfield, currentVertex ) {
	var plan = [];

	var strategy1 = searchStrategy( 2, 2500, 9 );
	this.value( soccerfield.sfClone(), currentVertex, 'opponent', 0, Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, [], strategy1 );

	plan = strategy1.bestPlan;

	if( this.extraSearch ) {
		var strategy2 = searchStrategy( 0, 1500, 50 );
		this.value( soccerfield.sfClone(), currentVertex, 'opponent', 0, Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, [], strategy2 );


		if( strategy2.bestPlanValue <= strategy1.bestPlanValue ) {
			plan = strategy2.bestPlan;
		}
	}

	return plan;
};

PapersoccerAISearch.prototype.makeMoves = function( soccerfield, currentVertex ) {
	var plan = this.alphaBetaSearch( soccerfield, currentVertex );
	return {
		directions: plan
	};
};

module.exports = PapersoccerAISearch;
