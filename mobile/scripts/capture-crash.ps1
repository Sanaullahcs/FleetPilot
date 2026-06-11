# Wait for a USB-debugging device, then capture FleetPilot crash logs.
$env:ANDROID_HOME = "C:\Users\Sanaullah\AppData\Local\Android\Sdk"
$env:Path = "$env:ANDROID_HOME\platform-tools;$env:Path"

Write-Host "Waiting for Android device (enable USB debugging on your phone)..." -ForegroundColor Yellow
adb kill-server | Out-Null
adb start-server | Out-Null

$deadline = (Get-Date).AddMinutes(3)
while ((Get-Date) -lt $deadline) {
  $devices = adb devices | Select-String "device$"
  if ($devices) { break }
  Start-Sleep -Seconds 2
}

$connected = adb devices
Write-Host $connected
if ($connected -notmatch "device$") {
  Write-Host "No adb device found. On Pixel: Settings > System > Developer options > USB debugging ON, then tap Allow on the phone." -ForegroundColor Red
  exit 1
}

adb logcat -c
Write-Host ""
Write-Host "Launch FleetPilot on your phone now. Capturing errors for 45 seconds..." -ForegroundColor Cyan
adb logcat -v time *:S AndroidRuntime:E ReactNativeJS:E ReactNative:E ExpoModulesCore:E | Select-String -Pattern "fleetpilot|FATAL|Exception|Error" -CaseSensitive:$false
