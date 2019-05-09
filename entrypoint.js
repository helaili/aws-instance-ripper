const AWS = require('aws-sdk')

const { Toolkit } = require('actions-toolkit')
const tools = new Toolkit()

const NOTICE_PERIOD_IN_DAYS = 14
const STOP_GRACE_DAYS = 21
const TERMINATE_GRACE_DAYS = 35

let _dryRun = process.env.DRY_RUN && process.env.DRY_RUN.toUpperCase() === 'TRUE'
if (_dryRun) {
  console.log('Dry Run mode is ON')
}

let ec2Config = { region: 'us-east-1'}
let ec2Global = new AWS.EC2(ec2Config)

let _now = new Date()
let _noticePeriod = new Date()
_noticePeriod.setDate(_noticePeriod.getDate() + NOTICE_PERIOD_IN_DAYS)

let _newTerminateDate = new Date()
_newTerminateDate.setDate(_now.getDate() + TERMINATE_GRACE_DAYS)
let _newTerminateDateStr = _newTerminateDate.toISOString().slice(0, 10)

let _newStopDate = new Date()
_newStopDate.setDate(_now.getDate() + STOP_GRACE_DAYS)
let _newStopDateStr = _newStopDate.toISOString().slice(0, 10)

/********************************************************************
 *
 * Main loop - Going through each region and retrieving all instances
 *
 *********************************************************************/

ec2Global.describeRegions({}, (regionsErr, regions) => {
  if (regionsErr) {
    console.error(regionsErr, regionsErr.stack)
  } else {
    regions.Regions.forEach(region => {
      ec2Config.region = region.RegionName
      let ec2Regional = new AWS.EC2(ec2Config)

      ec2Regional.describeInstances({}, (instancesErr, instances) => {
        if (instancesErr) {
          console.error(instancesErr, instancesErr.stack)
        } else {
          let regionalReportingData = {
            region: region.RegionName,
            terminate : [],
            stop : [],
            report: [],
            tags: []
          }

          instances.Reservations.forEach(reservation => {
            reservation.Instances.forEach(instance => {
              processInstance(instance, regionalReportingData)
            })
          })

          processTermination(ec2Regional, regionalReportingData.terminate)
          processStop(ec2Regional, regionalReportingData.stop)
          processTags(ec2Regional, regionalReportingData.tags)

          if (regionalReportingData.report.length !== 0) {
            tools.store.set(region.RegionName, regionalReportingData.report)
          }
        }
      })
    })
  }
})

function processInstance(instance, regionalReportingData) {
  let instanceReport = {
    instanceId: instance.InstanceId,
    needReport: false
  }

  let tags = []
  let termination = false

  let terminateTag = instance.Tags.find(tag => tag.Key.toUpperCase() === 'TERMINATE')
  if (terminateTag) {
    if (terminateTag.Value.toUpperCase() !== 'NEVER') {
      let terminateDate = new Date(terminateTag.Value)

      if (isNaN(terminateDate.getTime())) {
        //Invalid termination date
        instanceReport.terminate = 'Date format error'
        instanceReport.needReport = true
      } else if (terminateDate < _now) {
        //Instance termination date reached
        regionalReportingData.terminate.push(instance.InstanceId)
        instanceReport.terminate = 'Terminating instance'
        instanceReport.needReport = true
        termination = true
      } else if (terminateDate < _noticePeriod) {
        //Warn that something will happen soon
        instanceReport.terminate = `Happening soon (${terminateTag.Value})`
        instanceReport.needReport = true
      } else {
        // All goood, just copying the value for an eventual report
        instanceReport.terminate = terminateTag.Value
      }
    } else {
      instanceReport.terminate = 'Never'
    }
  } else {
    instanceReport.terminate = `Date missing. Now set to ${_newTerminateDateStr}`
    tags.push({
        Key: 'Terminate',
        Value: _newTerminateDateStr
      }
    )
    instanceReport.needReport = true
  }

  if (termination) {
    instanceReport.stop = 'n/a'
  } else {
    let stopTag = instance.Tags.find(tag => tag.Key.toUpperCase() === 'STOP')
    if (stopTag) {
      if (stopTag.Value.toUpperCase() !== 'NEVER') {
        let stopDate = new Date(stopTag.Value)

        if (isNaN(stopDate.getTime())) {
          //Invalid stop date
          instanceReport.stop = 'Date format error'
          instanceReport.needReport = true
        } else if (stopDate < _now) {
          //Instance stop date reached
          regionalReportingData.stop.push(instance.InstanceId)
          instanceReport.stop = 'Stopping instance'
          instanceReport.needReport = true
        } else if (stopDate < _noticePeriod) {
          //Warn that something will happen soon
          instanceReport.stop = `Happening soon (${stopTag.Value})`
          instanceReport.needReport = true
        } else {
          // All goood, just copying the value for an eventual report
          instanceReport.stop = stopTag.Value
        }
      } else {
        instanceReport.stop = 'Never'
      }
    } else {
      instanceReport.stop = `Date missing. Now set to ${_newStopDateStr}`
      tags.push({
          Key: 'Stop',
          Value: _newStopDateStr
        }
      )
      instanceReport.needReport = true
    }
  }

  let ownerTag = instance.Tags.find(tag => tag.Key.toUpperCase() === 'OWNER')
  if (!ownerTag || ownerTag.Value.length === 0 || ownerTag.Value === 'undefined') {
    //Missing owner name
    instanceReport.owner = `Owner missing`
    instanceReport.needReport = true
  } else {
    instanceReport.owner = ownerTag.Value
  }

  let nameTag = instance.Tags.find(tag => tag.Key.toUpperCase() === 'NAME')
  if (!nameTag || nameTag.Value.length === 0 || nameTag.Value === 'undefined') {
    //Missing instance name
    instanceReport.name = `Name missing`
    instanceReport.needReport = true
  } else {
    instanceReport.name = nameTag.Value
  }

  if (instanceReport.needReport) {
    regionalReportingData.report.push(instanceReport)
  }

  if (tags.length > 0) {
    // Building the tag object to set the new terminante and/or stop date
    let tagData = {
      Resources: [
        instance.InstanceId
      ],
      Tags: tags,
      DryRun: _dryRun
    }
    regionalReportingData.tags.push(tagData)
  }
}

function buildInstanceIdObj(instanceList) {
  let argObj = {
    InstanceIds: instanceList,
    DryRun: _dryRun
  }

  return argObj
}


function processTermination(ec2Client, terminationList) {
  let terminationObj = buildInstanceIdObj(terminationList)

  if (terminationObj.InstanceIds.length > 0) {
    ec2Client.terminateInstances(terminationObj, function(err, data) {
      if (err) {
        console.error(err, err.stack)
      }
    })
  }
}

function processStop(ec2Client, stopList) {
  let stopObj = buildInstanceIdObj(stopList)

  if (stopObj.InstanceIds.length > 0) {
    ec2Client.stopInstances(stopObj, function(err, data) {
      if (err) {
        console.error(err, err.stack)
      }
    })
  }
}

function processTags(ec2Client, tags) {
  tags.forEach(tagData => {
    ec2Client.createTags(tagData, (tagErr, tagRes) => {
      if (tagErr) {
        console.error(tagErr, tagErr.stack)
      }
    })
  })
}
