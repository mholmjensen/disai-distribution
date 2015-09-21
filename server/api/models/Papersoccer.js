var actionHelper = require('../helpers/action');
var util = require('../helpers/util');

//Accepts first argument is row object
var vertexId = function(row, column) {
	if( typeof row === 'object' ) {
		return '[' + row.row + ',' + row.column + ']';
	}
	return '[' + row + ',' + column + ']';
};

var vertexDegree = function( soccerfield, vertex ) {
	if( soccerfield.edges.hasOwnProperty( vertex ) ) {
		console.log( Object.keys( soccerfield.edges[vertex] ) );
		return Object.keys( soccerfield.edges[vertex] ).length;
	}
	return -1;
};


var playable = function( soccerfield, edgeData ) {
	if( soccerfield.vertices.hasOwnProperty( vertexId(edgeData.edgeRootedAt) ) ) {
		console.log( 'playable returns ', !soccerfield.edges[vertexId(edgeData.edgeRootedAt)].hasOwnProperty( edgeData.edgeKey) );
		return !soccerfield.edges[vertexId(edgeData.edgeRootedAt)].hasOwnProperty( edgeData.edgeKey);
	}
	console.log( 'hasOwnE');
	return false;
};

var addEdge = function( soccerfield, type, edgeData ) {
	soccerfield.edges[vertexId( edgeData.edgeRootedAt )][edgeData.edgeKey] = {
		id: vertexId( edgeData.endsAt ),
		type: type
	};
};


var makeMove = function( instance, directions ) {
	for( var i = 0; i < directions.length; i++ ) {
		var dir = directions[i];
		var edgeData = vectorEdgeData( instance.currentVertex, dir );
		// console.log( 'trying ', dir );
		if( playable( instance.soccerfield, edgeData ) ) {
			var endDegree = vertexDegree( instance.soccerfield, vertexId( edgeData.edgeRootedAt ) );
			console.log( endDegree );
			var ret = {
				endDegree: endDegree,
				dir: dir
			};
			addEdge( instance.soccerfield, 'opponent', edgeData );
			instance.currentVertex = edgeData.endsAt;

			return ret;
		}
	}

	console.log('No move was playable at', instance.currentVertex, 'with', directions );
	return undefined;
};


var makeMoves = function( instance ) {
	var iterations = 0;
	var moves = [];
	var move;
	var opponentTurn = true;
	while( opponentTurn ) {
		iterations += 1;
		if ( iterations > 100 ) {
			// TODO forfeit?
			return false;
		}
		move = makeMove( instance, ['w', 'nw', 'sw'] );
		if ( !move ) {
			move = makeMove( instance, ['n', 's' ] );
		}
		if ( !move ) {
			move = makeMove( instance, ['ne', 'e', 'se' ] );
		}
		if ( !move ) {
			if( moves.length === 0 ) {
				console.log('No move found!');
			}
			break;
		}
		moves.push( move.dir );
		// console.log( move.endDegree );
		if ( move.endDegree === 0 ) {
			console.log( 'Found move and now agents turn ',  move.endDegree );
			opponentTurn = false;
		}
	}

	return {
		directions: moves,
		resultingInstance: instance
	};
};

var vectorEdgeData = function( atVertex, direction ) {
	var canonicalVertex = {
		row: atVertex.row,
		column: atVertex.column
	};
	var nextVertex = {
		row: atVertex.row,
		column: atVertex.column
	};
	var directionKey;

	if( direction === 'n' ) {
		nextVertex.row -= 1;
		canonicalVertex.row -= 1;
		directionKey = 'south';
	}
	if( direction === 's' ) {
		nextVertex.row += 1;
		directionKey = 'south';
	}
	if( direction === 'e' ) {
		nextVertex.column += 1;
		directionKey = 'east';
	}
	if( direction === 'w' ) {
		nextVertex.column -= 1;
		canonicalVertex.column -= 1;
		directionKey = 'east';
	}

	if( direction === 'sw' ) {
		nextVertex.row += 1;
		nextVertex.column -= 1;
		directionKey = 'southWest';
	}

	if( direction === 'se' ) {
		nextVertex.row += 1;
		nextVertex.column += 1;
		directionKey = 'southEast';
	}

	if( direction === 'ne' ) {
		nextVertex.row -= 1;
		nextVertex.column += 1;
		canonicalVertex.row -= 1;
		canonicalVertex.column += 1;
		directionKey = 'southWest';
	}

	if( direction === 'nw' ) {
		nextVertex.row -= 1;
		nextVertex.column -= 1;
		canonicalVertex.row -= 1;
		canonicalVertex.column -= 1;
		directionKey = 'southEast';
	}

	return {
		endsAt: nextVertex,
		edgeRootedAt: canonicalVertex,
		edgeKey: directionKey
	};
};


var generateSoccerField = function( k, width, height ) {
	// TODO Make direction lookup tables
	var vertices = {};
	var edges = {};
	var unreachableRows = [];

	var innerSide = 1 + k;
	var centerRow = ( height - 1 ) / 2;

	for ( var i = 0; i <= k; i++ ) {
		unreachableRows.push(i);
		unreachableRows.push(height-1-i);
	}

	for( var col = 0; col < width; col++ ) {
		for( var row = 0; row < height; row++ ) {
			// Reachable vertices
			if( ( col === 1 || col === width - 2 ) && row == centerRow ) {
				//Goals
			} else if ( ( col === 0 || col === width - 1 ) && unreachableRows.indexOf( row ) > -1 ) {
				// Surrounding nodes
			} else {
				var vid = vertexId(row, col);
				var isTerminal = ( row === 2+k && ( col === 0 || col === width - 1 ) );
				vertices[vid] = {
					column: col,
					row: row,
					term: isTerminal
				};

				edges[vid] = {};
				var southVertex = vertexId(row + 1, col);
				var eastVertex = vertexId(row, col+1);
				var westVertex = vertexId(row, col-1);
				// Edges of the rim
				// Sidelines (long sides)
				if( row === 0 || row === height - 1 ) {
					if( 0 < col &&  col < width - 2 ) {
						edges[vid].east = {
							id: eastVertex,
							type: 'initial'
						};
					}
				}
				// Goal lines (two edges in center not created)
				if( col === 1 || col === width - 2 ) {
					if( 0 <= row && row < centerRow - 1 || centerRow < row && row < height - 1 ) {
						edges[vid].south = {
							id: southVertex,
							type: 'initial'
						};
					}
				}
				if( col === 0 || col === width - 1 ) {
					if( row === centerRow - 1 || row == centerRow ) {
						edges[vid].south = {
							id: southVertex,
							type: 'initial'
						};
					}

					if ( row === centerRow - 1 || row === centerRow + 1 ) {
						if( col === 0 ) {
							edges[vid].east = {
								id: eastVertex,
								type: 'initial'
							};
						} else if( col === width - 2 ){
							edges[vid].east = {
								id: eastVertex,
								type: 'initial'
							};
						}
					}
				}
			}
		}
	}

	return {
		vertices: vertices,
		edges: edges
	};
};

var Papersoccer = function(definition) {
	console.log('Papersoccer instantiated: ', definition);

	var k = definition.config.k;
	var width = 9 + 2*k;
	var height = 5 + 2*k;
	this.soccerfield = generateSoccerField( k, width, height );
	this.config = definition.config;
	this.currentVertex = {
		row: 2+k,
		column: 4+k
	};
	this.isAgentsTurn = true;
};

Papersoccer.prototype.actionPlay = function(agent, direction) {
	console.log('Papersoccer: Agent ' + agent.name + ' plays ' + direction);
	return actionHelper.notApplicable('papersoccer/play', [direction], 'Opponent is still in training (Not implemented)');

	try {
		var edgeData = vectorEdgeData( this.currentVertex, direction );

		var movingFrom = vertexId( this.currentVertex );
		var movingTo = vertexId( edgeData.endsAt );
		var edgeFrom = vertexId( edgeData.edgeRootedAt );

		var existingEdges = this.soccerfield.edges[edgeFrom];

		if( this.soccerfield.edges[edgeFrom][edgeData.edgeKey] ) {
			return actionHelper.notApplicable('papersoccer/play', [direction], 'That play has already been made in ' + movingFrom );
		}

		if( !this.soccerfield.vertices.hasOwnProperty( movingTo ) ) {
			return actionHelper.notApplicable('papersoccer/play', [direction], 'Unreachable cell ' + movingTo );
		}

		var degree = vertexDegree( this.soccerfield, edgeFrom );
		console.log( 'degree: ' + degree + ' at ' + edgeFrom );
		this.isAgentsTurn = degree > 0;
		this.currentVertex = edgeData.endsAt;

		addEdge( this.soccerfield, 'agent', edgeData );

		// TODO terminal test

		if( this.isAgentsTurn ) {
			console.log( 'Agent moves again!' );
			return actionHelper.applicable( 'papersoccer/play', [direction], 'Your move [canonical ' + edgeFrom + ', key ' + edgeData.edgeKey + ']' );
		} else {
			console.log('In currentVertex:', this.currentVertex);
			var opponentDecision = makeMoves( util.copy( this ) );
			if ( opponentDecision ) {
				console.log('Would move:', opponentDecision.directions);
				console.log('So currentVertex becomes:', opponentDecision.resultingInstance.currentVertex);
				this.soccerfield = opponentDecision.resultingInstance.soccerfield;
				this.currentVertex = opponentDecision.resultingInstance.currentVertex;
				this.isAgentsTurn = true;
				return actionHelper.applicable( 'papersoccer/play', [direction], 'Opponent made ' + opponentDecision.directions.length + ' moves', opponentDecision.directions );
			} else {
				// TODO Forfeit, no move to be made
			}
			return actionHelper.notApplicable('papersoccer/play', [direction], 'Opponent is still in training (Not implemented)');
		}
	} catch ( e ) {
		console.log( e );
		console.log(e.stack);
		return actionHelper.applicable( 'papersoccer/play', [direction], 'canonical ' + edgeFrom + ', key ' + edgeData.edgeKey );
	}
};


module.exports = Papersoccer;
