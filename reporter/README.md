# aws-instance-ripper-reporter

The `Reporter` action displays the outcome of the `Ripper` action in a newly created issue. 

Parameter | Description | Required
----------|-------------|--------- 
data      | The content of the output of the ripper stage, like `${{ steps.ripper.outputs.report }}` | true
token     | The GITHUB_TOKEN secret | true
label     | The label to add to the reporting issue | false