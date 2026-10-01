# NetLab 3D — Laboratório de Redes (MVP)

Jogo educativo de redes de computadores em 3D no navegador (Three.js).
Semelhante ao Cisco Packet Tracer, mas numa sala técnica 3D: escolhes equipamentos,
ligas cabos entre portas, configuras IPs num terminal e testas com `ping`.

## Como correr

Precisa de um servidor estático local (módulos ES + import map):

```bash
python -m http.server 8000
# ou
npx serve .
```

Abre depois http://localhost:8000 no navegador.

O Three.js é carregado por CDN (jsdelivr), por isso é preciso internet na primeira carga.

## Controlos

| Ação | Como |
|---|---|
| Orbitar câmara | botão esquerdo do rato (em espaço vazio) |
| Mover câmara | botão direito |
| Zoom | roda do rato |
| Ligar cabo | arrastar de uma porta para outra (a cor do cabo = tipo selecionado) |
| Abrir terminal | clicar num equipamento |
| Adicionar equipamento | clicar na paleta à esquerda e depois na bancada |
| Mover equipamento | arrastar o corpo do equipamento |
| Cancelar | Esc |

## Regras de cabos (MVP)

- PC ↔ Switch: cabo **direto** (azul)
- PC ↔ PC ou Switch ↔ Switch: cabo **cruzado** (laranja)
- Cabo errado: fica ligado mas o link fica **down** (LED apagado)

## Comandos do terminal

```
help                          lista comandos
ip address <ip> <máscara>     configura o IP (ex.: ip address 192.168.1.10 255.255.255.0)
shutdown / no shutdown        desativa / ativa a interface
show interfaces               estado das interfaces
show ip                       configuração IP atual
ping <ip>                     testa conectividade
clear                         limpa o ecrã
exit                          fecha o terminal
```

## Missão 1

Liga o PC1 e o PC2 ao switch SW1 com os cabos corretos, configura IPs na rede
192.168.1.0/24 e faz ping do PC1 para o PC2.

## Estrutura

- `src/sim/` — simulação de rede pura (sem Three.js): dispositivos, cabos, topologia, ping
- `src/render/` — modelos 3D e visual dos cabos
- `src/core/` — cena e interação (raycasting, drag de cabos)
- `src/ui/` — HUD, paleta e terminal CLI
- `src/game/` — estado global e missões

## Próximas fases

Routers, VLANs, cabos de consola e fibra, servidor, mais missões, animação de pacotes.
