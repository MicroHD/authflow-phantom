const fs = require('fs');
const path = require('path');

// Create the dist directory if it doesn't exist
const distDir = path.join(__dirname, '../dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Create the main index.js that re-exports from the appropriate module
const indexContent = `// This file is auto-generated
if (typeof module !== 'undefined' && module.exports) {
  module.exports = require('./cjs/index.js');
} else {
  module.exports = require('./esm/index.js');
}
`;

fs.writeFileSync(path.join(distDir, 'index.js'), indexContent);

// Create the CommonJS version
const cjsContent = `// This file is auto-generated
const { AuthFlowModule, AuthFlowService } = require('./cjs/index.js');
module.exports = { AuthFlowModule, AuthFlowService };
`;

fs.writeFileSync(path.join(distDir, 'index.cjs'), cjsContent);

console.log('Export files created successfully!'); 