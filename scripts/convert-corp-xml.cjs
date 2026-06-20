const fs = require('fs');
const path = require('path');

const XML_PATH = path.join(__dirname, '..', '..', '..', '..', 'Downloads', 'corp.xml');
const OUT_PATH = path.join(__dirname, '..', 'public', 'corp.json');

if (!fs.existsSync(XML_PATH)) {
  console.error(`corp.xml not found at: ${XML_PATH}`);
  console.error('Please place corp.xml in C:\\Users\\ojtma\\Downloads\\corp.xml');
  process.exit(1);
}

const xml = fs.readFileSync(XML_PATH, 'utf-8');

const items = [];
const listRegex = /<list>([\s\S]*?)<\/list>/g;
const fieldRegex = /<(\w+)>(.*?)<\/\1>/g;

let listMatch;
while ((listMatch = listRegex.exec(xml)) !== null) {
  const block = listMatch[1];
  const item = {};
  let fieldMatch;
  while ((fieldMatch = fieldRegex.exec(block)) !== null) {
    item[fieldMatch[1]] = fieldMatch[2].trim();
  }
  if (item.corp_code && item.corp_name) {
    items.push({
      corp_code: item.corp_code || '',
      corp_name: item.corp_name || '',
      corp_eng_name: item.corp_eng_name || '',
      stock_code: item.stock_code || '',
      modify_date: item.modify_date || '',
    });
  }
}

const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(OUT_PATH, JSON.stringify(items), 'utf-8');
console.log(`✓ Converted ${items.length} companies → public/corp.json`);
