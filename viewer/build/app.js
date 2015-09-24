(function() {
  'use strict';

  angular.module('app', ['templates', 'ngAnimate', 'angularMoment', '720kb.tooltips', 'dai'])
  .directive('app', function() {
    return {
      restrict: 'A',
      templateUrl: 'app/app.tpl.html'
    };
  })

  .run(['$rootScope', function($rootScope) {
    $rootScope.pageTitle = 'DISAI - Viewer';
  }])

  .config(['$logProvider', function($logProvider){
    $logProvider.debugEnabled(false);// TODO beware: suppresses $log.debug()
  }])
  ;

})();

(function() {
	'use strict';

	angular.module('draggable.directive', [])
	.directive('draggable', ['$document', '$log', function($document, $log) {
		return {
      restrict: 'A',
      link: function(scope, elm) {
				$log.debug('Making draggable on ', elm );
        var startX, startY, initialMouseX, initialMouseY;
        elm.css({position: 'absolute'});

        elm.bind('mousedown', function($event) {
          startX = elm.prop('offsetLeft');
          startY = elm.prop('offsetTop');
          initialMouseX = $event.clientX;
          initialMouseY = $event.clientY;
          $document.bind('mousemove', mousemove);
          $document.bind('mouseup', mouseup);
          return false;
        });

        function mousemove($event) {
          var dx = $event.clientX - initialMouseX;
          var dy = $event.clientY - initialMouseY;
          elm.css({
            top:  startY + dy + 'px',
            left: startX + dx + 'px',
						right: 'auto',
						bottom: 'auto'
          });
          return false;
        }

        function mouseup() {
          $document.unbind('mousemove', mousemove);
          $document.unbind('mouseup', mouseup);
        }
      }
    };
	}])
	;

})();

(function() {
	'use strict';

	angular.module('draggable', ['draggable.directive'])
	;

})();

(function() {
	'use strict';

	angular.module('dai.config', ['dai.api', 'angularStats'])

	.config(['ApiServiceProvider', function(ApiServiceProvider) {
		ApiServiceProvider.configure({
			
		});
	}])

	;

})();

(function() {
  'use strict';

  angular.module('dai.directive', ['dai.environment', 'dai.overview.service', 'dai.map', 'dai.map.location', 'dai.agent', 'dai.inspector', 'dai.navigator', 'dai.papersoccer', 'dai.overview', 'dai.background'])

  .directive('dai', ['$log', 'pollInterval', 'EnvironmentService', 'OverviewService', function( $log, pollInterval, EnvironmentService, OverviewService) {
    return {
      restrict: 'A',
      templateUrl: 'app/dai/dai.tpl.html',
      link: function(scope) {
        scope.pollingEnabled = EnvironmentService.pollingEnabled;
        scope.env = EnvironmentService.env;
        scope.overview = OverviewService.overview;
        scope.current = EnvironmentService.current;

        scope.togglePoll = function() {
          if (EnvironmentService.pollingEnabled()) {
            EnvironmentService.setPollInterval( 0 );
          } else {
            EnvironmentService.setPollInterval( pollInterval );
          }
        };
      }
    };
  }]);

})();

(function() {
  'use strict';

  angular.module('dai', ['dai.config', 'dai.directive']);

})();

(function() {
	'use strict';

	angular.module('dai.agent.directive', ['dai.api'])

	.directive('daiAgent', ['ApiService', function(ApiService) {
		return {
			restrict: 'A',
			templateUrl: 'app/dai/agent/agent.tpl.html',
			link: function(scope) {
				scope.api = ApiService;
			}
		};
	}]);

})();
(function() {
	'use strict';

	angular.module('dai.agent', ['dai.agent.directive']);

})();
(function() {
  'use strict';

  angular.module('dai.background.config', ['draggable'])

  ;

})();

(function() {
  'use strict';

  angular.module('dai.background.directive', [])

  .directive('daiBackground', ['$log', function( $log ) {
    return {
      restrict: 'A',
      scope: false,
      templateUrl: 'app/dai/background/background.tpl.html',
      link: function() {
        $log.debug('Linking background');
      }
    };
  }]);

})();

(function() {
	'use strict';

	angular.module('dai.background', ['dai.background.config', 'dai.background.directive']);

})();

(function() {
	'use strict';

	angular.module('dai.api.config', [])

	.config(['$httpProvider', function($httpProvider) {
		$httpProvider.interceptors.push('ApiInterceptor');
	}]);

})();
(function() {
	'use strict';

	angular.module('dai.api.interceptor', ['dai.api.service'])

	.factory('ApiInterceptor', ['$q', '$log', '$injector', function($q, $log, $injector) {
		var isApiUrl = function(url) {
			var api = $injector.get('ApiService');

			var apiUrl = api.service.getApiUrl();

			if (url.indexOf(apiUrl) === 0) {
				// API call
				return true;
			}

			return false;
		};

		return {
			request: function(config) {
				var api = $injector.get('ApiService');

				if (isApiUrl(config.url)) {
					if (!config.noApiKeyRequired) {
						// Sets token on API request
						config.headers.agentToken = api.service.getAgentToken();
					}
				}

				return config;
			},

			requestError: function(rejection) {
				return rejection;
			},

			response: function(response) {
				return response;
			},

			responseError: function(rejection) {
				$log.warn('ApiInterceptor [responseError]');

				// if (isApiUrl(rejection.config.url)) {
				// 	if (rejection.status === 404) {
				// 		//TODO: Handle connection errors such that an agent can not die
				// 	}
				// }

				return $q.reject(rejection);
			}
		};
	}]);

})();

(function() {
	'use strict';

	angular.module('dai.api', ['dai.api.config', 'dai.api.interceptor', 'dai.api.service']);

})();
(function() {
	'use strict';

	angular.module('dai.api.service', [])

	.provider('ApiService', function() {
		this.options = {
			host: ''
		};

		this.configure = function configure(additionalOptions) {
			angular.extend(this.options, additionalOptions);
		};

		this.$get = ['$log', '$http', '$q', function($log, $http, $q) {
			var apiUrl = this.options.host + '/api/';

			var agentToken = false;

			// Service functions
			var getApiUrl = function() {
				return apiUrl;
			};

			var getAgentToken = function() {
				return agentToken;
			};

			// History
			var environmentHistory = function(since, count) {
				return $http.get(apiUrl + 'environment/history', {
					noApiKeyRequired: true,
					params: {
						since: since,
						count: count
					}
				})
				.then(function(response) {
					return response.data;
				}, function(errorResponse) {
					$log.warn('ApiService [history] error: ' + errorResponse.data.message);
					return $q.reject('ApiService [history] error: ' + errorResponse.data.message);
				});
			};

			return {
				service: {
					getApiUrl: getApiUrl,
					getAgentToken: getAgentToken
				},

				environmentHistory: environmentHistory
			};
		}];
	});

})();

(function() {
  'use strict';

  angular.module('dai.environment.config', ['uiGmapgoogle-maps', 'dai.environment.service', 'dai.overview.service'])

  .constant( 'pollInterval', 300 )

  .run( ['$log', 'pollInterval', 'uiGmapGoogleMapApi', 'EnvironmentService', function( $log, pollInterval, uiGmapGoogleMapApi, EnvironmentService ) {
  	uiGmapGoogleMapApi.then(function(maps) {
  		$log.debug('Google Maps API Ready', maps);
  		EnvironmentService.setPollInterval( pollInterval );
  	});
  }])

  ;

})();

(function() {
	'use strict';

	angular.module('dai.environment', ['dai.environment.config']);

})();

(function() {
	'use strict';

	angular.module('dai.environment.service', ['dai.api.service', 'dai.map.service'])

	.factory('EnvironmentService', ['$log', '$interval', '$rootScope', 'ApiService', 'MapService', function( $log, $interval, $rootScope, ApiService, MapService ) {
		$log.debug( 'EnvironmentService instantiating');
		var pollIntervalPromise;

		var stateHistory = [];
		var actionHistory = [];
		var env = {
			current: {
				state: {
					map: {},
					navigation: {}
				},
				action:{}
			},
		};

		// Initial should be undefined and not 0.
		// * 0 will get complete history.
		// * undefined will get only the latest point in the history.
		var next;
		var noNewDataCount = 0; // Used to throttle polling $log
		var previousData = '';

		var poll = function() {
			return ApiService.environmentHistory(next, 1)
			.then(function(data) {
				if ( angular.equals(previousData, data ) ) {
					return;
				}
				previousData = data;
				angular.forEach(data.states, function(state) {
					this.push(state);
				}, stateHistory);

				angular.forEach(data.actions, function(action) {
					this.push(action);
				}, actionHistory);

				if (stateHistory.length > 0) {
					if (typeof next === 'undefined') {
						// This is the first data => set initial
						MapService.setInitial(stateHistory[stateHistory.length - 1]);
					} else {
						MapService.updateMap(stateHistory[stateHistory.length - 1]);
					}
				}

				if (next < data.next || typeof next === 'undefined') {
					var stateIndex = data.states.length-1;

					env.currentAgents = data.states[stateIndex].agents;
					env.currentNavigation = data.states[stateIndex].navigation;
					env.currentPapersoccer = data.states[stateIndex].papersoccer;
					env.actionCount = data.next - 1;
					env.current = {
						state: data.states[stateIndex],
						action: data.actions[stateIndex]
					};
				}

				next = data.next;
				if ( data.since === data.next ) {
					noNewDataCount += 1;
					if ( noNewDataCount % 250 === 12 || noNewDataCount % 250 === 11 || noNewDataCount % 250 === 10 ) {
						$log.debug('EnvironmentService [poll] No new data[next=' + data.next + '. polls=' + noNewDataCount + '].', data);
					}
				} else {
					// $log.debug('EnvironmentService [poll] Since != next[next=' + data.next + '. emptyPolls=' + noNewDataCount + '].', data);
					noNewDataCount = 0;
				}


			})
			.catch(function(error) {
				$log.warn('EnvironmentService [poll] Could not load data, see error object.', error);
			})
			;
		};

		var pollingEnabled = function() {
			return angular.isDefined(pollIntervalPromise);
		};

		// Input
		// * interval <= 0 or undefined: Stop
		// * interval > 0: Poll each <interval> ms
		var setPollInterval = function(interval) {
			if (!angular.isDefined(interval)) {
				interval = 0;
			}

			if (angular.isDefined(pollIntervalPromise)) {
				$interval.cancel(pollIntervalPromise);
				pollIntervalPromise = undefined;
			}

			if (interval > 0) {
				next = undefined;
				poll()
				.then(function() {
					pollIntervalPromise = $interval(poll, interval);
				});
			}
		};

		return {
			pollingEnabled: pollingEnabled,
			setPollInterval: setPollInterval,
			env: env,
		};
	}]);

})();

(function() {
  'use strict';

  angular.module('dai.inspector.config', ['jsonFormatter', 'draggable'])

  ;

})();

(function() {
  'use strict';

  angular.module('dai.inspector.directive', [])

  .directive('daiInspector', ['$log', function( $log ) {
    return {
      restrict: 'A',
      scope: false,
      templateUrl: 'app/dai/inspector/inspector.tpl.html',
      link: function() {
        $log.debug('Linking inspector');
      }
    };
  }]);

})();

(function() {
	'use strict';

	angular.module('dai.inspector', ['dai.inspector.config', 'dai.inspector.directive']);

})();

(function() {
  'use strict';

  angular.module('dai.map.config', ['uiGmapgoogle-maps', 'jsonFormatter'])

  .config(['uiGmapGoogleMapApiProvider', function(uiGmapGoogleMapApiProvider) {
    uiGmapGoogleMapApiProvider.configure({
      v: '3',
      libraries: 'weather,geometry,visualization'
    });
  }]);

})();

(function() {
  'use strict';

  angular.module('dai.map.controller', ['dai.map.service', 'dai.map.controls.center.controller'])

  .controller('daiMapController', ['$scope', '$log', 'uiGmapGoogleMapApi', 'MapService', 'EnvironmentService', function($scope, $log, uiGmapGoogleMapApi, MapService, EnvironmentService ) {
    $log.debug('Controller daiMapController', $scope);
    $scope.map = MapService.map;
    $scope.env = EnvironmentService.env;

  }]);

})();

(function() {
  'use strict';

  angular.module('dai.map.directive', ['uiGmapgoogle-maps', 'dai.map.controller', 'dai.environment.service'])

  .directive('daiMap', ['$log', function( $log ) {
    return {
      restrict: 'A',
      templateUrl: 'app/dai/map/map.tpl.html',
      controller: 'daiMapController',
      controllerAs: 'daiMapCtrl',
      link: function(scope, element) {
        element.addClass('map');
        $log.debug('Linking map', scope);

        scope.locationMarkerClick = function (iMarker, eventName, oMarker) {
          scope.locationOn = true;
          var id = oMarker.id;
          var key = id.substring(2, id.length); // TODO very hack
          scope.clickedLocationKey = key;
          scope.clickedLocation = scope.env.current.state.map.locations[key];
        };
      }
    };
  }]);

})();

(function() {
	'use strict';

	angular.module('dai.map', ['dai.map.config', 'dai.map.directive']);

})();
(function() {
	'use strict';

	angular.module('dai.map.service', [])

	.factory('MapService', ['$log', function( $log ) {
		// var latestDataSet;
		$log.debug('Initializing MapService');
		var initial = {
			zoom: 13,
			options: {
				// disableDefaultUI: true,
				// panControl: false,
				// zoomControl: false,
				minZoom: 11,
				maxZoom: 20,
				// draggable: false
			}
		};

		var map = {
			locationMarkers: [],
			agentMarkers: [],
			metroPolylines: []
		};

		function setInitial(data) {
			// Setup center
			var center = {
				latitude: parseFloat(data.map.center.latitude),
				longitude: parseFloat(data.map.center.longitude)
			};

			initial.center = center;

			// Deep-copy initial properties to map
			angular.merge(map, initial);

			// Make metro lines
			var count = 0;
			var basePolyline = {
				editable: false,
				draggable: false,
				geodesic: true,
				stroke: {
					color: 'hsl(198, 83%, 63%)',
					opacity: 0.9
				}
			};

			var makePolyline = function ( id, from, to, weight ) {
				var fromLocation = data.map.locations[from];
				var toLocation = data.map.locations[to];
				var polyline = {
					id: id,
					path: [
						{
							latitude: fromLocation.coords.latitude,
							longitude: fromLocation.coords.longitude
						}, {
							latitude: toLocation.coords.latitude,
							longitude: toLocation.coords.longitude
						},
					]
				};
				angular.extend( polyline, basePolyline );
				if ( weight > 7 ) {
					polyline.stroke.weight = 5;
				} else {
					polyline.stroke.weight = 4;
				}
				return polyline;
			};

			angular.forEach(data.map.metro, function(obj, key) {
				var locationId = key;
				var cwLocationId = Object.keys( obj.cw )[0];
				var ccwLocationId = Object.keys( obj.ccw )[0];

				this.push( makePolyline( count, locationId, cwLocationId, obj.cw[cwLocationId] ) );
				count += 1;

				this.push( makePolyline( count, locationId, ccwLocationId, obj.ccw[ccwLocationId] ) );
				count += 1;
			}, map.metroPolylines);

			updateMap(data);
		}

		var daiMapMarker = function( prefix, key, latitude, longitude, options ) {
			return {
				id: prefix + '-' + key,
				latitude: parseFloat(latitude),
				longitude: parseFloat(longitude),
				icon: 'assets/empty1x1.png',
				options: options,
			};
		};

		function updateMap(data) {
			// latestDataSet = data;

			map.locationMarkers = [];
			map.agentMarkers = [];

			// Populate location markers
			angular.forEach(data.map.locations, function(obj, key) {
				var lblLocation = '<span class="location"><i class="activity-location"></i>' + obj.title + '</span>';
				var lblActivities = '';
				angular.forEach( obj.activities, function( activity ) {
					if ( activity.config ) {
						lblActivities += activity.config.type ? '<i class="activity-' + activity.config.type + '"></i>' : '';
					}
				});
				var markerRows = '<div class="marker-row">' + lblActivities + lblLocation + '</div>';
				var options = {
					zIndex: 5,
					labelClass: 'marker-container',
					labelContent: markerRows,
					title: obj.title
				};
				this.push( daiMapMarker( 'l', key, obj.coords.latitude, obj.coords.longitude, options ) );
			}, map.locationMarkers);

			// Populate agent markers
			angular.forEach(data.agents, function(obj, key) {
				if (obj.hasOwnProperty('locationId')) {
					var options = {
						zIndex: 2,
						labelClass: 'marker-container',
						labelContent: '<div class="marker-row agents" style="margin-left: ' + ( obj.id * 16 ) + 'px"><i class="agent-' + obj.id + '"></i></div>',
						title: obj.name
					};
					this.push( daiMapMarker( 'a', key, data.map.locations[obj.locationId].coords.latitude, data.map.locations[obj.locationId].coords.longitude, options ) );
				}
			}, map.agentMarkers);
		}

		function resetCenter() {
			angular.extend(map.center, initial.center);
		}

		return {
			// Data
			map: map,

			// Functions
			setInitial: setInitial,
			updateMap: updateMap,

			resetCenter: resetCenter
		};
	}]);

})();

(function() {
  'use strict';

  angular.module('dai.navigator.config', ['draggable'])

  ;

})();

(function() {
  'use strict';

  angular.module('dai.navigator.controller', ['dai.environment'])

  .controller('daiNavigatorController', ['$scope', '$log', function($scope, $log) {
    $log.debug('Controller daiNavigatorController', $scope);
  }]);

})();

(function() {
  'use strict';

  angular.module('dai.navigator.directive', ['dai.navigator.controller', 'dai.environment.service', 'dai.overview.service'])

  .directive('daiNavigator', ['$log', 'EnvironmentService', 'OverviewService', function( $log, EnvironmentService, OverviewService ) {
    return {
      restrict: 'A',
      scope: false,
      templateUrl: 'app/dai/navigator/navigator.tpl.html',
      controller: 'daiNavigatorController',
      controllerAs: 'daiNavigatorCtrl',
      link: function(scope, element) {
        $log.debug( 'linking daiNavigator' );
        element.addClass('navigator');
        element.addClass('animate-show');

        scope.navigator = {
          problemInstance: undefined,
          agent: undefined,
        };

        scope.env = EnvironmentService.env;
        scope.overview = OverviewService.overview;

        scope.$watch( 'env.currentNavigation', function( newValue, oldValue ) {
          if( newValue !== oldValue ) {
            var agToken = OverviewService.overview.selectedAgent.token;
            if( angular.isDefined( newValue[agToken] ) ) {
              var instance = newValue[agToken];
              scope.navigator.agent = OverviewService.overview.selectedAgent.agent;
              scope.navigator.problemInstance = instance;
            } else {
              scope.navigator.problemInstance = undefined;
            }
            scope.navigator.updateGraph();
          }
        } );

        scope.$watch( 'overview.selectedAgent', function( newValue, oldValue ) {
          if( !angular.equals( newValue, oldValue ) ) {
            if( angular.isDefined( EnvironmentService.env.currentNavigation[newValue.token] ) ) {
              scope.navigator.agent = newValue.agent;
              scope.navigator.problemInstance = EnvironmentService.env.currentNavigation[newValue.token];
            } else {
              scope.navigator.agent = undefined;
              scope.navigator.problemInstance = undefined;
            }
            scope.navigator.updateGraph();
          }
        } );

      }
    };
  }]);

})();

(function() {
	'use strict';

	angular.module('dai.navigator', ['dai.navigator.config', 'dai.navigator.directive', 'dai.navigator.graph']);

})();

(function() {
  'use strict';

  angular.module('dai.overview.config', ['jsonFormatter', 'draggable'])

  ;

})();

(function() {
  'use strict';

  angular.module('dai.overview.directive', ['dai.overview.service'])

  .directive('daiOverview', ['$log', '$interval', '$timeout', 'OverviewService', function( $log, $interval, $timeout, OverviewService ) {
    return {
      restrict: 'A',
      scope: false,
      templateUrl: 'app/dai/overview/overview.tpl.html',
      // controller: 'daiMapController',
      // controllerAs: 'daiMapCtrl',
      link: function(scope, element) {
        $log.debug('Linking overview');
        element.addClass('overview');
        scope.settings = {
          selectedRowId: -1,
          autoCycle: false,
        };

        var cycle = function() {
          var noAgents = OverviewService.overview.numberOfAgents();
          scope.settings.selectedRowId = ( scope.settings.selectedRowId + 1 ) % ( noAgents );
        };

        var cyclerPromise;
        scope.$watch( 'settings.autoCycle', function( newValue, oldValue ) {
          if( newValue !== oldValue ) {
            if ( angular.isDefined( cyclerPromise )  ) {
              $interval.cancel( cyclerPromise );
            }
            if( newValue ) {
              cycle();
              cyclerPromise = $interval( cycle, 10000 );
            }
          }
        });

        scope.$watch( 'settings.selectedRowId', function( newValue, oldValue ) {
          if( newValue !== oldValue ) {
            OverviewService.overview.setSelectedAgent( newValue );
          }
        });

        var initialAgentSet = false;
        scope.$watch( 'env.currentAgents', function( newValue ) {
          if( angular.isDefined( newValue ) ) {
            var agCount = Object.keys(newValue).length;
            if( !initialAgentSet && agCount > 0 ) {
              initialAgentSet = true;
              scope.settings.selectedRowId = 0;
              OverviewService.overview.setSelectedAgent( newValue );
            }
            if( initialAgentSet && agCount === 0 ) {
              initialAgentSet = false;
            }
          }
        });
      }
    };
  }]);

})();

(function() {
	'use strict';

	angular.module('dai.overview', ['dai.overview.config', 'dai.overview.directive', 'dai.overview.service'])

	;
})();

(function() {
	'use strict';

	angular.module('dai.overview.service', [ 'dai.environment.service'])

	.factory('OverviewService', ['$log', 'EnvironmentService', function( $log, EnvironmentService ) {
		$log.debug( 'OverviewService instantiating', EnvironmentService.env);
		var overview = {
			selectedAgent: {
				agent: null,
				token: ''
			}
		};

		overview.setSelectedAgent = function( index ) {
			if ( angular.isDefined( EnvironmentService.env.currentAgents ) ) {
				var keys = Object.keys( EnvironmentService.env.currentAgents );
				var agentToken = keys[index];
				var agent = EnvironmentService.env.currentAgents[agentToken];
				overview.selectedAgent = {
					agent: agent,
					token: agentToken,
				};
			} else {
				$log.warn('OverviewService.setSelectedAgent: EnvironmentService.env.currentAgents is undefined' );
			}
		};

		overview.numberOfAgents = function() {
			if( EnvironmentService.env.currentAgents ) {
				return Object.keys( EnvironmentService.env.currentAgents ).length;
			}
			return 0;
		};

		return {
			overview: overview,
		};
	}]);

})();

(function() {
  'use strict';

  angular.module('dai.papersoccer.config', ['draggable'])

  ;

})();

(function() {
  'use strict';

  angular.module('dai.papersoccer.controller', ['dai.environment'])

  .controller('daiPapersoccerController', ['$scope', '$log', function($scope, $log) {
    $log.debug('Controller daiPapersoccerController', $scope);
  }]);

})();

(function() {
  'use strict';

  angular.module('dai.papersoccer.directive', ['dai.papersoccer.controller', 'dai.environment.service', 'dai.overview.service'])

  .directive('daiPapersoccer', ['$log', 'EnvironmentService', 'OverviewService', function( $log, EnvironmentService, OverviewService ) {
    return {
      restrict: 'A',
      scope: false,
      templateUrl: 'app/dai/papersoccer/papersoccer.tpl.html',
      controller: 'daiPapersoccerController',
      controllerAs: 'daiPapersoccerCtrl',
      link: function(scope, element) {
        $log.debug( 'linking daiPapersoccer' );
        element.addClass('papersoccer');
        element.addClass('animate-show');

        scope.papersoccer = {
          problemInstance: undefined,
          agent: undefined,
        };

        scope.env = EnvironmentService.env;
        scope.overview = OverviewService.overview;

        scope.$watch( 'env.currentPapersoccer', function( newValue, oldValue ) {
          if( newValue !== oldValue ) {
            var agToken = OverviewService.overview.selectedAgent.token;
            if( angular.isDefined( newValue[agToken] ) ) {
              var instance = newValue[agToken];
              scope.papersoccer.agent = OverviewService.overview.selectedAgent.agent;
              scope.papersoccer.problemInstance = instance;
            } else {
              scope.papersoccer.problemInstance = undefined;
            }
            scope.papersoccer.updateGraph();
          }
        } );

        scope.$watch( 'overview.selectedAgent', function( newValue, oldValue ) {
          if( !angular.equals( newValue, oldValue ) ) {
            if( angular.isDefined( EnvironmentService.env.currentPapersoccer[newValue.token] ) ) {
              scope.papersoccer.agent = newValue.agent;
              scope.papersoccer.problemInstance = EnvironmentService.env.currentPapersoccer[newValue.token];
            } else {
              scope.papersoccer.agent = undefined;
              scope.papersoccer.problemInstance = undefined;
            }
            scope.papersoccer.updateGraph();
          }
        } );

      }
    };
  }]);

})();

(function() {
	'use strict';

	angular.module('dai.papersoccer', ['dai.papersoccer.config', 'dai.papersoccer.directive', 'dai.papersoccer.soccerfield']);

})();

(function() {
  'use strict';

  angular.module('dai.map.location.config', ['draggable'])

  ;

})();

(function() {
  'use strict';

  angular.module('dai.map.location.directive', [])

  .directive('daiLocation', ['$log', function( $log ) {
    return {
      restrict: 'A',
      scope: false,
      templateUrl: 'app/dai/map/location/location.tpl.html',
      link: function( scope ) {
        $log.debug('Linking location');
        scope.currentLocation = {};

        scope.$watch( 'clickedLocation', function( newValue, oldValue ) {
          if ( newValue !== oldValue ) {
            scope.currentLocation = newValue;
          }
        });
        scope.$watch( 'clickedLocationKey', function( newValue, oldValue ) {
          if ( newValue !== oldValue ) {
            var imgpath = 'assets/student/fa15/' + newValue;
            scope.currentLocation.images = {
              1: {
                src: imgpath + '1.jpg',
                thumb: imgpath + '1-thumb.jpg'
              },
              2: {
                src: imgpath + '2.jpg',
                thumb: imgpath + '2-thumb.jpg'
              },
              3: {
                src: imgpath + '3.jpg',
                thumb: imgpath + '3-thumb.jpg'
              }
            };
          }
        });
      }
    };
  }]);

})();

(function() {
	'use strict';

	angular.module('dai.map.location', ['dai.map.location.config', 'dai.map.location.directive']);

})();

(function() {
  'use strict';

  angular.module('dai.navigator.graph.directive', [])

  .directive('daiNavigatorGraph', ['$log', function( $log ) {
    // TODO taken from server/models/Navigation.js - consider moving to static state
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

    var isSpecialType = function( type, weight ) {
      var lookin = [].concat( specialCellTypes.all, specialCellTypes[type] );
      var found;
      angular.forEach( lookin, function( obj ) {
        if( obj.grade === weight ) {
          found = obj;
          return false;
        }
      });

      return found;
    };

    return {
      restrict: 'A',
      templateUrl: 'app/dai/navigator/graph/graph.tpl.html',
      link: function(scope, element) {
        $log.debug( 'linking daiNavigatorGraph' );
        element.addClass('graph');

        var latestBuildInstance;
        scope.navigator.updateGraph = function() {

          var toBuild = scope.navigator.problemInstance;
          if ( angular.isDefined(toBuild) && angular.isDefined(latestBuildInstance) ) {
            if( !( angular.equals( toBuild.config, latestBuildInstance.config ) && angular.equals( toBuild.graph, latestBuildInstance.graph ) ) ) {
              // $log.debug('updateGraph buildGraphBackground(', toBuild, ')' );
              buildGraphBackground( toBuild );
              latestBuildInstance = angular.copy( toBuild );
            }
          } else {
            buildGraphBackground( toBuild );
            latestBuildInstance = angular.copy( toBuild );
          }
        };


        var buildGraphBackground = function( instance ) {
          element.find('div').remove();
          if( !angular.isDefined( instance ) ) {
            return;
          }
          var container = angular.element('<div></div>');
          container.addClass(instance.config.type);
          var rows = parseInt( instance.config.size.rows );
          var columns = parseInt( instance.config.size.columns );
          for( var row = 0; row < rows; row++ ) {
            var rowElement = angular.element('<div></div>');
            rowElement.addClass('row');
            for( var column = 0; column < columns; column++ ) {
              var cell = angular.element('<i></i>');
              var vertexKey = '[' + row + ',' + column +']';
              var weight = instance.graph.vertices[vertexKey].weight;
              cell.addClass( 'w' + weight );

              var special = isSpecialType( instance.config.type, weight );
              if( special ) {
                cell.attr( 'title', special.description + ' [' + weight + ']' );
              } else {
                cell.attr( 'title', 'You enjoy being an active agent in ' + instance.config.type + ' [' + weight + ']' );
              }

              rowElement.append( cell );
            }
            container.append( rowElement );
          }
          element.append( container );
        };

      }
    };
  }]);

})();

(function() {
	'use strict';

	angular.module('dai.navigator.graph', [ 'dai.navigator.graph.directive']);

})();

(function() {
  'use strict';

  angular.module('dai.papersoccer.soccerfield.directive', [])

  .directive('daiSoccerfield', ['$log', function( $log ) {

    return {
      restrict: 'A',
      templateUrl: 'app/dai/papersoccer/soccerfield/soccerfield.tpl.html',
      link: function(scope, element) {
        $log.debug( 'linking daiSoccerfield' );
        element.addClass('soccerfield');

        var latestBuildInstance;
        scope.papersoccer.updateGraph = function() {

          var toBuild = scope.papersoccer.problemInstance;
          if ( angular.isDefined(toBuild) && angular.isDefined(latestBuildInstance) ) {
            if( !( angular.equals( toBuild.config, latestBuildInstance.config ) && angular.equals( toBuild.currentVertex, latestBuildInstance.currentVertex ) ) ) {
              buildGraphBackground( toBuild );
              latestBuildInstance = angular.copy( toBuild );
            }
          } else {
            buildGraphBackground( toBuild );
            latestBuildInstance = angular.copy( toBuild );
          }
        };

        var vertexId = function( row, column, dir ) {
          if ( !dir ) {
            return '['+ row + ',' + column + ']';
          }

          if( dir.indexOf('N') > - 1 ) {
            row -= 1;
          }
          if( dir.indexOf('S') > - 1 ) {
            row += 1;
          }
          if( dir.indexOf('W') > - 1 ) {
            column -= 1;
          }
          if( dir.indexOf('E') > - 1 ) {
            column += 1;
          }

          return vertexId( row, column );
        };

        var addEdges = function( td, vertex ) {
          if( vertex.se ) {
            td.append( angular.element('<i></i>').addClass( 'south-east south-east-' + vertex.se  ) );
            td.append( angular.element('<b></b>').addClass( 'south-east south-east-' + vertex.se  ) );
          }
          if( vertex.sw ) {
            td.append( angular.element('<i></i>').addClass( 'south-west south-west-' + vertex.sw  ) );
            td.append( angular.element('<b></b>').addClass( 'south-west south-west-' + vertex.sw  ) );
          }
          if( vertex.s ) {
            td.addClass( 'south south-' + vertex.s );
          }
          if( vertex.e ) {
            td.addClass( 'east east-' + vertex.e );
          }
        };

        var buildGraphBackground = function( instance ) {
          element.find('div').remove();
          if( !angular.isDefined( instance ) ) {
            return;
          }
          var container = angular.element('<div></div>');
          container.addClass(instance.config.type);
          var problemK = parseInt( instance.config.k );
          var rows = 5 + 2 * problemK;
          var columns = 9 + 2 * problemK;
          var table = angular.element('<table></table>');
          for( var row = 0; row < rows; row++ ) {
            var tr = angular.element('<tr></tr>');

            for( var col = 0; col < columns; col++ ) {

              var td = angular.element('<td></td>');
              var dot = angular.element('<span></span>');
              //TODO squares currently not used, but could remove issue with SW/SE cells
              // var squares = angular.element('<div></div>');
              // var squareTL = angular.element('<div></div>'), squareBL = angular.element('<div></div>'), squareTR = angular.element('<div></div>'), squareBR = angular.element('<div></div>');
              // squareTL.addClass('tl').append( angular.element('<i></i>') ).append( angular.element('<b></b>') );
              // squareBL.addClass('bl').append( angular.element('<i></i>') );
              // squareTR.addClass('tr').append( angular.element('<i></i>') );
              // squareBR.addClass('br').append( angular.element('<i></i>') );

              var id = vertexId( row, col );
              var vertex = instance.soccerfield.vertices[id];
              if( instance.currentVertex.row === row && instance.currentVertex.column === col  ) {
                dot.addClass( 'current' );
                if( instance.isAgentsTurn ) {
                  dot.addClass( 'agent' );
                } else {
                  dot.addClass( 'opponent' );
                }
              } else if( vertex ) {
                if( row ===  2 + problemK && col === 0 ) {
                  dot.addClass( 'goal' ).addClass( 'agent' );
                } else if( row ===  2 + problemK && col === columns - 1 ) {
                  dot.addClass( 'goal' ).addClass( 'opponent' );
                }
              } else {
                dot.addClass( 'unreachable' );
              }
              if( vertex ) {
                addEdges( td, vertex );
              }

              // squares.addClass('squares');
              // squares.append( squareTL ).append( squareTR ).append( squareBL ).append( squareBR );
              // td.append( squares );

              td.append( dot.addClass( 'dot' ) );
              tr.append( td );
            }
            table.append( tr );
          }
          container.append( table );
          element.append( container );
        };

      }
    };
  }]);

})();

(function() {
	'use strict';

	angular.module('dai.papersoccer.soccerfield', [ 'dai.papersoccer.soccerfield.directive']);

})();

(function() {
	'use strict';

	angular.module('dai.map.controls.center.controller', ['dai.map.service'])

	.controller('CenterControlController', ['MapService', function(MapService) {
		this.center = function() {
			MapService.resetCenter();
		};
	}]);

})();
//# sourceMappingURL=maps/app.js.map