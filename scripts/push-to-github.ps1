# Add GitHub to known hosts
$knownHostsPath = "$env:USERPROFILE\.ssh\known_hosts"
$gitHubKey = "github.com ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOMqqnkVzrm0SdG6ZQ+h41gDQrU384QtmQ+q1ItI4xN9"

if (-not (Test-Path $knownHostsPath)) {
    New-Item -ItemType File -Path $knownHostsPath -Force | Out-Null
}

$knownHosts = @(Get-Content $knownHostsPath -ErrorAction SilentlyContinue)
if ($knownHosts -notcontains $gitHubKey) {
    Add-Content -Path $knownHostsPath -Value $gitHubKey
}

# Set environment variable for SSH
$env:GIT_SSH_COMMAND = "ssh -o StrictHostKeyChecking=accept-new -o UserKnownHostsFile=$knownHostsPath"

# Push to github
cd "c:\Users\LATITUDE 5400\Downloads\Learnership Management"
Write-Host "Pushing to GitHub..."
git push origin main
