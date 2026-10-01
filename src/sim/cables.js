export const CABLE_TYPES = {
  straight: { label: 'Direto', color: 0x4f9cf9, css: '#4f9cf9', enabled: true },
  crossover: { label: 'Cruzado', color: 0xf97316, css: '#f97316', enabled: true },
  console: { label: 'Consola', color: 0x38bdf8, css: '#38bdf8', enabled: false },
  fiber: { label: 'Fibra', color: 0xeab308, css: '#eab308', enabled: false },
};

// Classic MDI/MDI-X rule (auto-MDIX intentionally ignored for teaching):
// unlike device classes -> straight-through, like classes -> crossover.
export function correctCableType(aIface, bIface) {
  if (aIface.portType !== bIface.portType) return null;
  if (aIface.portType === 'console') return 'console';
  if (aIface.portType === 'fiber') return 'fiber';
  const aMdiX = aIface.device.type === 'switch';
  const bMdiX = bIface.device.type === 'switch';
  return aMdiX === bMdiX ? 'crossover' : 'straight';
}

export function isCableCompatible(aIface, bIface, cableTypeId) {
  return correctCableType(aIface, bIface) === cableTypeId;
}
