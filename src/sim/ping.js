import { isValidIp, sameSubnet } from './device.js';

export function runPing(net, source, targetIp) {
  if (!isValidIp(targetIp)) return { success: false, reason: 'invalid-ip', targetIp };

  const srcIface = source.interfaces.find(i => i.portType === 'ethernet' && i.ip);
  if (!srcIface) return { success: false, reason: 'no-ip', targetIp };
  if (!srcIface.adminUp) return { success: false, reason: 'iface-down', targetIp };
  if (!srcIface.linkUp) return { success: false, reason: 'no-link', targetIp };

  const dstIface = net.findInterfaceByIp(targetIp);
  if (!dstIface) return { success: false, reason: 'no-host', targetIp };
  if (dstIface.device === source) {
    return { success: true, reason: 'ok', src: source.name, dst: source.name, targetIp, path: [srcIface] };
  }

  if (!sameSubnet(srcIface.ip, srcIface.mask, dstIface.ip, dstIface.mask)) {
    return { success: false, reason: 'different-subnet', targetIp, dst: dstIface.device.name };
  }
  if (!dstIface.adminUp) {
    return { success: false, reason: 'dst-down', targetIp, dst: dstIface.device.name };
  }
  const path = net.pathBetween(srcIface, dstIface);
  if (!path) return { success: false, reason: 'no-path', targetIp, dst: dstIface.device.name };

  return { success: true, reason: 'ok', src: source.name, dst: dstIface.device.name, targetIp, path };
}

export const PING_FAIL_MESSAGES = {
  'invalid-ip': 'Erro: endereço IP de destino inválido.',
  'no-ip': 'Erro: este equipamento não tem IP configurado. Usa "ip address <ip> <máscara>".',
  'iface-down': 'Erro: interface em shutdown. Usa "no shutdown".',
  'no-link': 'Request timed out — não há link. Verifica o tipo de cabo e as portas.',
  'no-host': 'Request timed out — nenhum equipamento com esse IP na rede.',
  'different-subnet': 'Destination host unreachable — sub-redes diferentes (seria preciso um router).',
  'dst-down': 'Request timed out — o equipamento de destino tem a interface em shutdown.',
  'no-path': 'Request timed out — não existe caminho de rede entre os equipamentos.',
};
