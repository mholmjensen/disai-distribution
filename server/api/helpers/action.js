var moment = require('moment');

module.exports = {
	notApplicable: notApplicable,
	applicable: applicable
};

function createLabel(name, parameters) {
	parameters = parameters || [];
	return name + '(' + parameters.join(',') + ')';
}

function actionResponse(name, parameters, message, applicable, percepts) {
	percepts = percepts || [];
	return {
		action: {
			label: createLabel( name, parameters ),
			message: message,
			applicable: applicable,
			timestamp: moment().format(),
			percepts: percepts
		}
	};
}

function notApplicable( name, parameters, message ) {
	return actionResponse(name, parameters, message, false);
}

function applicable( name, parameters, message, percepts ) {
	return actionResponse(name, parameters, message, true, percepts);
}
