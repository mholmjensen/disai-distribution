var util = require('../helpers/util');

var vertexId = function(row, column) {
	if( typeof row === 'object' ) {
		return '[' + row.row + ',' + row.column + ']';
	}
	return '[' + row + ',' + column + ']';
};

var vectorToEdge = function ( at, direction ) {
	var deltaRow = 0, deltaColumn = 0;
	var opposite1 = '', opposite2 = '';

	if( direction.indexOf('n') > -1 ) {
		deltaRow -= 1;
		opposite1 = 's';
	}
	if( direction.indexOf('s') > -1 ) {
		deltaRow += 1;
		opposite1 = 'n';
	}
	if( direction.indexOf('w') > -1 ) {
		deltaColumn -= 1;
		opposite2 = 'e';
	}
	if( direction.indexOf('e') > -1 ) {
		deltaColumn += 1;
		opposite2 = 'w';
	}

	if (deltaRow === 0 && deltaColumn === 0) {
		console.warn('Not a vector');
		throw new Error();
	}
	var tail = {
		row: at.row,
		column: at.column
	};
	var head = {
		row: at.row + deltaRow,
		column: at.column + deltaColumn
	};

	return {
		from: tail,
		to: head,
		oppositeDirection: opposite1 + opposite2
	};
};

var Soccerfield = function ( width, height, k ) {
  this.width = width;
	this.height = height;
  this.k = k;
	this.playsMade = 0;
};

Soccerfield.prototype.sfClone = function( ) {
	var clone = new Soccerfield( this.width, this.height, this.k );
	clone.playsMade = this.playsMade;
	clone.vertices = util.copy( this.vertices );
	clone.edges = util.copy( this.edges );
	return clone;
};

Soccerfield.prototype.isGoal = function( at ) {
	return at.row === 2 + this.k && ( at.column === 0 || at.column === this.width -1 );
};

Soccerfield.prototype.isClosedin = function( at ) {
	var dirs = [ 'n', 'w', 's', 'e', 'nw', 'ne', 'sw', 'se'];
	for( var i = 0; i < dirs.length; i++ ) {
		if( this.canPlay( at, dirs[i] ) ) {
			return false;
		}
	}
	return true;
};

Soccerfield.prototype.terminalTest = function( at ) {
	if ( this.isGoal( at ) ) {
		return true;
	}
	return this.isClosedin( at );
};

Soccerfield.prototype.agentUtility = function( at, isAgentsTurn ) {
	var closedIn = this.isClosedin(at);
	if( closedIn && isAgentsTurn ) {
		return -this.playsMade;
	}
	if( closedIn && !isAgentsTurn ) {
		return this.playsMade;
	}
	var isGoal = this.isGoal(at);
	if( isGoal && at.column === 0 ) {
		return -this.playsMade;
	}
	if( isGoal && at.column !== 0 ) {
		return this.playsMade;
	}

	// In case this is not terminal, we use this number to penalize leaving
	return this.playsMade;
};

Soccerfield.prototype.addEdge = function( from, to, type ) {
	this.vertices[from].visited = true;
	this.vertices[to].visited = true;
	this.edges[from][to] = type;
	this.edges[to][from] = type;
};

Soccerfield.prototype.isPlayableEdge = function( from, to ) {
	if( !this.vertices.hasOwnProperty( from ) || !this.vertices.hasOwnProperty( to ) ) {
		return false;
	}
  return !this.edges[from].hasOwnProperty( to ) && !this.edges[to].hasOwnProperty( from );
};

Soccerfield.prototype.addPlay = function( at, direction, type ) {
	var edge = vectorToEdge( at, direction );
	var idFrom = vertexId(edge.from);
	var idTo = vertexId(edge.to);
	this.vertices[idFrom][direction] = type;
	this.vertices[idTo][edge.oppositeDirection] = type;
	this.addEdge( idFrom, idTo, type );
	if( type === 'agent' || type === 'opponent' ) {
		this.playsMade++;
	}
};

Soccerfield.prototype.canPlay = function( at, direction ) {
	var edge = vectorToEdge( at, direction );
	var isp = this.isPlayableEdge( vertexId( edge.from ), vertexId( edge.to ) );
	return isp;
};

Soccerfield.prototype.isVisited = function( at, direction ) {
	var edge = vectorToEdge( at, direction );
	if( !this.vertices.hasOwnProperty( vertexId( edge.to ) ) ) {
		return true; // Unreachable vertices have already been visited
	}
	return this.vertices[vertexId( edge.to )].hasOwnProperty( 'visited' );
};

Soccerfield.prototype.resultingVertex = function( at, direction ) {
	var edge = vectorToEdge( at, direction );
	return edge.to;
};

Soccerfield.prototype.makeInitial = function() {
	this.vertices = {};
	this.edges = {};	// v1 v2 "initial|player|opponent"

	var edges = {};
	var unreachableRows = [];

	var innerSide = 1 + this.k;
	var centerRow = ( this.height - 1 ) / 2;

	for ( var i = 0; i <= this.k; i++ ) {
		unreachableRows.push(i);
		unreachableRows.push(this.height-1-i);
	}
	var col, row;
	var unreachable, middleOfGoal;
	for( col = 0; col < this.width; col++ ) {
		for( row = 0; row < this.height; row++ ) {
			unreachable = ( ( col === 1 || col === this.width - 2 ) && row === centerRow );
			middleOfGoal = ( ( col === 0 || col === this.width - 1 ) && unreachableRows.indexOf( row ) > -1 );
			if( !unreachable && !middleOfGoal ) {
				var vertex = {
					column: col,
					row: row,
					type: ( row === 2 + this.k && ( col === 0 || col === this.width - 1 ) ) ? 'terminal' : ''
				};
				var vId = vertexId( vertex );
				this.vertices[vId] = vertex;
				this.edges[vId] = {};
			}
		}
	}

	for( col = 0; col < this.width; col++ ) {
		for( row = 0; row < this.height; row++ ) {
			unreachable = ( ( col === 1 || col === this.width - 2 ) && row === centerRow );
			middleOfGoal = ( ( col === 0 || col === this.width - 1 ) && unreachableRows.indexOf( row ) > -1 );
			if( !unreachable && !middleOfGoal ) {
				var vert = {
					row: row,
					column: col
				};
					// Edges of the rim
					// Sidelines (long sides)
				if( row === 0 || row === this.height - 1 ) {
					if( 0 < col &&  col < this.width - 2 ) {
						this.addPlay( vert, 'e', 'initial' );
					}
				}
				// Goal lines (two edges in center not created)
				if( col === 1 || col === this.width - 2 ) {
					if( 0 <= row && row < centerRow - 1 || centerRow < row && row < this.height - 1 ) {
						this.addPlay( vert, 's', 'initial' );
					}
				}
				if( col === 0 || col === this.width - 1 ) {
					if( row === centerRow - 1 || row == centerRow ) {
						this.addPlay( vert, 's', 'initial' );
					}

					if ( row === centerRow - 1) {
						if( col === 0 ) {
							this.addPlay( vert, 'e', 'initial' );
							this.addPlay( vert, 'ne', 'initial' );
						} else if( col === this.width - 1 ){
							this.addPlay( vert, 'w', 'initial' );
							this.addPlay( vert, 'nw', 'initial' );
						}
					} else if ( row === centerRow + 1 ) {
						if( col === 0 ) {
							this.addPlay( vert, 'e', 'initial' );
							this.addPlay( vert, 'se', 'initial' );
						} else if( col === this.width - 1 ){
							this.addPlay( vert, 'w', 'initial' );
							this.addPlay( vert, 'sw', 'initial' );
						}
					}
				}
			}
		}
	}
};

module.exports = Soccerfield;
