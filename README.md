# aws-instance-ripper

Control your AWS usage by automatically stopping or terminating AWS instances.

This GitHub Action looks at all your EC2 instances across all regions and look for 4 instance tags:
- **Owner**: who's in charge of this instance?
- **Name**: every instance should have a name.
- **Stop**: when should this instance be stopped. Format is `yyyy-mm-dd` for a date, or `Never` (case insensitive) for instances that shall never be stopped.
- **Terminate**: when should this instance be terminated. Format is `yyyy-mm-dd`, or `Never` (case insensitive) for instances that shall never be terminated.

In case one of the tags is missing, the instance will be reported in [the workflow's cache](https://github.com/JasonEtco/actions-toolkit#toolsstore).
In addition to this, a default stop (21 days from today) or termninate (35 days from today) date will be set if the matching tag is missing.
Instances are also reported when reaching 14 days of their stop date or terminate date.

This action can be complemented by [aws-instance-ripper-issue-reporter](https://github.com/helaili/aws-instance-ripper-issue-reporter) which print this action report as a GitHub issue comment.

## Secrets
`AWS_SECRET_ACCESS_KEY`
`AWS_ACCESS_KEY_ID`

## Environment variable
`DRY_RUN`: if set to `true` (case insensitive), no action will take place on your AWS account. Look at you action log to see the simulated outcome of this process.

`NOTICE_PERIOD_DAYS`: threshold before stop or terminate date to start reporting the instance. Defaults to 14 days.

`STOP_GRACE_DAYS`: instances without a stop date will be have a stop date set to this many days in the future. Defaults to 21 days.

`TERMINATE_GRACE_DAYS`: instances without a terminate date will be have a terminations date set to this many days in the future. Defaults to 35 days.
