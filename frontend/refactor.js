import fs from 'fs';
import path from 'path';

const walk = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else {
      if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js') || fullPath.endsWith('.html')) {
        results.push(fullPath);
      }
    }
  });
  return results;
};

const files = walk('./src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Replace colors
  content = content.replace(/text-primary-600/g, 'text-brand-600');
  content = content.replace(/text-primary-700/g, 'text-brand-700');
  content = content.replace(/text-primary-500/g, 'text-brand-600'); // simplify to 600
  content = content.replace(/text-primary-50/g, 'text-brand-50');
  content = content.replace(/text-primary\b/g, 'text-brand-600');

  content = content.replace(/bg-primary-600/g, 'bg-brand-600');
  content = content.replace(/bg-primary-700/g, 'bg-brand-700');
  content = content.replace(/bg-primary-800/g, 'bg-brand-800');
  content = content.replace(/bg-primary-50/g, 'bg-brand-50');
  content = content.replace(/bg-primary-100/g, 'bg-brand-100');
  content = content.replace(/bg-primary-200/g, 'bg-brand-200');
  content = content.replace(/bg-primary\b/g, 'bg-brand-600');

  content = content.replace(/border-primary-600/g, 'border-brand-600');
  content = content.replace(/border-primary-200/g, 'border-brand-200');
  content = content.replace(/border-primary-500/g, 'border-brand-600');
  content = content.replace(/border-primary\b/g, 'border-brand-600');

  content = content.replace(/ring-primary-500/g, 'ring-brand-600');
  content = content.replace(/ring-primary-600/g, 'ring-brand-600');
  content = content.replace(/ring-primary-200/g, 'ring-brand-200');
  
  content = content.replace(/text-text-primary/g, 'text-text-primary'); 
  content = content.replace(/text-text-secondary/g, 'text-text-secondary');
  content = content.replace(/text-text-muted/g, 'text-text-muted');
  
  content = content.replace(/bg-surface/g, 'bg-surface');
  content = content.replace(/border-secondary-100/g, 'border-border-light');
  content = content.replace(/border-secondary-200/g, 'border-border');
  content = content.replace(/border-secondary-300/g, 'border-border');
  
  content = content.replace(/text-secondary-500/g, 'text-text-secondary');
  content = content.replace(/text-secondary-600/g, 'text-text-secondary');
  content = content.replace(/text-secondary-700/g, 'text-text-primary');

  content = content.replace(/bg-secondary-50/g, 'bg-surface-background');
  content = content.replace(/bg-secondary-100/g, 'bg-border-light');
  
  // Neutral standardizations
  content = content.replace(/text-neutral-900/g, 'text-text-primary');
  content = content.replace(/text-neutral-800/g, 'text-text-primary');
  content = content.replace(/text-neutral-700/g, 'text-text-secondary');
  content = content.replace(/text-neutral-600/g, 'text-text-secondary');
  content = content.replace(/text-neutral-500/g, 'text-text-muted');
  content = content.replace(/text-neutral-400/g, 'text-text-muted');
  
  content = content.replace(/border-neutral-200/g, 'border-border');
  content = content.replace(/border-neutral-100/g, 'border-border-light');
  content = content.replace(/bg-neutral-50/g, 'bg-surface-background');
  content = content.replace(/bg-neutral-100/g, 'bg-border-light');

  // Specific semantic color fixes
  content = content.replace(/text-danger-dark/g, 'text-danger-700');
  content = content.replace(/bg-danger-light/g, 'bg-danger-50');
  content = content.replace(/text-danger\b/g, 'text-danger-600');
  content = content.replace(/bg-danger\b/g, 'bg-danger-600');
  content = content.replace(/border-danger\b/g, 'border-danger-600');

  content = content.replace(/bg-success-light/g, 'bg-success-50');
  content = content.replace(/text-success-dark/g, 'text-success-700');
  content = content.replace(/text-success-600/g, 'text-success-600');
  content = content.replace(/bg-success-50/g, 'bg-success-50');

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
