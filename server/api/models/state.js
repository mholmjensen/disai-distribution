var Agent = require('./Agent');
var Map = require('./Map');

var basePath = 'api/data/';

var current = {};

var createInitial = function(name) {
	current = {
		actionsEnabled: true,
		map: new Map(basePath + name + '/map.json'),
		agents: {},
		navigation: {},
		papersoccer: {},
		detektor: {},
	};
};

createInitial('copenhagen');

module.exports = {
	current: current,
	notActivities: {
		actionsEnabled: true,
		map: true,
		agents: true,
	}
};
