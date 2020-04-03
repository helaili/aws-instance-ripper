const core = require('@actions/core')
const AWS = require('aws-sdk')
const ripper = require('./ripper')

try {
  const defaultNotificationDelay = core.getInput('defaultNotificationDelay')
  const defaultStopDelay = core.getInput('defaultStopDelay')
  const defaultTerminateDelay = core.getInput('defaultTerminateDelay')
  const AWSAccessKeyID = core.getInput('AWSAccessKeyID')
  const AWSSecretAccessKey = core.getInput('AWSSecretAccessKey')

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
                ripper.processInstance(instance, ripperConfig)
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