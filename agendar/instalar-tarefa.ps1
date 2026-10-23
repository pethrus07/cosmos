# Tarefas do Cosmos, escondidas (sem janela piscando), por usuário e sem admin:
#   Cosmos-Spotify  a cada 3 h: mais ouvidos de sempre + recentes + artistas (capas/spotify.js)
#   Cosmos-Dados    a cada 10 min: commits, notas do Sinapse e Hermes do dia (dados/dia.js)
# O fundo relê os dois arquivos sozinho (30 min e 2 min).
$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent $PSScriptRoot
$node = (Get-Command node.exe).Source
$vbs = Join-Path $PSScriptRoot 'rodar-escondido.vbs'
$conf = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 10)

function Registrar($nome, $script, $argumentos, $intervalo, $descricao) {
  $acao = New-ScheduledTaskAction -Execute 'wscript.exe' -WorkingDirectory $raiz -Argument "`"$vbs`" `"$node`" `"$(Join-Path $raiz $script)`" $argumentos"
  $gatilho = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(2) -RepetitionInterval $intervalo
  Register-ScheduledTask -TaskName $nome -Action $acao -Trigger $gatilho -Settings $conf -Force -Description $descricao | Out-Null
  $i = Get-ScheduledTask -TaskName $nome | Get-ScheduledTaskInfo
  "${nome}: próxima execução $($i.NextRunTime), depois a cada $($intervalo.TotalMinutes) min"
}

Registrar 'Cosmos-Spotify' 'ferramentas\spotify.mjs' 'atualizar' (New-TimeSpan -Hours 3) 'Cosmos: atualiza as capas do papel de parede pelo Spotify (mais ouvidos e recentes). Só leitura.'
Registrar 'Cosmos-Dados' 'ferramentas\dados-do-dia.mjs' '' (New-TimeSpan -Minutes 10) 'Cosmos: commits, notas do Sinapse e propostas do Hermes de hoje viram estrelas no papel de parede.'
