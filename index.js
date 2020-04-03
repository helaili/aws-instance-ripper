const core = require('@actions/core')
const AWS = require('aws-sdk')
const ripper = require('./ripper')

try {
  const defaultNotificationDelay = core.getInput('defaultNotificationDelay')
  const defaultStopDelay = core.getInput('defaultStopDelay')
  const defaultTerminateDelay = core.getInput('defaultTerminateDelay')
  const AWSAccessKeyID = core.getInput('AWSAccessKeyID')
  const AWSSecretAccessKey = core.getInput('AWSSecretAccessKey')
  const reportData = {}

  const dryRun = true

  core.debug(`dryRun: ${core.getInput('dryRun') === true || core.getInput('dryRun') === 'true'}`)
  core.debug(`defaultNotificationDelay: ${defaultNotificationDelay}`)
  core.debug(`defaultStopDelay: ${defaultStopDelay}`)
  core.debug(`defaultTerminateDelay: ${defaultTerminateDelay}`)

  const ripperConfig = {
    defaultNotificationDelay: defaultNotificationDelay,
    defaultStopDelay: defaultStopDelay,
    defaultTerminateDelay: defaultTerminateDelay
  }

  const ec2Config = { 
    region: 'us-east-1',
    accessKeyId: AWSAccessKeyID,
    secretAccessKey: AWSSecretAccessKey
  }
  let ec2Global = new AWS.EC2(ec2Config)

  /*
   * Get all the regions 
   */
  ec2Global.describeRegions({}, (regionsErr, regions) => {
    if (regionsErr) {
      core.setFailed(regionsErr)
    } else {
      core.debug(`Retrieved ${regions.Regions.length} AWS regions`)

      /*
       * Now iterating through each region
       */
      regions.Regions.forEach(region => {
        ec2Config.region = region.RegionName
        let ec2Regional = new AWS.EC2(ec2Config)
        
        /*
         * Get the instances in the region 
         */
        ec2Regional.describeInstances({}, (instancesErr, instances) => {
          if (instancesErr) {
            core.error(`Couldn't retrieve instances from AWS region ${region.RegionName}`)
          } else {
            // You think you're getting instances but it's really Reservations. 
            instances.Reservations.forEach(reservation => {
              // Reservations can hold serveral instances 
              reservation.Instances.forEach(instance => {
                const reportedInstance = ripper.processInstance(instance, ripperConfig)
                
                if (reportedInstance) {
                  // Region doesn't have any reported instance yet
                  if(!reportData[region.RegionName]) {
                    reportData[region.RegionName] = []
                  }
                  reportData[region.RegionName].push(reportedInstance)
                  // Keep updating the output paramater
                  core.setOutput('report', JSON.stringify(reportData))

                  if (reportedInstance.terminate.now) {
                    // Let's terminate this one
                    terminateInstance(ec2Regional, reportedInstance, dryRun)
                  } else {
                    //  We didn't terminate the instance, we might need to stop and/or set tags
                    if (reportedInstance.stop.now) {
                      stopInstance(ec2Regional, reportedInstance, dryRun)
                    }

                    if (reportedInstance.tags) {
                      // There are tags to update on this instance
                      updateTags(ec2Regional, reportedInstance, dryRun)
                    }
                  }
                }
              })
            })  
          }
        })
      })
    }
  })
} catch (error) {
  core.setFailed(error.message);
}

/*
 * Update the instance tags
 */
function updateTags(ec2Client, reportedInstance, dryRun) {
  const tagData = {
    Resources: [
      reportedInstance.instanceId
    ],
    Tags: reportedInstance.tags,
    DryRun: dryRun
  }

  core.debug(`Saving tags ${JSON.stringify(tagData)}`)

  ec2Client.createTags(tagData, (tagError, tagResponse) => {
    if (tagError) {
      core.error(`Failed creating tag: ${tagError}`)
    } else {
      core.debug(`Succesfully created tags: ${tagResponse}`)
    }
  })
}

/*
 * Terminate the instance one by one. We could batch this in the future to save API calls
 */
function terminateInstance(ec2Client, reportedInstance, dryRun) {
  let argObj = {
    InstanceIds: [
      reportedInstance.instanceId
    ],
    DryRun: dryRun
  }

  ec2Client.terminateInstances(argObj, function(err, data) {
    if (err) {
      core.error(`Failed terminating instance: ${err}`)
    } else {
      core.debug(`Succesfully terminated instance: ${data}`)
    }
  })
}

/*
 * Stop the instance one by one. We could batch this in the future to save API calls
 */
function stopInstance(ec2Client, reportedInstance, dryRun) {
  let argObj = {
    InstanceIds: [
      reportedInstance.instanceId
    ],
    DryRun: dryRun
  }

  ec2Client.stopInstances(argObj, function(err, data) {
    if (err) {
      core.error(`Failed stopping instance: ${err}`)
    } else {
      core.debug(`Succesfully stopped instance: ${data}`)
    }
  })
}