var api = {};
var logger = {};
(function($) {
  'use strict';
  var logElement = $('.log-items');
  logger.addToLog = function(data, isError) {
    var logItem = $('<li></li>');
    if (isError) {
      logItem.addClass('log-item-error');
    }
    logItem.html(data);
    logElement.prepend(logItem);
  };

  var agentStateElement = $('.state-items');
  logger.setState = function( agentState ) {
    agentStateElement.empty('ul li');
    $.each( agentState, function( key, value ) {
      if ( typeof value === 'object' ) {
        return true; // continue
      }
      var el = $('<li></li>');
      el.html( '<b>' + key + '</b>: <i>' + JSON.stringify( value ) + '</i>' );
      agentStateElement.append( el );
    });
  };

  api.invokingAgent = {};
  var latestResponse;

  api.connect = function(name, agent) {
    api.api('environment/connect', {
      name: name
    }, function(response) {
      agent.agentState.agentToken = response.agentToken;
      agent.agentState.hasConnected = true;
      api.invokingAgent = agent;
      api.agentToken = response.agentToken;
      logger.addToLog('environment/connect() received token: ' + response.agentToken);
      $('#agentToken').text( response.agentToken );
    });
  };

  var defaultErrorHandler = function(jqXHR, textStatus, errorThrown) {
    logger.addToLog('[api.defaultErrorHandler] An error occured: ' + textStatus + errorThrown, true);
  };

  var defaultCompleteHandler = function(jqXHR, textStatus) {
    api.invokingAgent.act( latestResponse );
  };

  var requestOptions = {
    type: 'GET',
    beforeSend: function(jqxhr, settings) {
      if (typeof api.agentToken !== 'undefined') {
        jqxhr.setRequestHeader('agentToken', api.agentToken);
      }
    },
    cache: false,
    dataType: 'json',
  };

  api.api = function(path, data, successCb, errorCb, completeCb) {
    var errorHandler = errorCb || defaultErrorHandler;
    var completeHandler = completeCb || defaultCompleteHandler;
    var request = {
      url: apiUrl + path,
      data: data,
      success: function(data, testStatus, jqXHR) {
        latestResponse = data;
        if (typeof successCb === 'function') {
          successCb(data, testStatus, jqXHR);
        }
      },
      error: errorHandler,
      complete: completeHandler
    };

    jQuery.extend(request, requestOptions); // Merge into request
    $.ajax( request );
  };
})(jQuery);
