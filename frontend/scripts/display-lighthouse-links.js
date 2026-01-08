#!/usr/bin/env node

/**
 * Display Lighthouse Report Links
 * 
 * Reads the links.json file from .lighthouseci directory and displays
 * clickable report links in the terminal.
 * 
 * Usage:
 *   node scripts/display-lighthouse-links.js
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function displayLighthouseLinks() {
  const linksFile = join(process.cwd(), '.lighthouseci', 'links.json');
  
  if (!existsSync(linksFile)) {
    console.log('\n⚠️  No Lighthouse report links found.');
    console.log('   Run "npm run lighthouse:ci" first to generate reports.\n');
    return;
  }

  try {
    const linksData = JSON.parse(readFileSync(linksFile, 'utf-8'));
    const links = Object.entries(linksData);

    if (links.length === 0) {
      console.log('\n⚠️  No report links available.\n');
      return;
    }

    console.log('\n' + '='.repeat(80));
    console.log('📊 Lighthouse CI Report Links');
    console.log('='.repeat(80) + '\n');

    links.forEach(([url, reportUrl], index) => {
      const pageName = url.split('/').pop() || 'unknown';
      // Create clickable hyperlink using ANSI escape codes (OSC 8)
      // This works in iTerm2, VS Code terminal, and other modern terminals
      const clickableLink = `\x1b]8;;${reportUrl}\x1b\\${reportUrl}\x1b]8;;\x1b\\`;
      console.log(`\n${index + 1}. ${pageName.toUpperCase()} Page`);
      console.log(`   URL: ${url}`);
      console.log(`   📄 Report: ${clickableLink}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('💡 Tip: Click the links above to view detailed reports in your browser');
    console.log('='.repeat(80) + '\n');
  } catch (error) {
    console.error('❌ Error reading Lighthouse links:', error.message);
    process.exit(1);
  }
}

try {
  displayLighthouseLinks();
} catch (error) {
  console.error('Error displaying Lighthouse links:', error);
  process.exit(1);
}

