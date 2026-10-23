# Tarefa "Cosmos-Spotify": atualiza a coleção do papel de parede (mais ouvidos de sempre + recentes +
# artistas) a cada 3 horas, escondida (sem janela piscando), por usuário e sem admin.
# O fundo relê capas/spotify.js sozinho a cada 30 min.
$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent $PSScriptRoot
$node = (Get-Command node.exe).Source
$vbs = Join-Path $PSScriptRoot 'rodar-escondido.vbs'
$script = Join-Path $raiz 'ferramentas\spotify.mjs'
$acao = New-ScheduledTaskAction -Execute 'wscript.exe' -WorkingDirectory $raiz -Argument "`"$vbs`" `"$node`" `"$script`" atualizar"
$gatilho = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(5) -RepetitionInterval (New-TimeSpan -Hours 3)
$conf = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 10)
Register-ScheduledTask -TaskName 'Cosmos-Spotify' -Action $acao -Trigger $gatilho -Settings $conf -Force `
  -Description 'Cosmos: atualiza as capas do papel de parede pelo Spotify (mais ouvidos e recentes). Só leitura.' | Out-Null
$i = Get-ScheduledTask -TaskName 'Cosmos-Spotify' | Get-ScheduledTaskInfo
"Cosmos-Spotify: próxima execução $($i.NextRunTime), depois a cada 3 h"
