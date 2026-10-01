// Corrige o build do electron-builder em Windows sem Modo de Programador:
// o 7za falha a extrair o winCodeSign por causa de symlinks do macOS.
// Injetamos "-snl-" (extrai symlinks como ficheiros) via wrapper do 7za.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const szaDir = path.join(root, 'node_modules', '7zip-bin', 'win', 'x64');
const wrapper = path.join(szaDir, '7za-snl.cmd');
const utilJs = path.join(root, 'node_modules', 'builder-util', 'out', 'util.js');

fs.writeFileSync(wrapper, '@echo off\r\n"%~dp07za.exe" %* -snl-\r\n');

const content = fs.readFileSync(utilJs, 'utf8');
const oldLine = 'SZA_PATH: await (0, _7za_1.getPath7za)(),';
const newLine = 'SZA_PATH: path.join(path.dirname(await (0, _7za_1.getPath7za)()), "7za-snl.cmd"),';
if (content.includes(newLine)) {
  console.log('Patch já aplicado.');
} else if (content.includes(oldLine)) {
  fs.writeFileSync(utilJs, content.replace(oldLine, newLine));
  console.log('Patch aplicado em builder-util/out/util.js.');
} else {
  console.error('Linha-alvo não encontrada em util.js — verifica a versão do electron-builder.');
  process.exit(1);
}
