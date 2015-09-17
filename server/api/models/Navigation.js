var actionHelper = require('../helpers/action');
var extend = require('extend');

var specialCellType = function( grade, type, description ) {
	return {
		grade: grade,
		type: type,
		description: description
	};
};

var specialCellTypes = {
	all: [
		specialCellType( 15, 'camera', 'You quickly snap a memorable picture' ),
		specialCellType( 16, 'twitter', 'You make a hilarious tweet about an occurence at this spot' ),
		specialCellType( 20, 'call', 'You call home' ),
	],
	stroll: [
		specialCellType( 17, 'trash', 'You keep Copenhagen clean by properly dispensing your trash.' ),
		specialCellType( 18, 'umbrella', 'You pickup an umbrella to prepare for the Danish weather.' ),
		specialCellType( 23, 'gift', 'You spend money on overpriced goods.' ),
		specialCellType( 26, 'letter', 'You send a written letter to back home.' ),
	],
	bike: [
		specialCellType( -5, 'disabled', 'You break just in time to avoid hitting a person in a wheel chair.' ),
		specialCellType( -10, 'bus', 'You neglect to stop for a parked bus.' ),
		specialCellType( -6, 'human', 'You nearly run over a pedestrian.' ),
	],
	kaper: [
		specialCellType( -20, 'port', 'You collide with expensive port equipment.' ),
		specialCellType( 22, 'cloud', 'You navigate through heavy weather.' ),
		specialCellType( 10, 'plane', 'You get an excellent view of a plane leaving CPH.' ),
		specialCellType( 40, 'rescue', 'You rescue a crew from a capsized ship.' ),
		specialCellType( -35, 'twitter', 'You encounter a Swan (the National Bird of Denmark), which nearly breaks your arm,' ),
	],
	amager: [
		specialCellType( 13, 'music', 'You play loud and noisy music with open windows.' ),
		specialCellType( 12, 'truck', 'You overtake a slow moving truck.' ),
		specialCellType( 21, 'spot', 'You properly wait for an ambulance to pass by.' ),
		specialCellType( 0, 'bicycle', 'An annoying cyclist forces you to make a sudden stop.' ),
	],
};

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
var vertex = function(row, column, weight) {
	var v;

	if (row instanceof Object && row.hasOwnProperty('row') && row.hasOwnProperty('column')) {
		// Was called with 2 arguments
		v = rc(row.row, row.column);
	} else {
		v = rc(row, column);
	}

	if (typeof weight === 'undefined') {
		// Was called with 2 arguments
		v.weight = Math.round(column);
	} else {
		v.weight = Math.round(weight);
	}

	return v;
};

var isSpecialVertex = function(v) {
	if( v.weight === undefined || v.weight === -10000 ) {
		return true;
	}

	return false;
};

// var getVertexWeightById = function(vertices, vid) {
// 	var v = vertices[vid];
//
// 	if (!v) {
// 		// Vertex does not exist
// 		return 0;
// 	}
//
// 	if (isSpecialVertex(v)) {
// 		// Vertex is special, treat as non-existant
// 		return 0;
// 	}
//
// 	return v.weight;
// };
//
// var generateVertex = function(config, vertices, row, column) {
// 	var existingVid = vertexId(rc(row, column));
// 	if (existingVid in vertices) {
// 		return vertices[existingVid];
// 	}
//
// 	var seed = config.seed;
// 	var coeff = config.coeff;
//
// 	var fromLeft = getVertexWeightById(vertices, vertexId(rc(row - 1, column - 1))) || seed;
// 	var fromStay = getVertexWeightById(vertices, vertexId(rc(row, column - 1))) || seed;
// 	var fromRight = getVertexWeightById(vertices, vertexId(rc(row + 1, column - 1))) || seed;
//
// 	var rndCoeff = [Math.random() + 0.5, Math.random() + 0.5, Math.random() + 0.5, Math.random() + 0.5];
// 	// var rndCoeff = [1, 1, 1, 1];
//
// 	var weight = seed * coeff[0] * rndCoeff[0] + fromLeft * coeff[1] * rndCoeff[1] + fromStay * coeff[2] * rndCoeff[2] + fromRight * coeff[3] * rndCoeff[3];
//
// 	return vertex(row, column, weight);
// };
//
// var generateBikeVertices = function(config) {
// 	var vertices = {};
// 	var r, c, current;
//
// 	// Initialize first column
// 	for (r = 0; r < config.size.rows; r++) {
// 		current = rc(r, 0);
// 		if (r === 1 || r === config.size.columns - 2) {
// 			// Curb
// 			vertices[vertexId(current)] = vertex(current, config.seed * 6);
// 		} else {
// 			vertices[vertexId(current)] = vertex(current, config.seed / 2);
// 		}
// 	}
//
// 	// Overwrite the initial position's weight
// 	vertices[vertexId(config.initial)] = vertex(config.initial, config.seed);
//
// 	// Create remaning vertices
// 	for(c = 0; c < config.size.columns; c++) {
// 		for(r = 0; r < config.size.rows; r++) {
// 			// var seed = config.seed;
// 			// if (c > config.length * 2.0/3 && r < config.width * 0.5) {
// 			// 	seed *= Math.random() * 4;
// 			// }
// 			vertices[vertexId(rc(r, c))] = generateVertex(config, vertices, r, c);
// 		}
// 	}
//
// 	return vertices;
// };
//
// var generateAmagerVertices = function(config) {
// 	var vertices = {};
// 	var r, c, current;
//
// 	// Initialize first column
// 	for (r = 0; r < config.size.rows; r++) {
// 		current = rc(r, 0);
// 		vertices[vertexId(current)] = vertex(current, config.seed * (Math.random() + 0.5));
// 	}
//
// 	// Overwrite the initial position's weight
// 	vertices[vertexId(config.initial)] = vertex(config.initial, config.seed);
//
// 	// Create blocks
// 	var maxBlockSizeColumns = Math.round(config.size.columns / 8);
// 	var maxBlockSizeRows = Math.round(config.size.rows / 8);
// 	// var blocks;
// 	for (c = maxBlockSizeColumns; c < config.size.columns; c++) {
// 		for (r = 0; r < config.size.rows; r++) {
// 		}
// 	}
//
//
//
//
// 	// Split map (and lay roads and blocks) untill blocks are smaller than the above. Then further split some blocks at random
//
// 	var blocks = {
// 		// Object of objects:
// 		// Size: actial block size (rc)
// 		// Front span: size required in front to navigate around the actual block
// 	};
//
// 	var rnd;
// 	for(c = 1; c < config.size.columns; c++) {
// 		for(r = 0; r < config.size.rows; r++) {
// 			if (r % (blockSize * 2) === 0 && c % (blockSize * 2) === 0) {
// 				current = rc(r,c);
// 				vertices[vertexId(current)] = vertex(current, vertexTypes.building);
// 				current = rc(r+1,c);
// 				vertices[vertexId(current)] = vertex(current, vertexTypes.building);
// 				current = rc(r,c+1);
// 				vertices[vertexId(current)] = vertex(current, vertexTypes.building);
// 				current = rc(r+1,c+1);
// 				vertices[vertexId(current)] = vertex(current, vertexTypes.building);
// 			}
// 		}
// 	}
//
// 	// Create remaning vertices
// 	for(c = 0; c < config.size.columns; c++) {
// 		for(r = 0; r < config.size.rows; r++) {
// 			vertices[vertexId(rc(r, c))] = generateVertex(config, vertices, r, c);
// 		}
// 	}
//
// 	return vertices;
// };
//
// var generateKaperVertices = function(config) {
// 	var vertices = {};
// 	var r, c, current;
//
// 	// Overwrite the initial position's weight
//
// 	// Random ships
// 	var rnd;
// 	for(c = 1; c < config.size.columns; c++) {
// 		for(r = 0; r < config.size.rows; r++) {
// 			if (Math.random() > 0.9) {
// 				// Random obstacle
// 				current = rc(r, c);
// 				rnd = Math.random();
// 				if (rnd < 0.4) {
// 					vertices[vertexId(current)] = vertex(current, vertexTypes.reef);
// 				} else {
// 					vertices[vertexId(current)] = vertex(current, vertexTypes.ship);
// 				}
// 			}
// 		}
// 	}
//
// 	// Create remaning vertices
// 	for(c = 0; c < config.size.columns; c++) {
// 		for(r = 0; r < config.size.rows; r++) {
// 			vertices[vertexId(rc(r, c))] = generateVertex(config, vertices, r, c);
// 		}
// 	}
//
// 	return vertices;
// };

var insertBaseWeights = function( config, vertices ) {
	var bw = parseInt( config.seed );
	for(c = 0; c < config.size.columns; c++) {
		for(r = 0; r < config.size.rows; r++) {
			vertices[vertexId(rc(r, c))] = vertex(r, c, bw);
		}
	}
};

var insertSpecialWeights = function( config, vertices ) {
	// TODO Use config.type to look up parameters
	var vret = {};
	var specialsAll = specialCellTypes.all;
	var specials = specialCellTypes[config.type];
	for(c = 0; c < config.size.columns; c++) {
		for(r = 0; r < config.size.rows; r++) {
			var s;
			if ( Math.random() < 0.03 + ( c * 0.004 ) ) {
				s = specialsAll[Math.floor(Math.random()*specialsAll.length)]; // Uniform distribution
				vret[vertexId(rc(r, c))] = vertex(r, c, s.grade);
			} else if ( Math.random() < 0.03 + ( c * 0.009 ) ) {
				s = specials[Math.floor(Math.random()*specials.length)]; // Uniform distribution
				vret[vertexId(rc(r, c))] = vertex(r, c, s.grade);
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
						override = vertex(current, -10000);
					}
				}
			} else if( config.type === 'bike' ) {
				if (r % 3 === 1 ) {
					if ( Math.random() < 0.6 ) {
						override = vertex(current, -10000);
					}
				}
			} else if( config.type === 'kaper' ) {
				if (c % 4 === 1 || Math.random() < 0.1 ) {
					if ( Math.random() < 0.4 ) {
						override = vertex(current, -10000);
					}
				}
			} else if( config.type === 'amager' ) {
				if (r % 4 === 1 || c % 4 === 1 || Math.random() < 0.1 ) {
					if ( Math.random() < 0.3 ) {
						override = vertex(current, -10000);
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
	agent.score += this.graph.vertices[movingTo].weight;
	this.position = vidToRc( movingTo );

	return actionHelper.applicable( 'navigation/lane', [direction] );
};

module.exports = Navigation;
