# aws-instance-ripper

Control your AWS usage by automatically stopping or terminating AWS instances.

This GitHub Action looks at all your EC2 instances across all regions and look for 4 instance tags:
- **Owner**: who's in charge of this instance?
- **Name**: every instance should have a name.
- **Stop**: when should this instance be stopped. Format is `yyyy-mm-dd` for a date, or `Never` (case insensitive) for instances that shall never be stopped.
- **Terminate**: when should this instance be terminated. Format is `yyyy-mm-dd`, or `Never` (case insensitive) for instances that shall never be terminated.

In case one of the tags is missing, the instance will be reported.
In addition to this, a stop and terminate date can be automatically set in the future.
Instances are also reported when reaching a configurable threshold from their stop date or terminate date.

Parameter | Description | Default | Required
----------|-------------|---------|--------- 
defaultNotificationDelay | Start warning about stopping when the date is close enough | 15 | false
defaultStopDelay | When Stop is not provided, how many days in the future should this value be set to | | false
defaultTerminateDelay | When Terminate is not provided, how many days in the future should this value be set to | | false 
AWSAccessKeyID | The AWS API access key id | | true
AWSSecretAccessKey | The AWS API secret access key | | true
dryRun | Set the AWS API DryRun mode. If set to `true`, nothing happens | false | false