var moment = require('moment');

var actionHelper = require('../helpers/action');

var nextId = 1;

var Agent = function ( token, name ) {
  this.token = token;
  this.id = nextId;
  nextId++;
  this.connectedAt = moment().format();

  this.name = name;
  this.messages = [];

  // The latest action the agent performed
  this.latestAction = undefined;
  this.actionsPerformed = 0;

  // Agent location
  this.locationId = undefined;

  // Agent busy when an activity is entered and until it is completed / the agent leaves
  this.isBusy = false;
  this.activityId = undefined;

  // Agent utility
  this.utility = 0;
};

Agent.prototype.leave = function() {
  this.locationId = undefined;
  this.isBusy = false;
  this.activityId = undefined;
};

Agent.prototype.performedAction = function(action) {
  this.latestAction = action;
  this.actionsPerformed++;
};

Agent.prototype.isBusyWith = function(activityId) {
  return this.isBusy && (this.activityId === activityId);
};

Agent.prototype.setBusyWith = function(activityId) {
  if (activityId) {
    this.isBusy = true;
    this.activityId = activityId;
  } else {
    this.isBusy = false;
    this.activityId = undefined;
  }
};

Agent.prototype.toString = function() {
  return 'Agent ' + this.name + ' at ' + this.locationId + ' [' + this.token + ',' + this.connectedAt + ']';
};

Agent.prototype.actionSay = function(message) {
  var now = moment().format();

  this.messages.push({
    message: message,
    timestamp: now
  });

  return actionHelper.applicable('agent/say', [message]);
};

module.exports = Agent;
