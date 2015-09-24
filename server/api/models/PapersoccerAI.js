var Soccerfield = require('./Soccerfield');
var util = require('../helpers/util');

var PapersoccerAI = function() {
};

PapersoccerAI.prototype.makeMove = function( soccerfield, currentVertex, directions ) {
	for( var i = 0; i < directions.length; i++ ) {
		var dir = directions[i];
		if( soccerfield.canPlay( currentVertex, dir ) ) {
			var moveAgain = soccerfield.isVisited( currentVertex, dir ) && !soccerfield.terminalTest( currentVertex );
			soccerfield.addPlay( currentVertex, dir, 'opponent' );
			var ret = {
				resultingSoccerfield: soccerfield,
				currentVertex: soccerfield.resultingVertex( currentVertex, dir ),
				moveAgain: moveAgain,
				dir: dir
			};
			return ret;
		}
	}
	return undefined;
};

// See http://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array-in-javascript
function shuffle(array) {
    var counter = array.length, temp, index;
    while (counter > 0) {
        index = Math.floor(Math.random() * counter);
        counter--;
        temp = array[counter];
        array[counter] = array[index];
        array[index] = temp;
    }
    return array;
}


PapersoccerAI.prototype.makeMoves = function( soccerfield, currentVertex ) {
	var iterations = 0;
	var moves = [];
	var move;
	var opponentTurn = true;
	var priority1 = ['w', 'nw', 'sw'];
	var priority2 = ['n', 's' ];
	var priority3 = ['e', 'ne', 'se'];
	while( opponentTurn ) {
		if( soccerfield.terminalTest( currentVertex ) ) {
			break;
		}
		iterations += 1;
		if ( iterations > 100 ) {
			// Gives up on making a play
			return false;
		}
		move = this.makeMove( soccerfield, currentVertex, shuffle(priority1) );
		if ( !move ) {
			move = this.makeMove( soccerfield, currentVertex, shuffle(priority2) );
		}
		if ( !move ) {
			move = this.makeMove( soccerfield, currentVertex, shuffle(priority3) );
		}
		if ( !move ) {
			if( moves.length === 0 ) {
				console.warn('No move found - this should be terminal then.');
			}
			break;
		}
		moves.push( move.dir );
		opponentTurn = move.moveAgain;
		soccerfield = move.resultingSoccerfield;
		currentVertex = move.currentVertex;
	}

	return {
		directions: moves,
		currentVertex: currentVertex
	};
};

module.exports = PapersoccerAI;
