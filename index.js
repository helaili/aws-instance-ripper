const core = require('@actions/core')
const AWS = require('aws-sdk')

try {
  const defaultNotificationDelay = core.getInput('defaultNotificationDelay')
  const defaultStopDelay = core.getInput('defaultStopDelay')
  const defaultTerminateDelay = core.getInput('defaultTerminateDelay')
  const AWSAccessKeyID = core.getInput('AWSAccessKeyID')
  const AWSSecretAccessKey = core.getInput('AWSSecretAccessKey')

  core.debug(`defaultNotificationDelay: ${defaultNotificationDelay}`)
  core.debug(`defaultStopDelay: ${defaultStopDelay}`)
  core.debug(`defaultTerminateDelay: ${defaultTerminateDelay}`)

  let ec2Config = { 
    region: 'us-east-1',
    accessKeyId: AWSAccessKeyID,
    secretAccessKey: AWSSecretAccessKey
  }
  let ec2Global = new AWS.EC2(ec2Config)

  /*
   * Looping through all the regions 
   */
  ec2Global.describeRegions({}, (regionsErr, regions) => {
    if (regionsErr) {
      core.setFailed(regionsErr)
    } else {
      core.debug(`Retrieved the following regions: ${regions}`)
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