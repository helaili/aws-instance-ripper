const core = require('@actions/core')
const moment = require('moment')

function processInstance (instance, ripperConfig) {
  core.debug(`Processing instance ${instance.InstanceId}`)
  const owner = getTag(instance, 'OWNER')
  const name = getTag(instance, 'NAME')
  const stop = getTag(instance, 'STOP')
  const terminate = getTag(instance, 'TERMINATE') 
  const tags = []

  core.debug(`Owner: ${owner}, Name: ${name}, Stop: ${stop}, Terminate: ${terminate}`)

  if (!isDateSet(terminate)) {
    core.debug(`Terminate date not set`)
    if (ripperConfig.defaultTerminateDelay) {
      const tag = {
        Key: 'Terminate',
        Value: moment().add(ripperConfig.defaultTerminateDelay, 'days').format('YYYY-MM-DD')
      }
      tags.push(tag)
      core.debug(`Terminate now set to ${tag.Value}`)
    }
  } 
  
  if (!isDateSet(stop)) {
    core.debug(`Stop date not set`)
    if (ripperConfig.defaultStopDelay) {
      const tag = {
        Key: 'Stop',
        Value: moment().add(ripperConfig.defaultStopDelay, 'days').format('YYYY-MM-DD')
      }
      tags.push(tag)
      core.debug(`Stop now set to ${tag.Value}`)
    }
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
  if (!date) {
    return false
  } else if (date.toUpperCase() === 'NEVER') {
    return true
  } else {
    return moment(date).isValid()
  }
}

module.exports = { processInstance }