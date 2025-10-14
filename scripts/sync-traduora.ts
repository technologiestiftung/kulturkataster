#!/usr/bin/env tsx

import { promises as fs } from 'fs';
import path from 'path';

interface TraduoraConfig {
  apiUrl: string;
  clientId: string;
  clientSecret: string;
  projectId: string;
}

interface TraduoraTerm {
  id: string;
  value: string;
  context?: string;
  labels: string[];
  date: {
    created: string;
    modified: string;
  };
}

interface TraduoraTranslation {
  id: string;
  termId: string;
  value: string;
  localeCode: string;
}

interface TraduoraLabel {
  id: string;
  value: string;
  color: string;
}

interface SyncResult {
  addedKeys: string[];
  updatedKeys: string[];
  removedKeys: string[];
  conflictKeys: string[];
}

class TraduoraSync {
  private config: TraduoraConfig;
  private token: string | null = null;
  private readonly localesDir = path.join(process.cwd(), 'src/lib/i18n/translations');

  constructor(config: TraduoraConfig) {
    this.config = config;
  }

  async authenticate(): Promise<void> {
    const response = await fetch(`${this.config.apiUrl}/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      }),
    });

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    this.token = data.access_token;
  }

  private async apiRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    if (!this.token) {
      await this.authenticate();
    }

    const response = await fetch(`${this.config.apiUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async fetchLabels(): Promise<TraduoraLabel[]> {
    const data = await this.apiRequest(`/projects/${this.config.projectId}/labels`);
    return data.data || [];
  }

  async fetchTermsByLabel(labelId: string): Promise<TraduoraTerm[]> {
    const data = await this.apiRequest(`/projects/${this.config.projectId}/terms/filter-by-label?labelId=${labelId}`);
    return data.data || [];
  }

  async fetchAllTerms(): Promise<TraduoraTerm[]> {
    const data = await this.apiRequest(`/projects/${this.config.projectId}/terms`);
    return data.data || [];
  }

  async fetchTranslations(localeCode: string): Promise<TraduoraTranslation[]> {
    const data = await this.apiRequest(`/projects/${this.config.projectId}/translations/${localeCode}`);
    return data.data || [];
  }

  async getLocalTranslations(locale: string, namespace: string): Promise<Record<string, any> | null> {
    try {
      const filePath = path.join(this.localesDir, locale, `${namespace}.json`);
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }

  async saveLocalTranslations(locale: string, namespace: string, translations: Record<string, any>): Promise<void> {
    const localeDir = path.join(this.localesDir, locale);
    await fs.mkdir(localeDir, { recursive: true });
    
    const filePath = path.join(localeDir, `${namespace}.json`);
    await fs.writeFile(filePath, JSON.stringify(translations, null, '\t') + '\n');
  }

  flattenObject(obj: any, prefix: string = ''): Record<string, string> {
    const flattened: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        Object.assign(flattened, this.flattenObject(value, newKey));
      } else {
        flattened[newKey] = String(value);
      }
    }
    
    return flattened;
  }

  unflattenObject(flattened: Record<string, string>): Record<string, any> {
    const nested: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(flattened)) {
      const keys = key.split('.');
      let current = nested;
      
      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        if (!(k in current)) {
          current[k] = {};
        }
        current = current[k];
      }
      
      current[keys[keys.length - 1]] = value;
    }
    
    return nested;
  }

  async createTerm(termValue: string, labelIds: string[]): Promise<TraduoraTerm> {
    const data = await this.apiRequest(`/projects/${this.config.projectId}/terms`, {
      method: 'POST',
      body: JSON.stringify({
        value: termValue,
        context: '',
      }),
    });

    // Add labels to the term
    const termId = data.data.id;
    for (const labelId of labelIds) {
      await this.apiRequest(`/projects/${this.config.projectId}/terms/${termId}/labels`, {
        method: 'POST',
        body: JSON.stringify({
          labelId,
        }),
      });
    }

    return data.data;
  }

  async updateTermTranslation(termId: string, localeCode: string, translation: string): Promise<void> {
    await this.apiRequest(`/projects/${this.config.projectId}/translations/${localeCode}/${termId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        value: translation,
      }),
    });
  }

  async syncNamespace(namespace: string, dryRun: boolean = false): Promise<SyncResult> {
    console.log(`\n🔄 Syncing namespace: ${namespace}`);
    
    const labels = await this.fetchLabels();
    const namespaceLabel = labels.find(l => l.value.toLowerCase() === namespace.toLowerCase());
    
    if (!namespaceLabel) {
      throw new Error(`Label not found for namespace: ${namespace}`);
    }

    const terms = await this.fetchTermsByLabel(namespaceLabel.id);
    const result: SyncResult = {
      addedKeys: [],
      updatedKeys: [],
      removedKeys: [],
      conflictKeys: [],
    };

    // Get available locales from local filesystem
    const locales = await fs.readdir(this.localesDir);
    
    for (const locale of locales) {
      const localStats = await fs.stat(path.join(this.localesDir, locale));
      if (!localStats.isDirectory()) continue;
      
      console.log(`\n📍 Processing locale: ${locale}`);
      
      // Fetch remote translations for this locale
      const remoteTranslations = await this.fetchTranslations(locale);
      const remoteMap = new Map(remoteTranslations.map(t => [t.termId, t.value]));
      
      // Get local translations
      const localTranslations = await this.getLocalTranslations(locale, namespace) || {};
      const flatLocal = this.flattenObject(localTranslations);
      
      // Create maps for comparison
      const termValueToId = new Map(terms.map(t => [t.value, t.id]));
      const remoteFlat: Record<string, string> = {};
      
      for (const term of terms) {
        const translation = remoteMap.get(term.id);
        if (translation) {
          remoteFlat[term.value] = translation;
        }
      }
      
      // Find differences
      const localKeys = new Set(Object.keys(flatLocal));
      const remoteKeys = new Set(Object.keys(remoteFlat));
      
      // Keys only in local (need to add to Traduora)
      for (const key of localKeys) {
        if (!remoteKeys.has(key)) {
          result.addedKeys.push(key);
          if (!dryRun) {
            console.log(`➕ Adding term: ${key}`);
            const term = await this.createTerm(key, [namespaceLabel.id]);
            await this.updateTermTranslation(term.id, locale, flatLocal[key]);
          }
        }
      }
      
      // Keys only in remote (need to add to local)
      for (const key of remoteKeys) {
        if (!localKeys.has(key)) {
          result.addedKeys.push(key);
          if (!dryRun) {
            console.log(`⬇️ Adding to local: ${key}`);
            flatLocal[key] = remoteFlat[key];
          }
        }
      }
      
      // Keys in both (check for conflicts)
      for (const key of localKeys) {
        if (remoteKeys.has(key) && flatLocal[key] !== remoteFlat[key]) {
          result.conflictKeys.push(key);
          console.log(`⚠️  Conflict for ${key}:`);
          console.log(`   Local:  ${flatLocal[key]}`);
          console.log(`   Remote: ${remoteFlat[key]}`);
          
          if (!dryRun) {
            // Prefer local changes and update Traduora
            const termId = termValueToId.get(key);
            if (termId) {
              console.log(`🔄 Updating remote with local value`);
              await this.updateTermTranslation(termId, locale, flatLocal[key]);
            }
          }
        }
      }
      
      // Save updated local translations
      if (!dryRun && (result.addedKeys.length > 0 || result.conflictKeys.length > 0)) {
        const unflattenedLocal = this.unflattenObject(flatLocal);
        await this.saveLocalTranslations(locale, namespace, unflattenedLocal);
        console.log(`💾 Updated local file: ${locale}/${namespace}.json`);
      }
    }
    
    return result;
  }

  async syncAll(dryRun: boolean = false): Promise<void> {
    console.log(`🚀 Starting Traduora sync ${dryRun ? '(DRY RUN)' : ''}`);
    
    const labels = await this.fetchLabels();
    console.log(`📋 Found ${labels.length} labels/namespaces`);
    
    for (const label of labels) {
      try {
        const result = await this.syncNamespace(label.value, dryRun);
        
        console.log(`\n📊 Summary for ${label.value}:`);
        console.log(`   Added: ${result.addedKeys.length}`);
        console.log(`   Updated: ${result.updatedKeys.length}`);
        console.log(`   Conflicts: ${result.conflictKeys.length}`);
        console.log(`   Removed: ${result.removedKeys.length}`);
        
      } catch (error) {
        console.error(`❌ Error syncing ${label.value}:`, error);
      }
    }
    
    console.log(`\n✅ Sync completed ${dryRun ? '(DRY RUN)' : ''}`);
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const namespace = args.find(arg => arg.startsWith('--namespace='))?.split('=')[1];

  const config: TraduoraConfig = {
    apiUrl: process.env.TRADUORA_API_URL!,
    clientId: process.env.TRADUORA_CLIENT_ID!,
    clientSecret: process.env.TRADUORA_CLIENT_SECRET!,
    projectId: process.env.TRADUORA_PROJECT_ID!,
  };

  // Validate config
  for (const [key, value] of Object.entries(config)) {
    if (!value) {
      console.error(`❌ Missing environment variable for ${key}`);
      process.exit(1);
    }
  }

  const sync = new TraduoraSync(config);

  try {
    await sync.authenticate();
    console.log('✅ Authenticated with Traduora');

    if (namespace) {
      await sync.syncNamespace(namespace, dryRun);
    } else {
      await sync.syncAll(dryRun);
    }
  } catch (error) {
    console.error('❌ Sync failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { TraduoraSync };