const fs = require('fs');
const path = require('path');

// Remove debug console.logs from React components
function cleanConsoleLogsFromFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    
    // Remove console.log statements (but keep console.error)
    content = content.replace(/^\s*console\.log\([^)]*\);\s*$/gm, '');
    
    // Remove empty lines that were left behind
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    // Only write if content changed
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Cleaned: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error cleaning ${filePath}:`, error.message);
    return false;
  }
}

function walkDirectory(dir, callback) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and .git directories
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist' && file !== 'build') {
        walkDirectory(filePath, callback);
      }
    } else if ((file.endsWith('.js') || file.endsWith('.jsx')) && !file.includes('.min.') && !file.includes('bundle')) {
      callback(filePath);
    }
  });
}

function main() {
  console.log('🧹 Starting frontend console.log cleanup...\n');
  
  const srcDir = path.join(__dirname, '../frontend/src');
  let filesChanged = 0;
  let filesProcessed = 0;
  
  walkDirectory(srcDir, (filePath) => {
    filesProcessed++;
    if (cleanConsoleLogsFromFile(filePath)) {
      filesChanged++;
    }
  });
  
  console.log(`\n📊 Summary:`);
  console.log(`   Files processed: ${filesProcessed}`);
  console.log(`   Files changed: ${filesChanged}`);
  console.log('✅ Frontend console.log cleanup complete!');
}

if (require.main === module) {
  main();
}

module.exports = { cleanConsoleLogsFromFile, walkDirectory };
