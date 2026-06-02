$ErrorActionPreference = "Stop"
$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptRoot
$LogDir = Join-Path $ScriptRoot "logs"
$TelegramDir = Join-Path $ScriptRoot "telegram-news"
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

$pidFile = Join-Path $TelegramDir "telegram-monitor.pid"
$existingPid = $null
if (Test-Path -LiteralPath $pidFile) {
  $raw = Get-Content -LiteralPath $pidFile -ErrorAction SilentlyContinue | Select-Object -First 1
  if ([int]::TryParse($raw, [ref]$existingPid)) {
    if (Get-Process -Id $existingPid -ErrorAction SilentlyContinue) {
      Add-Content -LiteralPath (Join-Path $LogDir "startup.log") -Encoding UTF8 -Value "$(Get-Date -Format o) telegram-news already running pid=$existingPid"
      exit 0
    }
  }
}

$python = Join-Path $env:LOCALAPPDATA "Programs\Python\Python311\python.exe"
if (-not (Test-Path -LiteralPath $python)) { $python = "python.exe" }
$proc = Start-Process -FilePath $python -ArgumentList @("telegram_monitor.py") -WorkingDirectory $TelegramDir -WindowStyle Hidden -RedirectStandardOutput (Join-Path $TelegramDir "stdout.log") -RedirectStandardError (Join-Path $TelegramDir "stderr.log") -PassThru
Set-Content -LiteralPath $pidFile -Encoding UTF8 -Value $proc.Id
Add-Content -LiteralPath (Join-Path $LogDir "startup.log") -Encoding UTF8 -Value "$(Get-Date -Format o) started telegram-news pid=$($proc.Id)"
