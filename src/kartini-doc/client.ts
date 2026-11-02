import { KartiniSection, ParsedDocument } from './converter.ts';

const SUPABASE_URL = 'https://zubhkexpkefjahotobnx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_p86DIJgtGZD6TuV5c3iVow_-C2_E6zU';

export interface KartiniDocRecord {
  id: string;
  doc_number: string;
  title: string;
  summary: string | null;
  status: string;
  category: string;
  current_version_id: string;
  created_by: string;
  updated_by: string;
}

export class KartiniOsClient {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async fetchSupabase(path: string, options: RequestInit = {}): Promise<any> {
    const url = `${SUPABASE_URL}${path}`;
    const headers: Record<string, string> = {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${this.token}`,
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Supabase API error (${res.status} ${res.statusText}): ${errText}`);
    }

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return res.json();
    }
    return res.text();
  }

  // Find document by title or doc_number
  async findDocument(query: string): Promise<KartiniDocRecord | null> {
    const sanitized = query.replace(/[%,*]/g, '').trim();
    // Try exact doc_number first if it looks like PD-YYYY-XXXX
    if (/^PD-\d{4}-\d{4}$/i.test(sanitized)) {
      const docs: KartiniDocRecord[] = await this.fetchSupabase(
        `/rest/v1/product_documents?doc_number=eq.${sanitized}&select=*`
      );
      if (docs && docs.length > 0) return docs[0];
    }

    // Try title search
    const docs: KartiniDocRecord[] = await this.fetchSupabase(
      `/rest/v1/product_documents?title=ilike.*${encodeURIComponent(sanitized)}*&select=*`
    );
    return docs && docs.length > 0 ? docs[0] : null;
  }

  // Create new document using Kartini OS's pd_create RPC
  async createDocument(doc: ParsedDocument): Promise<{ document: KartiniDocRecord; versionId: string }> {
    // 1. Call pd_create RPC
    const initialSections = doc.sections.length > 0 ? doc.sections : [
      {
        id: crypto.randomUUID(),
        title: 'Background',
        body: '',
        sort_order: 0,
      }
    ];

    const documentId: string = await this.fetchSupabase('/rest/v1/rpc/pd_create', {
      method: 'POST',
      body: JSON.stringify({
        _title: doc.title.trim(),
        _summary: doc.summary.trim() || null,
        _sections: initialSections,
      }),
    });

    if (!documentId) {
      throw new Error('pd_create failed to return document ID');
    }

    // 2. Update category if not standard
    if (doc.category) {
      await this.fetchSupabase(`/rest/v1/product_documents?id=eq.${documentId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          category: doc.category,
        }),
      });
    }

    // 3. Retrieve created document record
    const createdDocs: KartiniDocRecord[] = await this.fetchSupabase(
      `/rest/v1/product_documents?id=eq.${documentId}&select=*`
    );
    const created = createdDocs[0];

    // 4. Ensure all full sections and Mermaid diagrams are saved to current_version_id
    if (created.current_version_id && doc.sections.length > 0) {
      await this.fetchSupabase(`/rest/v1/product_document_versions?id=eq.${created.current_version_id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          sections: doc.sections,
          updated_at: new Date().toISOString(),
        }),
      });
    }

    return {
      document: created,
      versionId: created.current_version_id,
    };
  }

  // Update existing document sections and metadata
  async updateDocument(
    documentId: string,
    versionId: string,
    doc: Partial<ParsedDocument>
  ): Promise<void> {
    if (doc.sections && doc.sections.length > 0) {
      await this.fetchSupabase(`/rest/v1/product_document_versions?id=eq.${versionId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          sections: doc.sections,
          updated_at: new Date().toISOString(),
        }),
      });
    }

    const docUpdates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (doc.title) docUpdates.title = doc.title;
    if (doc.summary !== undefined) docUpdates.summary = doc.summary;
    if (doc.category) docUpdates.category = doc.category;

    await this.fetchSupabase(`/rest/v1/product_documents?id=eq.${documentId}`, {
      method: 'PATCH',
      body: JSON.stringify(docUpdates),
    });
  }
}
