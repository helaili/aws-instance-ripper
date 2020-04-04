# aws-instance-ripper

Control your AWS usage by automatically stopping or terminating AWS instances.

## Ripper

This GitHub Action looks at all your EC2 instances across all regions and look for 4 instance tags:
- **Owner**: who's in charge of this instance?
- **Name**: every instance should have a name.
- **Stop**: when should this instance be stopped. Format is `yyyy-mm-dd` for a date, or `Never` (case insensitive) for instances that shall never be stopped.
- **Terminate**: when should this instance be terminated. Format is `yyyy-mm-dd`, or `Never` (case insensitive) for instances that shall never be terminated.

In case one of the tags is missing, the instance will be reported.
In addition to this, a stop and terminate date can be automatically set in the future.
Instances are also reported when reaching a configurable threshold from their stop date or terminate date.

## Reporter

The `Reporter` action displays the outcome of the `Ripper` action in a newly created issue. 