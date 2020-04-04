const core = require('@actions/core')
const github = require('@actions/github')

try {
  const data = JSON.parse(core.getInput('data'))
  const regions = Object.getOwnPropertyNames(data)
  let report = ''

  if (regions) {
    regions.forEach(region => {
      core.debug(`Processing ${region}`)
      let regionTable = generateRegionTable(data[region])
      report = report.concat(`### [${region}](https://console.aws.amazon.com/ec2/v2/home?region=${region}#Instances:sort=tag:Name)\n${regionTable}\n`)
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
    markdownTable = `Instance ID|Name|Owner|Stop|Terminate\n-|-|-|-|-\n`
  }
  reportData.forEach(instance => {
    markdownTable = markdownTable.concat(`${instance.instanceId}|${instance.name.value}|${instance.owner.value}|${instance.stop.value}|${instance.terminate.value}\n`)
  })

  return markdownTable
}