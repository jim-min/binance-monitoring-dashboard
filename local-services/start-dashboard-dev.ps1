$ErrorActionPreference = "Stop"
$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptRoot
$LogDir = Join-Path $ScriptRoot "logs"
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Test-LocalPort {
  param([int]$Port)
  try {
    $client = New-Object Net.Sockets.TcpClient
    $async = $client.BeginConnect("127.0.0.1", $Port, $null, $null)
    $ok = $async.AsyncWaitHandle.WaitOne(300, $false)
    if ($ok) { $client.EndConnect($async) }
    $client.Close()
    return $ok
  } catch {
    return $false
  }
}

function Start-Detached {
  param(
    [string]$Name,
    [string]$FilePath,
    [string[]]$ArgumentList,
    [string]$WorkingDirectory,
    [string]$Stdout,
    [string]$Stderr
  )
  Start-Process -FilePath $FilePath -ArgumentList $ArgumentList -WorkingDirectory $WorkingDirectory -WindowStyle Hidden -RedirectStandardOutput $Stdout -RedirectStandardError $Stderr | Out-Null
  Add-Content -LiteralPath (Join-Path $LogDir "startup.log") -Encoding UTF8 -Value "$(Get-Date -Format o) started $Name"
}

if (-not (Test-LocalPort 8787)) {
  Start-Detached -Name "binance-api" -FilePath "npm.cmd" -ArgumentList @("run", "server:dev") -WorkingDirectory $ProjectRoot -Stdout (Join-Path $LogDir "api.stdout.log") -Stderr (Join-Path $LogDir "api.stderr.log")
}

if (-not (Test-LocalPort 5173)) {
  Start-Detached -Name "binance-frontend" -FilePath "npm.cmd" -ArgumentList @("run", "dev") -WorkingDirectory $ProjectRoot -Stdout (Join-Path $LogDir "vite.stdout.log") -Stderr (Join-Path $LogDir "vite.stderr.log")
}

Write-Output "Dashboard dev servers are starting."
Write-Output "Frontend: http://127.0.0.1:5173/"
Write-Output "API: http://127.0.0.1:8787/api/health"
