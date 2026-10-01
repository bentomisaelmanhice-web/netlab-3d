import { state, emit } from '../game/state.js';
import { isValidIp, isValidMask } from '../sim/device.js';
import { runPing, PING_FAIL_MESSAGES } from '../sim/ping.js';

let els = {};
let history = [];
let histIndex = -1;

export function initCli() {
  els = {
    panel: document.getElementById('terminal'),
    title: document.getElementById('terminal-title'),
    output: document.getElementById('terminal-output'),
    prompt: document.getElementById('terminal-prompt'),
    input: document.getElementById('terminal-input'),
    close: document.getElementById('terminal-close'),
  };

  els.close.addEventListener('click', closeTerminal);

  els.input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const line = els.input.value.trim();
      els.input.value = '';
      if (line) {
        history.push(line);
        histIndex = history.length;
        execute(line);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      histIndex = Math.max(0, histIndex - 1);
      els.input.value = history[histIndex] || '';
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      histIndex = Math.min(history.length, histIndex + 1);
      els.input.value = history[histIndex] || '';
    } else if (e.key === 'Escape') {
      e.stopPropagation();
      closeTerminal();
    }
  });
}

function print(text, cls) {
  const line = document.createElement('div');
  if (cls) line.className = cls;
  line.textContent = text;
  els.output.appendChild(line);
  els.output.scrollTop = els.output.scrollHeight;
}

export function openTerminal(device) {
  state.terminalDevice = device;
  els.panel.classList.remove('hidden');
  els.title.textContent = `Terminal — ${device.name}`;
  els.prompt.textContent = `${device.name}>`;
  els.output.innerHTML = '';
  print(`NetLab OS v1.0 — ${device.name} (${device.type})`);
  print("Escreve 'help' para veres os comandos.", 'dim');
  setTimeout(() => els.input.focus());
}

export function closeTerminal() {
  state.terminalDevice = null;
  els.panel.classList.add('hidden');
}

function ethIface(device) {
  return device.interfaces.find((i) => i.portType === 'ethernet');
}

function execute(rawLine) {
  const device = state.terminalDevice;
  print(`${device.name}> ${rawLine}`, 'dim');
  const [cmd, ...args] = rawLine.split(/\s+/).filter(Boolean);
  if (!cmd) return;

  switch (cmd) {
    case 'help':
      print('Comandos disponíveis:');
      print('  ip address <ip> <máscara> [gateway] — configura o IP da interface');
      print('  no shutdown | shutdown — ativa / desativa a interface');
      print('  show interfaces — estado das interfaces');
      print('  show ip — configuração IP atual');
      print('  ping <ip> — testa conectividade');
      print('  clear — limpa o ecrã');
      print('  exit — fecha o terminal');
      return;

    case 'clear':
      els.output.innerHTML = '';
      return;

    case 'exit':
      closeTerminal();
      return;

    case 'ip':
      cmdIp(device, args);
      return;

    case 'shutdown':
      cmdShutdown(device, false);
      return;

    case 'no':
      if (args[0] === 'shutdown') cmdShutdown(device, true);
      else print(`Comando desconhecido: no ${args.join(' ')}.`, 'err');
      return;

    case 'show':
      cmdShow(device, args);
      return;

    case 'ping':
      cmdPing(device, args);
      return;

    default:
      print(`Comando desconhecido: ${cmd}. Escreve 'help'.`, 'err');
  }
}

function cmdIp(device, args) {
  if (device.type === 'switch') {
    print('Erro: o switch não configura IP nas portas físicas (fase 2: VLANs).', 'err');
    return;
  }
  if (args[0] !== 'address' || args.length < 3) {
    print('Uso: ip address <ip> <máscara> [gateway]', 'err');
    return;
  }
  const [ip, mask] = [args[1], args[2]];
  if (!isValidIp(ip)) {
    print(`Erro: endereço IP inválido "${ip}".`, 'err');
    return;
  }
  if (!isValidMask(mask)) {
    print(`Erro: máscara inválida "${mask}" (tem de ser contígua, ex.: 255.255.255.0).`, 'err');
    return;
  }
  const iface = ethIface(device);
  iface.ip = ip;
  iface.mask = mask;
  iface.gateway = args[3] || null;
  emit('network-changed');
  print(`Interface ${iface.name}: IP ${ip} / máscara ${mask} configurado.`, 'ok');
}

function cmdShutdown(device, enable) {
  if (device.type === 'switch') {
    print('Erro: o switch não suporta shutdown por interface (fase 2).', 'err');
    return;
  }
  const iface = ethIface(device);
  iface.adminUp = enable;
  state.net.refreshLinks();
  emit('network-changed');
  print(
    `Interface ${iface.name} ${enable ? 'ativada (no shutdown)' : 'desativada (shutdown)'}.`,
    enable ? 'ok' : 'err'
  );
}

function cmdShow(device, args) {
  if (args[0] === 'interfaces') {
    for (const i of device.interfaces) {
      const status = !i.adminUp
        ? 'administratively down'
        : i.linkUp
          ? 'up / link up'
          : 'up / link down';
      const ip = i.ip ? ` ${i.ip} ${i.mask}` : '';
      print(`  ${i.name} (${i.portType}): ${status}${ip}${i.cable ? ' [cabo ligado]' : ''}`);
    }
    return;
  }
  if (args[0] === 'ip') {
    const i = ethIface(device);
    if (!i || !i.ip) {
      print('Sem endereço IP configurado.');
      return;
    }
    print(`  Interface ${i.name}: ${i.ip} ${i.mask}${i.gateway ? ` gateway ${i.gateway}` : ''}`);
    return;
  }
  print('Uso: show interfaces | show ip', 'err');
}

function cmdPing(device, args) {
  if (!args[0]) {
    print('Uso: ping <ip>', 'err');
    return;
  }
  print(`A enviar ping para ${args[0]} ...`, 'dim');
  const res = runPing(state.net, device, args[0]);
  state.lastPing = { success: res.success, src: device.name, dst: res.dst || null, target: args[0] };
  emit('ping');
  if (res.success) {
    print(`Reply from ${res.dst} (${args[0]}): tempo <1 ms`, 'ok');
  } else {
    print(PING_FAIL_MESSAGES[res.reason] || 'Ping falhou.', 'err');
  }
}
