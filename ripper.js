const core = require('@actions/core')
// const moment = require('moment')

function processInstance (instance) {
  core.debug(`Retrieved instance ${instance.InstanceId}`)
}

module.exports = { processInstance }