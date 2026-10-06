param([string]$Dir, [string]$Voice = "Microsoft Zira Desktop", [int]$Rate = 0)
# Offline text to speech with the Windows voices (no network, nothing leaves the PC).
Add-Type -AssemblyName System.Speech
$items = Get-Content (Join-Path $Dir "narration.json") -Raw -Encoding utf8 | ConvertFrom-Json
New-Item -ItemType Directory -Force (Join-Path $Dir "audio") | Out-Null
$s = New-Object System.Speech.Synthesis.SpeechSynthesizer
$s.SelectVoice($Voice)
$s.Rate = $Rate
$s.Volume = 100
$out = @()
foreach ($it in $items) {
  $wav = Join-Path $Dir ("audio\" + $it.id + ".wav")
  $s.SetOutputToWaveFile($wav)
  $s.Speak($it.text)
  $s.SetOutputToNull()
  $dur = [double](ffprobe -v error -show_entries format=duration -of csv=p=0 $wav)
  $out += [pscustomobject]@{ id = $it.id; seconds = [math]::Round($dur, 2); words = ($it.text -split '\s+').Count }
}
$s.Dispose()
$out | ConvertTo-Json | Set-Content (Join-Path $Dir "durations.json") -Encoding utf8
$out | Format-Table -AutoSize | Out-String
"total narration seconds: $([math]::Round(($out | Measure-Object seconds -Sum).Sum,1))"
