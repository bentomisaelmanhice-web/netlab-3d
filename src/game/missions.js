import { ipInSubnet } from '../sim/device.js';

export const MISSIONS = [
  {
    id: 'm1',
    title: 'Missão 1 — A primeira rede',
    brief:
      'Liga o PC1 e o PC2 ao switch SW1 com os cabos corretos, configura IPs na rede 192.168.1.0/24 e faz ping do PC1 para o PC2.',
    points: 100,
    setup: [
      { type: 'pc', name: 'PC1', pos: [-1.6, 0, -0.2] },
      { type: 'pc', name: 'PC2', pos: [1.6, 0, -0.2] },
      { type: 'switch', name: 'SW1', pos: [0, 0, 0.35] },
    ],
    objectives: [
      { id: 'link1', label: 'PC1 ↔ SW1 com link up', check: (s) => linkUpBetween(s, 'PC1', 'SW1') },
      { id: 'link2', label: 'PC2 ↔ SW1 com link up', check: (s) => linkUpBetween(s, 'PC2', 'SW1') },
      { id: 'ip1', label: 'PC1 com IP em 192.168.1.0/24', check: (s) => hostIpIn(s, 'PC1', '192.168.1.0', '255.255.255.0') },
      { id: 'ip2', label: 'PC2 com IP em 192.168.1.0/24', check: (s) => hostIpIn(s, 'PC2', '192.168.1.0', '255.255.255.0') },
      {
        id: 'ping',
        label: 'Ping PC1 → PC2 com sucesso',
        check: (s) =>
          !!s.lastPing && s.lastPing.success && s.lastPing.src === 'PC1' && s.lastPing.dst === 'PC2',
      },
    ],
    hints: [
      'PC ↔ Switch usa cabo DIRETO (azul). Cabo cruzado (laranja) só entre equipamentos do mesmo tipo.',
      'Configura IPs da mesma sub-rede nos dois PCs, ex.: PC1 = 192.168.1.10, PC2 = 192.168.1.20, máscara 255.255.255.0.',
      'Clica no PC1 para abrir o terminal e escreve: ping 192.168.1.20',
    ],
  },
];

function linkUpBetween(s, nameA, nameB) {
  for (const c of s.net.cables) {
    if (!c.a.linkUp) continue;
    const na = c.a.device.name;
    const nb = c.b.device.name;
    if ((na === nameA && nb === nameB) || (na === nameB && nb === nameA)) return true;
  }
  return false;
}

function hostIpIn(s, deviceName, netIp, mask) {
  const d = s.net.deviceByName(deviceName);
  if (!d) return false;
  const iface = d.interfaces.find((i) => i.ip);
  return !!iface && iface.adminUp && ipInSubnet(iface.ip, netIp, mask);
}

export function evaluate(s, mission) {
  return mission.objectives.map((o) => ({ ...o, ok: o.check(s) }));
}

export function allDone(s, mission) {
  return evaluate(s, mission).every((o) => o.ok);
}
