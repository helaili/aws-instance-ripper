const core = require('@actions/core')
const github = require('@actions/github')

try {
  const defaultNotificationDelay = core.getInput('defaultNotificationDelay')
  const defaultStopDelay = core.getInput('defaultStopDelay')
  const defaultTerminateDelay = core.getInput('defaultTerminateDelay')
  const AWSAccessKeyID = core.getInput('AWSAccessKeyID')
  const AWSSecretAccessKey = core.getInput('AWSSecretAccessKey')
  

  core.debug(`Inside try block ${AWSAccessKeyID}`);

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