var actionHelper = require('../helpers/action');
var extend = require('extend');

var vertexId = function(rc) {
	return '[' + rc.row + ',' + rc.column + ']';
};

// Captures the row and column from a vertexId
var vidRegEx = /^\[(\d+)\,(\d+)\]$/;

var vidToRc = function(vid) {
	var data = vid.match(vidRegEx);

	var row = parseInt(data[1]);
	var column = parseInt(data[2]);

	return rc(row, column);
};

var rc = function(row, column) {
	return {
		row: row,
		column: column
	};
};

// vertex = function({row:val, column:val}, weight)
var vertex = function(rc, weight, specialKey) {
	rc.weight = Math.round(weight);
	if (specialKey) {
		rc.type = specialKey;
	}

	return rc;
};

var isSpecialVertex = function( rc ) {
	if( rc.weight === undefined || rc.weight === -10000 ) {
		return true;
	}

	return false;
};

var insertBaseWeights = function( config, vertices ) {
	var bw = parseInt( config.seed );
	for(c = 0; c < config.size.columns; c++) {
		for(r = 0; r < config.size.rows; r++) {
			var current = rc(r, c);
			vertices[vertexId(current)] = vertex(current, bw);
		}
	}
};

var insertSpecialWeights = function( config, vertices ) {
	var vret = {};
	var specialsAll = config.specials;
	var specialsKeys = Object.keys( specialsAll );
	var specialsCount = specialsKeys.length;
	for(c = 0; c < config.size.columns; c++) {
		for(r = 0; r < config.size.rows; r++) {
			var current = rc(r, c);
			var specialKey = specialsKeys[Math.floor(Math.random() * specialsCount )]; // Uniform distribution;
			var s = specialsAll[specialKey];
			if ( Math.random() < 0.03 + ( c * 0.004 ) ) {
				vret[vertexId(current)] = vertex(current, config.seed * s.factor, specialKey);
			} else if ( Math.random() < 0.03 + ( c * 0.009 ) ) {
				vret[vertexId(current)] = vertex(current, config.seed * s.factor, specialKey);
			}
		}
	}
	extend( vertices, vret );
};

var insertOverlayWeights = function( config, vertices ) {
	var overlay = {};

	for(c = 3; c < config.size.columns; c++) {
		for(r = 0; r < config.size.rows; r++) {
			var current = rc(r, c);
			var override = false;
			if( config.type === 'stroll' ) {
				if (r === 1 || r === config.size.rows - 2 || Math.random() < 0.2) {
					if ( Math.random() < 0.4 ) {
						override = vertex(current, -10000, 'block');
					}
				}
			} else if( config.type === 'bike' ) {
				if (r % 3 === 1 ) {
					if ( Math.random() < 0.6 ) {
						override = vertex(current, -10000, 'block');
					}
				}
			} else if( config.type === 'kaper' ) {
				if (c % 4 === 1 || Math.random() < 0.1 ) {
					if ( Math.random() < 0.4 ) {
						override = vertex(current, -10000, 'block');
					}
				}
			} else if( config.type === 'amager' ) {
				if (r % 4 === 1 || c % 4 === 1 || Math.random() < 0.1 ) {
					if ( Math.random() < 0.3 ) {
						override = vertex(current, -10000, 'block');
					}
				}
			}

			if( override ) {
				overlay[vertexId(current)] = override;
			}

		}
	}

	// Ensure nothing special at starting position
	overlay[vertexId(config.initial)] = vertex(config.initial, config.seed);

	extend( vertices, overlay );
};

var generateVertices = function(config) {
	var vertices = {};

	insertBaseWeights( config, vertices );
	insertSpecialWeights( config, vertices );
	insertOverlayWeights( config, vertices );
	return vertices;
};

var generateEdges = function(config, vertices) {
	var edges = {};

	for (var c = 0; c < config.size.columns; c++ ) {
		for (var r = 0; r < config.size.rows; r++ ) {
			var currentId = vertexId(rc(r,c));
			if ( isSpecialVertex( vertices[currentId] ) ) {
				continue;
			}
			// Doesn't link the last column
			var successors = {};
			if (c < config.size.columns - 1) {
				var leftId = vertexId(rc(r - 1, c + 1));
				var stayId = vertexId(rc(r, c + 1));
				var rightId = vertexId(rc(r + 1, c + 1));

				if (r > 0 && !isSpecialVertex(vertices[leftId])) {
					successors.left = leftId;
				}

				if (!isSpecialVertex(vertices[stayId]))
					successors.stay = stayId;


				if (r < config.size.rows - 1 && !isSpecialVertex(vertices[rightId])) {
					successors.right = rightId;
				}
			}

			if (Object.keys(successors).length > 0) {
				// This avoids adding empty objects
				edges[currentId] = successors;
			}
		}
	}

	return edges;
};

var Navigation = function(definition) {
	this.config = definition.config;
	this.position = definition.config.initial;
	this.graph = {
		vertices: generateVertices(definition.config)
	};
	this.graph.edges = generateEdges(definition.config, this.graph.vertices);
};

Navigation.prototype.actionLane = function( agent, direction ) {
	var positionVid = vertexId(this.position);

	if ( !this.graph.edges[positionVid].hasOwnProperty( direction ) ) {
		return actionHelper.notApplicable('navigation/lane', [direction]);
	}
	var movingTo = this.graph.edges[positionVid][direction];
	agent.utility += this.graph.vertices[movingTo].weight;
	this.position = vidToRc( movingTo );
	var message = '';

	return actionHelper.applicable( 'navigation/lane', [direction] );
};

module.exports = Navigation;
