var actionHelper = require('../helpers/action');
var util = require('../helpers/util');
var Soccerfield = require('./Soccerfield');

var OpponentSimple = require('./PapersoccerAI');
var OpponentSearch = require('./PapersoccerAI-Search');
//Accepts first argument is row object
var vertexId = function(row, column) {
	if( typeof row === 'object' ) {
		return '[' + row.row + ',' + row.column + ']';
	}
	return '[' + row + ',' + column + ']';
};

var Papersoccer = function(definition) {
	var k = definition.config.k;
	var width = 9 + 2*k;
	var height = 5 + 2*k;
	this.soccerfield = new Soccerfield( width, height, k );
	this.soccerfield.makeInitial();
	this.config = definition.config;
	this.currentVertex = {
		row: 2+k,
		column: 4+k
	};
	this.isAgentsTurn = true;
	this.opponentForfeit = false;
	this.terminated = false;
	this.discreditsAwarded = 0;
};

Papersoccer.prototype.costOfLeaving = function() {
	if ( this.soccerfield.terminalTest( this.currentVertex ) ) {
		return 0;
	}
	var bu = this.soccerfield.agentUtility( this.currentVertex, this.isAgentsTurn );
	var discredits = bu < 0 ? -bu : bu * this.config.seed;
	return discredits;
};

Papersoccer.prototype.terminalResponse = function( agent, direction ) {
	if ( this.soccerfield.terminalTest( this.currentVertex ) ) {
		this.terminated = true;
		var bu = this.soccerfield.agentUtility( this.currentVertex, this.isAgentsTurn );
		var discredits = bu * this.config.seed;
		agent.utility += discredits;
		this.discreditsAwarded = discredits;
		if( bu > 0 ) {
			return actionHelper.applicable( 'papersoccer/play', [direction], 'Congratulations, you won and earned yourself ' + discredits + ' discredits.' );
		} else {
			return actionHelper.applicable( 'papersoccer/play', [direction], 'Ugh, you lost and have to pay ' + discredits + ' discredits.' );
		}
	}
	return undefined;
};

Papersoccer.prototype.actionPlay = function(agent, direction) {
	if( this.opponentForfeit ) {
		return actionHelper.notApplicable('papersoccer/play', [direction], 'Your opponent forfeited.');
	}

	if( this.terminated ) {
		return actionHelper.notApplicable('papersoccer/play', [direction], 'The game is over.');
	}

	if( !this.soccerfield.canPlay( this.currentVertex, direction ) ) {
		return actionHelper.notApplicable('papersoccer/play', [direction], 'That play is not allowed in ' + vertexId(this.currentVertex));
	}
	this.isAgentsTurn = this.soccerfield.isVisited( this.currentVertex, direction );
	this.soccerfield.addPlay( this.currentVertex, direction, 'agent' );
	this.currentVertex = this.soccerfield.resultingVertex( this.currentVertex, direction );
	var termResponse = this.terminalResponse( agent, direction );
	if( termResponse ) {
		return termResponse;
	}

	if( this.isAgentsTurn ) {
		return actionHelper.applicable( 'papersoccer/play', [direction], 'Your move once more, from ' + vertexId(this.currentVertex) );
	}

	// TODO determine opponent from type
	var opp;

	if( this.config.type === 'bodega' ) {
		opp = new OpponentSimple();
	} else if( this.config.type === 'amateur') {
			opp = new OpponentSearch( false );
	} else if ( this.config.type === 'pro' ) {
			opp = new OpponentSearch( true );
	}

	var sf = this.soccerfield.sfClone();
	var dec = opp.makeMoves( sf, util.copy( this.currentVertex ) );
	if ( dec ) {
		for( var i = 0; i < dec.directions.length; i++ ) {
			this.isAgentsTurn = this.soccerfield.isVisited( this.currentVertex, direction );
			this.soccerfield.addPlay( this.currentVertex, dec.directions[i], 'opponent' );
			this.currentVertex = this.soccerfield.resultingVertex( this.currentVertex, dec.directions[i] );
		}

		termResponse = this.terminalResponse( agent, direction );
		if( termResponse ) {
			return termResponse;
		}

		return actionHelper.applicable( 'papersoccer/play', [direction], 'Opponent made ' + dec.directions.length + ' plays', dec.directions );
	}

	// Means opponent couldn't come up with a move, so we forfeit
	this.opponentForfeit = true;
	this.terminated = true;
	var bu = this.soccerfield.agentUtility( this.currentVertex, this.isAgentsTurn );
	var discredits = bu < 0 ? -bu : bu * this.config.seed;
	agent.utility += discredits;
	this.discreditsAwarded = discredits;
	return actionHelper.applicable( 'papersoccer/play', [direction], 'Opponent forfeited earning you ' + discredits + ' discredits.', dec.directions );
};


module.exports = Papersoccer;
