const fs = require('fs');
let data = fs.readFileSync('js/multiplayerUI.js', 'utf-8');
data = data.replace(/\\\$/g, '$');
data = data.replace(/\\`/g, '`');
fs.writeFileSync('js/multiplayerUI.js', data);