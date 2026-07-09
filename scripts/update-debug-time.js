const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '../src/vs/workbench/contrib/void/browser/react/src/sidebar-tsx/useMenuItems.tsx')

const time = new Date().toTimeString().slice(0, 8).replace(/:/g, '')
const content = fs.readFileSync(filePath, 'utf8')
const pattern = /label: '调试(-\d{6})?',/
const newContent = content.replace(pattern, `label: '调试-${time}',`)

fs.writeFileSync(filePath, newContent, 'utf8')
console.log(`Updated debug label to: 调试-${time}`)
