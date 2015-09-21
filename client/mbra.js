//
// An implementation of a Model-based-reflex-agent as in Figure 12 chapter 2 of (AIMA) for the Copenhagent environment.
// Open http://172.16.0.203:3000/docs/ to try it out
//

var tickDelay = 500;
var agentName = 'Incognito Agent';
var apiUrl = 'http://172.16.0.203:3000/api/'; // Turing (AI-1 server)
apiUrl = 'http://localhost:3000/api/'; // To connect to locally running Copenhagent environment

var MBRA = {
  agentState: { // This is agent's representation of the environment along with properties for rule control
    hasConnected: false,
    mapInstance: undefined,
    navigationInstance: undefined,
    enterNavigation: true,
    papersoccerPlays: 0,
    at: undefined
  },
  agentToken: undefined,
  nextRule: undefined,
  nextAction: undefined,
  latestResponse: {},
  rules: [ enterMapRule, enterNavigationRule, navigateRule, leaveNavigationRule, rideTheMetroRule ] // Lowest index elements are used first if applicable
};

(function($) {
  'use strict';

  MBRA.ruleMatch = function( state, rules ) {
    var applicableRules = [];
    for ( var i = 0; i < rules.length; i++ ) {
      if ( rules[i].applicable( state ) ) {
        applicableRules.push( rules[i] );
      }
    }
    if( applicableRules.length > 0 ) {
      var usedRule = applicableRules[0];
      return usedRule;
    }

    return undefined;
  };

  MBRA.act = function( response ) {
    // The Update-State procedure is taken care of in the associated rule
    logger.setState( MBRA.agentState );
    MBRA.nextRule = MBRA.ruleMatch( MBRA.agentState, MBRA.rules );
    if ( !MBRA.nextRule ) {
      logger.addToLog('No rules to apply, stopping.');
      console.warn('No rules to apply in', MBRA.agentState, 'with rules:', MBRA.rules);
    } else {
      setTimeout(doAction, tickDelay);
    }
  };

  var previousRule = { description: '' };
  function doAction() {
    if( previousRule.description !== MBRA.nextRule.description ) {
      logger.addToLog('Using rule <b>' + MBRA.nextRule.description + '</b> to proceed.');
    }

    // Makes the actual request to the Copenhagent environment
    MBRA.nextRule.action( MBRA.agentState );
    previousRule = MBRA.nextRule;
  }

  // Set active agent used by rules.js and api.js so that MBRA.act is called once the server responds.
  activeAgent = MBRA;

  // Start agent
  api.connect('Simple Agent', MBRA);

})(jQuery);
