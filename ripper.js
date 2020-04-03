const core = require('@actions/core')
const moment = require('moment')

function processInstance (instance) {
  core.debug(`Processing instance ${instance.InstanceId}`)
  const owner = getTag(instance, 'OWNER')
  const name = getTag(instance, 'NAME')
  const stop = getTag(instance, 'STOP')
  const terminate = getTag(instance, 'TERMINATE') 
  
  core.debug(`Owner: ${owner}, Name: ${name}, Stop: ${stop}, Terminate: ${terminate}`)

  if (!isDateSet(terminate)) {
    core.debug(`Terminate date not set`)
  } 
  
  if (!isDateSet(stop)) {
    core.debug(`Stop date not set`)
  }
}

function getTag (instance, tag) {
  const ownerTag = instance.Tags.find(instanceTag => instanceTag.Key.toUpperCase() === tag)
  if (!ownerTag || ownerTag.Value.length === 0 || ownerTag.Value === 'undefined') {
    return null
  } else {
    return ownerTag.Value
  }
}

function isDateSet(date) {
  return !(!terminate || terminate.toUpperCase() !== 'NEVER' || !moment(terminate).isValid()) 
}

module.exports = { processInstance }