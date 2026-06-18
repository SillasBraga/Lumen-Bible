$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = "C:\Python314\python.exe"
$psi.Arguments = "-m http.server 4173 -d ""C:\Users\sillas.braga_sankhya\Documents\App da bilia\dist"""
$psi.WorkingDirectory = "C:\Users\sillas.braga_sankhya\Documents\App da bilia"
$psi.UseShellExecute = $true
$psi.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden

$process = [System.Diagnostics.Process]::Start($psi)
$process.Id
