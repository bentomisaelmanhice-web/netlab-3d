export class Interface {
  constructor(device, name, portType = 'ethernet') {
    this.device = device;
    this.name = name;
    this.portType = portType; // 'ethernet' | 'console' | 'fiber'
    this.adminUp = true;
    this.ip = null;
    this.mask = null;
    this.gateway = null;
    this.cable = null;
    this.linkUp = false;
  }
}

export class Device {
  constructor(id, name, type) {
    this.id = id;
    this.name = name;
    this.type = type; // 'pc' | 'switch' | 'router' | 'server'
    this.interfaces = [];
  }
}

export function createDevice(id, name, type) {
  const d = new Device(id, name, type);
  if (type === 'pc' || type === 'server') {
    d.interfaces.push(new Interface(d, 'eth0', 'ethernet'));
    d.interfaces.push(new Interface(d, 'console0', 'console'));
  } else if (type === 'router') {
    d.interfaces.push(new Interface(d, 'G0/0', 'ethernet'));
    d.interfaces.push(new Interface(d, 'G0/1', 'ethernet'));
    d.interfaces.push(new Interface(d, 'console0', 'console'));
  } else if (type === 'switch') {
    for (let i = 1; i <= 8; i++) {
      d.interfaces.push(new Interface(d, `Fa0/${i}`, 'ethernet'));
    }
  }
  return d;
}

export function ipToInt(ip) {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(p => Number.isNaN(p) || p < 0 || p > 255)) return null;
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

export function isValidIp(ip) {
  return typeof ip === 'string' && /^(\d{1,3}\.){3}\d{1,3}$/.test(ip) && ipToInt(ip) !== null;
}

export function isValidMask(mask) {
  if (!isValidIp(mask)) return false;
  const m = ipToInt(mask);
  if (m === 0) return false;
  const inv = ~m >>> 0;
  return (inv & (inv + 1)) === 0;
}

export function sameSubnet(ip1, mask1, ip2, mask2) {
  const a = ipToInt(ip1), m1 = ipToInt(mask1), b = ipToInt(ip2), m2 = ipToInt(mask2);
  if (a === null || m1 === null || b === null || m2 === null) return false;
  return ((a & m1) >>> 0) === ((b & m2) >>> 0);
}

export function ipInSubnet(ip, netIp, mask) {
  const a = ipToInt(ip), n = ipToInt(netIp), m = ipToInt(mask);
  if (a === null || n === null || m === null) return false;
  return ((a & m) >>> 0) === ((n & m) >>> 0);
}
