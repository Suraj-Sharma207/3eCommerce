import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Handlebars from 'handlebars';
import { brandingService } from '../../services/brandingService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');
const PARTIALS_DIR = path.join(TEMPLATES_DIR, 'partials');

// In-memory cache for compiled templates
const templateCache = new Map();
let isInitialized = false;

// HTML Escaping utility to prevent injection in user inputs
export const escapeHtml = (str) => {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// Recursively sanitize all string variables in data
export const sanitizeData = (data) => {
  if (data === null || data === undefined) return data;
  if (typeof data === 'string') return escapeHtml(data);
  if (Array.isArray(data)) return data.map(sanitizeData);
  if (typeof data === 'object') {
    const sanitized = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        // Do not escape URL keys to avoid breaking link formatting, as Handlebars handles href escaping safely
        if (key.toLowerCase().endsWith('url') || key.toLowerCase().endsWith('link') || key === 'thumbnail') {
          sanitized[key] = data[key];
        } else {
          sanitized[key] = sanitizeData(data[key]);
        }
      }
    }
    return sanitized;
  }
  return data;
};

// Convert HTML to clean plain text fallback
export const htmlToText = (html) => {
  if (!html) return '';
  return html
    .replace(/<style([\s\S]*?)<\/style>/gi, '')
    .replace(/<script([\s\S]*?)<\/script>/gi, '')
    .replace(/<\/h1>/gi, '\n\n')
    .replace(/<\/h2>/gi, '\n\n')
    .replace(/<\/h3>/gi, '\n\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<tr[^>]*>/gi, '')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<td[^>]*>/gi, ' ')
    .replace(/<\/td>/gi, ' |')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/gi, '$2 ($1)')
    .replace(/<[^>]+>/g, '') // Strip remaining HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/\n\s+\n/g, '\n\n') // Remove multiple blank lines
    .trim();
};

// Compile and register all templates and partials
export const initializeTemplates = () => {
  if (isInitialized) return;

  try {
    // 1. Register Partials
    if (fs.existsSync(PARTIALS_DIR)) {
      const partialFiles = fs.readdirSync(PARTIALS_DIR);
      partialFiles.forEach(file => {
        if (file.endsWith('.hbs')) {
          const name = path.basename(file, '.hbs');
          const content = fs.readFileSync(path.join(PARTIALS_DIR, file), 'utf8');
          Handlebars.registerPartial(name, content);
        }
      });
    }

    // 2. Load layout
    const layoutPath = path.join(TEMPLATES_DIR, 'layout.hbs');
    const layoutContent = fs.existsSync(layoutPath)
      ? fs.readFileSync(layoutPath, 'utf8')
      : '{{{body}}}'; // Fallback
    const compiledLayout = Handlebars.compile(layoutContent);
    templateCache.set('layout', compiledLayout);

    // 3. Compile and Cache all core templates
    const files = fs.readdirSync(TEMPLATES_DIR);
    files.forEach(file => {
      if (file.endsWith('.hbs') && file !== 'layout.hbs') {
        const name = path.basename(file, '.hbs');
        const content = fs.readFileSync(path.join(TEMPLATES_DIR, file), 'utf8');
        templateCache.set(name, Handlebars.compile(content));
      }
    });

    isInitialized = true;
    console.log(`📧 Email template compiler initialized. Cached ${templateCache.size} templates.`);
  } catch (error) {
    console.error('❌ Failed to initialize email templates:', error);
  }
};

// Render template and return { html, text }
export const renderTemplate = async (templateName, data = {}) => {
  // Ensure initialized
  if (!isInitialized) {
    initializeTemplates();
  }

  const template = templateCache.get(templateName);
  const layout = templateCache.get('layout');

  if (!template) {
    throw new Error(`Email template "${templateName}" not found in cache.`);
  }

  // Fetch dynamic branding
  const branding = await brandingService.getBranding();

  // Inject defaults (branding variables)
  const defaults = {
    websiteUrl: branding.websiteUrl || process.env.FRONTEND_URL || 'http://localhost:5173',
    supportEmail: branding.supportEmail || 'support@luxehome.com',
    supportPhone: branding.supportPhone || '+1 (800) 555-LUXE',
    facebookUrl: 'https://facebook.com/luxehome',
    instagramUrl: 'https://instagram.com/luxehome',
    twitterUrl: 'https://twitter.com/luxehome',
    currentYear: new Date().getFullYear().toString(),
    logoUrl: branding.logoUrl || null,
    platformName: branding.platformName || 'LuxeHome'
  };

  // Merge and sanitize data to prevent HTML injection
  const mergedData = { ...defaults, ...data };
  const sanitizedData = sanitizeData(mergedData);

  // Render body first
  const bodyHtml = template(sanitizedData);

  // Render inside layout
  const fullHtml = layout({
    ...sanitizedData,
    body: bodyHtml
  });

  // Generate plain-text alternative
  const plainText = htmlToText(bodyHtml);

  return {
    html: fullHtml,
    text: plainText
  };
};

// Cache cleared on template updates
