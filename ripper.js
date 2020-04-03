const core = require('@actions/core')
const moment = require('moment')

function processInstance (instance, ripperConfig) {
  core.debug(`Processing instance ${instance.InstanceId}`)
  const tags = []
  let reportInstance = false 
  const reportData = {
    instanceId: instance.InstanceId,
    owner: {
      value: getTag(instance, 'OWNER')
    },
    name: {
      value: getTag(instance, 'NAME')
    },
    stop: {
      value: getTag(instance, 'STOP')
    }, 
    terminate: {
      value: getTag(instance, 'TERMINATE') 
    }
  }

  core.debug(`Owner: ${reportData.owner.value}, Name: ${reportData.name.value}, Stop: ${reportData.stop.value}, Terminate: ${reportData.terminate.value}`)

  if(!reportData.owner.value) {
    reportData.owner.notSet = true
    reportInstance = true
  }

  if(!reportData.name.value) {
    reportData.name.notSet = true
    reportInstance = true
  }

  if (!isDateSet(reportData.terminate.value)) {
    core.debug(`Terminate date not set`)
    reportInstance = true
    reportData.terminate.notSet = true

    // A default termination delay is set, so we can provide a termination date
    if (ripperConfig.defaultTerminateDelay) {
      const tag = {
        Key: 'Terminate',
        Value: moment().add(ripperConfig.defaultTerminateDelay, 'days').format('YYYY-MM-DD')
      }
      tags.push(tag)
      reportData.terminate.value = tag.Value
      core.debug(`Terminate now set to ${tag.Value}`)
    } 
  } 
  
  if (!isDateSet(reportData.stop.value)) {
    core.debug(`Stop date not set`)
    reportInstance = true
    reportData.stop.notSet = true

    // A default stop delay is set, so we can provide a stop date
    if (ripperConfig.defaultStopDelay) {
      const tag = {
        Key: 'Stop',
        Value: moment().add(ripperConfig.defaultStopDelay, 'days').format('YYYY-MM-DD')
      }
      tags.push(tag)
      reportData.stop.value = tag.Value
      core.debug(`Stop now set to ${tag.Value}`)
    }
  }

  if (reportInstance) {
    if (tags.length != 0) {
      reportData.tags = tags
    }
  
    return reportData
  } else {
    return null
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