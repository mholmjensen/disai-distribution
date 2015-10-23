var enterMapRule, enterNavigationRule, navigateRule, leaveNavigationRule, rideTheMetroRule;
var bikeRule;
var enterPapersoccerRule, papersoccerPlayRule;

var activeAgent;

(function($) {
  'use strict';

  // Helper function to look up in map
  function positionToId(position) {
    return '[' + position.row + ',' + position.column + ']';
  }


  enterMapRule = {
    description: 'enter map',
    applicable: function( agentState ) {
      return !agentState.hasEnteredMap;
    },
    action: function( agentState ) {
      api.api('map/enter', {}, function( response ) {
        agentState.mapInstance = response.state.map;
        agentState.hasEnteredMap = true;
        agentState.at = 'dis';
        logger.addToLog('Executed map/enter()');
      }, undefined, function(){
        activeAgent.act();
      });
    }
  };

  enterNavigationRule = {
    description: 'enter navigation',
    applicable: function( agentState ) {
      if( agentState.isActive ) {
        return false;
      }

      if ( agentState.latestActiveLocation === agentState.at ) {
        return false;
      }

      var loc = agentState.mapInstance.locations[agentState.at];
      if ( loc.activities && 'navigation' in loc.activities ) {
        return true;
      }

      return false;
    },
    action: function( agentState ) {
      api.api('navigation/enter', {}, function( response ) {
        var location = agentState.mapInstance.locations[agentState.at];
        logger.addToLog('Executed navigation/enter() of type ' + location.activities.navigation.config.type);
        agentState.navigationInstance = response.state.navigation[agentState.agentToken];
        agentState.isActive = true;
        agentState.latestActiveLocation = agentState.at;
      });
    }
  };

  enterPapersoccerRule = {
    description: 'enter papersoccer',
    applicable: function( agentState ) {
      if( agentState.isActive ) {
        return false;
      }

      if ( agentState.latestActiveLocation === agentState.at ) {
        return false;
      }

      var loc = agentState.mapInstance.locations[agentState.at];
      if ( loc.activities && 'papersoccer' in loc.activities ) {
        return true;
      }

      return false;
    },
    action: function( agentState ) {
      api.api('papersoccer/enter', {}, function( response ) {
        var location = agentState.mapInstance.locations[agentState.at];
        logger.addToLog('Executed papersoccer/enter() of type ' + location.activities.papersoccer.config.type);
        agentState.papersoccerInstance = response.state.papersoccer[agentState.agentToken];
        agentState.isActive = true;
        agentState.latestActiveLocation = agentState.at;
      });
    }
  };


  navigateRule = {
    description: 'navigate',
    applicable: function( agentState ) {
      var instance = agentState.navigationInstance;
      if( agentState.navigationInstance ) {
        var positionId = positionToId(agentState.navigationInstance.position);
        if (positionId in agentState.navigationInstance.graph.edges) {
          return true;
        }
      }

      return false;
    },
    action: function( agentState ) {
      var instance = agentState.navigationInstance;
      var positionId = positionToId(instance.position);
      var successors = instance.graph.edges[positionId];

      // Find largest weight
      var bestWeight = -Number.MAX_VALUE / 2;
      var possibleDirections = [];
      for (var successorDirection in successors) {
        var successorId = successors[successorDirection];
        var weight = instance.graph.vertices[successorId].weight;
        if (weight === bestWeight) {
          possibleDirections.push(successorDirection);
        } else if (weight > bestWeight) {
          bestWeight = weight;
          possibleDirections = [successorDirection];
        }
      }

      // Randomise over same weight directions
      var directionChosen = possibleDirections[0];
      if (possibleDirections.length > 1) {
        var rnd = Math.floor(Math.random() * possibleDirections.length);
        directionChosen = possibleDirections[rnd];
      }

      var logStatement = 'Executed navigation/lane(' + directionChosen + ') with <b>w = ' + bestWeight + '</b>';
      if (possibleDirections.length > 1) {
        var others = possibleDirections.length - 1;
        logStatement += ' (' + others + ' alternatives of same weight)';
      }

      api.api('navigation/lane', {
        direction: directionChosen
      }, function() {
        logger.addToLog(logStatement);
        agentState.navigationInstance.position = {
          row: agentState.navigationInstance.position.row + ( directionChosen === 'left' ? -1 : ( directionChosen === 'stay' ? 0 : 1 ) ),
          column: agentState.navigationInstance.position.column + 1
        };
      }, undefined, function( response ) {
        activeAgent.act();
      });
    }
  };

  leaveNavigationRule = {
    description: 'leave navigation',
    applicable: function( agentState ) {
      if( agentState.navigationInstance ) {
        return true;
      }

      return false;
    },
    action: function( agentState ) {
      api.api('navigation/leave', {}, function( response ) {
        logger.addToLog('Executing navigation/leave()');
        agentState.navigationInstance = undefined;
        agentState.isActive = false;
      }, undefined, function( response ) {
        activeAgent.act();
      });
    }
  };

  rideTheMetroRule = {
    description: 'ride the metro',
    applicable: function( agentState ) {
      if( !agentState.hasEnteredMap || agentState.isActive ) {
        return false;
      }
      return true;
    },
    action: function( agentState ) {
      var dir = 'ccw';
      var arrivesAt = Object.keys( agentState.mapInstance.metro[agentState.at][dir] )[0];
      api.api('map/metro', {
        direction: dir
      }, function( response ) {
        logger.addToLog('Executed map/metro( ' + dir + ')');
        agentState.at = arrivesAt;
      });
    }
  };

  bikeRule = function( locationId ) {
    return {
      description: 'bike to ' + locationId,
      applicable: function( agentState ) {
      if( !agentState.hasEnteredMap || agentState.isActive || !agentState.mapInstance ) {
        return false;
      }

      if( agentState.at === locationId ) {
        return false;
      }

      if( !agentState.mapInstance.locations[locationId] ) {
        console.warn( 'Invalid locationId in bikeRule ' + locationId );
        return false;
      }

      return true;
      },
      action: function( agentState ) {
        var arrivesAt = agentState.mapInstance.locations[locationId];
        api.api('map/bike', {
          locationId: locationId
        }, function( response ) {
          logger.addToLog('Executed map/bike(' + locationId + ')');
          agentState.at = locationId;
        });
      }
    };
  };


  papersoccerPlayRule = function( dir ) {
    return {
      description: 'play in ' + dir,
      applicable: function( agentState ) {
      if( !agentState.hasEnteredMap || !agentState.papersoccerInstance || agentState.papersoccerPlays > 2 ) {
        return false;
      }

      return true;
      },
      action: function( agentState ) {
        api.api('papersoccer/play', {
          direction: dir
        }, function( response ) {
          agentState.papersoccerPlays += 1;
          logger.addToLog('Executed papersoccer/play(' + dir + ')');
        });
      }
    };
  };


})(jQuery);
