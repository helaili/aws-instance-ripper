const core = require('@actions/core')
const github = require('@actions/github')

try {
  const ghToken = core.getInput('token')
  const octokit = new github.GitHub(ghToken)
  const context = github.context

  const data = JSON.parse(core.getInput('data'))
  const regions = Object.getOwnPropertyNames(data)
  let report = ''
  const labels = []
  
  if (core.getInput('label')) {
    labels.push(core.getInput('label'))
  }

  if (regions) {
    for (const region of regions) {
      core.debug(`Processing ${region}`)
      let regionTable = generateRegionTable(data[region])
      report = report.concat(`### [${region}](https://console.aws.amazon.com/ec2/v2/home?region=${region}#Instances:sort=tag:Name)\n${regionTable}\n`)
    }

    octokit.issues.create({
      ...context.repo,
      title: 'AWS Ripper report',
      body: report,
      labels: labels
    })
  } else {
    core.warning('Nothing to report')
  }

  core.debug(report)
} catch (error) {
  core.setFailed(error.message);
}


function generateRegionTable(reportData) {
  let markdownTable = null
  core.debug(`Generating table for ${reportData}`)

  if (reportData.length !== 0) {
    markdownTable = `Name|Owner|Stop|Terminate|Instance ID\n-|-|-|-|-\n`
  }
  reportData.forEach(instance => {
    markdownTable = markdownTable.concat(`${formatName(instance)}|${formatOwner(instance)}|${formatStop(instance)}|${formatTerminate(instance)}|${instance.instanceId}\n`)
  })

  return markdownTable
}

function formatName(instance) {
  if (!instance.name.value || instance.name.value === 'null') {
    return ':scream:'
  } else {
    return instance.name.value
  }
}

function formatOwner(instance) {
  if (!instance.owner.value || instance.owner.value === 'null') {
    return ':ghost:'
  } else {
    return instance.owner.value
  }
}

function formatStop(instance) {
  if (!instance.stop.value || instance.stop.value === 'null') {
    return ':fearful:'
  } else {
    let date = instance.stop.value
    if (instance.stop.notSet) {
      date = `:new: ${date}`
    }
    if (instance.stop.now) {
      date = `:stop_sign: ${date}`
    }
    return date
  }
}

function formatTerminate(instance) {
  if (!instance.terminate.value || instance.terminate.value === 'null') {
    return ':fearful:'
  } else {
    let date = instance.terminate.value
    if (instance.terminate.notSet) {
      date = `:new: ${date}`
    }
    if (instance.terminate.now) {
      date = `:skull_and_crossbones: ${date}`
    }
    return date
  }
}