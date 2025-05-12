param(
    [int]$port
)

if (-not $port) {
    Write-Host "Kullanım: .\kill-port.ps1 -port 3000"
    exit
}

$pid = (Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -First 1).OwningProcess

if ($pid) {
    Write-Host "Port $port is used by PID $pid. Killing it..."
    Stop-Process -Id $pid -Force
    Write-Host "Process $pid killed."
} else {
    Write-Host "Port $port is not in use."
}
