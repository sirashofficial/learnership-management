
$body = @{
    date                = "2026-02-09"
    groupName           = "Test Group"
    facilitator         = "Test Facilitator"
    modulesCovered      = "Module 1"
    topicsCovered       = "Topic A"
    activitiesCompleted = @("Activity 1", "Activity 2")
    observations        = "Students were engaged."
    challengesFaced     = "None"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/reports/daily/generate-ai" -Method Post -ContentType "application/json" -Body $body

    Write-Host "Success: $($response.success)"
    Write-Host "Exemplar Used: $($response.exemplarUsed)"
    Write-Host "--- REPORT PREVIEW ---"
    Write-Host $response.report.Substring(0, [math]::Min(500, $response.report.Length))
}
catch {
    Write-Host "Error: $_"
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        if ($stream) {
            $bodyContent = $reader.ReadToEnd()
            Write-Host "Response Body: $bodyContent"
            $bodyContent | Out-File -FilePath "debug_response.json" -Encoding UTF8
        }
    }
}
