const AWS = require('aws-sdk')
const fs = require("fs")

const { Toolkit } = require('actions-toolkit')
const tools = new Toolkit()

let ec2Config = { region: 'us-east-1'}
let ec2 = new AWS.EC2(ec2Config)


 let regionFile = fs.readFileSync(tools.workspace + "/regions.json")
 var regions = JSON.parse(regionFile)

 console.log(regions)
