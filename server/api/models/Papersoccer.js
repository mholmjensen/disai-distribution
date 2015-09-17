var actionHelper = require('../helpers/action');

var vertexId = function(row, column) {
	return '[' + row + ',' + column + ']';
};

var generateEdges = function( k, width, height ) {
	var edges = {};
	// TODO rim of field

	return edges;
};

var generateVertices = function( k, width, height ) {
	// TODO Make direction lookup tables
	var vertices = {};
	var unreachableRows = [];
	for ( var i = 0; i <= k; i++ ) {
		unreachableRows.push(i);
		unreachableRows.push(height-1-i);
	}
	for( var col = 0; col < width; col++ ) {
		for( var row = 0; row < height; row++ ) {
			if( ( col === 1 || col === width - 2 ) && row == ( height - 1 ) / 2 ) {
				//Goals
			} else if ( ( col === 0 || col === width - 1 ) && unreachableRows.indexOf( row ) > -1 ) {
				// Surrounding nodes
			} else {
				var isTerminal = ( row === 2+k && ( col === 0 || col === width - 1 ) );
				vertices[vertexId(row, col)] = {
					column: col,
					row: row,
					term: isTerminal
				};
			}

		}
	}

	return vertices;
};

var Papersoccer = function(definition) {
	console.log('Papersoccer instantiated: ', definition);

	this.definition = definition;

	this.graph = {
		vertices: {},
		edges: {}
	};


	var k = 1;
	var width = 9 + 2*k;
	var height = 5 + 2*k;
	this.graph.vertices = generateVertices( k, width, height );
	this.graph.edges = generateEdges( k, width, height );
	this.currentVertex = vertexId( 4+k, 2+k );
	this.isAgentsTurn = true;
};

Papersoccer.prototype.actionPlay = function(agent, direction) {
	console.log('Papersoccer: Agent ' + agent.name + ' plays ' + direction);
	console.log('Papersoccer: ', this);
	return actionHelper.notApplicable('papersoccer/play', [direction], 'Opponent is still in training (Not implemented)');
};

module.exports = Papersoccer;
