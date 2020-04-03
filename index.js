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
                  if(!reportData[region.RegionName]) {
                    reportData[region.RegionName] = []
                  }
                  reportData[region.RegionName].push(reportedInstance)
                  if (reportedInstance.tags) {
                    updateTags(ec2Regional, reportedInstance, true)
                  }
                }
              })
            })  
          }
        })
      })
    }
  })

  /* 
  core.setOutput('instancesWithMissingLabel', '')
  core.setOutput('instancesToStop', '')
  core.setOutput('instancesToStopSoon', '')
  core.setOutput('instancesToTerminate', '')
  core.setOutput('instancesToTerminateSoon', '')
  */
} catch (error) {
  core.setFailed(error.message);
}


function updateTags(ec2Client, reportedInstance, dryRun) {
  const tagData = {
    Resources: [
      reportedInstance.instanceId
    ],
    Tags: reportedInstance.tags,
    DryRun: dryRun
  }

  ec2Client.createTags(tagData, (tagError, tagResponse) => {
    if (tagError) {
      core.error(tagError)
    } else {
      core.debug(`Succesfully created tags: ${tagResponse}`)
    }
  })
}