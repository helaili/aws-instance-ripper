const core = require('@actions/core')
// const moment = require('moment')

function processInstance (instance) {
  core.debug(`Processing instance ${instance.InstanceId}`)
  const owner = getTag(instance, 'OWNER')
  const name = getTag(instance, 'NAME')
  const stop = getTag(instance, 'STOP')
  const terminate = getTag(instance, 'TERMINATE')

  core.debug(`Owner: ${owner}, Name: ${name}, Stop: ${stop}, Terminate: ${terminate}`)
}


function getTag (instance, tag) {
  const ownerTag = instance.Tags.find(instanceTag => instanceTag.Key.toUpperCase() === tag)
  if (!ownerTag || ownerTag.Value.length === 0 || ownerTag.Value === 'undefined') {
    return null
  } else {
    return ownerTag.Value
  }
}

module.exports = { processInstance }