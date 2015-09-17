var state = require('../models/state');

module.exports = {
	authAgentToken: authAgentToken
};

function authAgentToken( req, token ) {
	if ( req.swagger.apiPath === '/environment/connect' ) {
		return true;
	}

	if ( req.swagger.apiPath === '/environment/history' ) {
		return true;
	}

	var agent = state.current.agents[token];

	if (typeof agent === 'undefined') {
		var err = new Error( 'No agent connected to server with token: ' + token );
		err.code = 'Unauthorized';
		err.statusCode = 401;
		return err;
	}

	// Save token on request for future reference
	req.dai = {
		agentToken: token
	};

	return true;
}
