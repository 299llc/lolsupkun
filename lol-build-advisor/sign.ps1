$signtool = 'C:\Program Files (x86)\Windows Kits\10\bin\10.0.26100.0\x64\signtool.exe'
$thumbprint = '2A48EF2328DAA882214E0A389AC4742422FCE18F'

$exeFiles = Get-ChildItem -Path (Join-Path $PSScriptRoot 'release') -Filter '*.exe'
foreach ($exe in $exeFiles) {
    Write-Host "Signing: $($exe.Name)"
    & $signtool sign /sha1 $thumbprint /fd SHA256 /tr http://timestamp.digicert.com /td SHA256 $exe.FullName
}

Write-Host ""
Write-Host "Verifying signatures..."
foreach ($exe in $exeFiles) {
    & $signtool verify /pa $exe.FullName
}
