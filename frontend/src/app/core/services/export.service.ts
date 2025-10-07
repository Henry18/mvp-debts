import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environments';

export type ExportFormat = 'csv' | 'json';
export type DebtsExportParams = {
  status?: 'PENDING' | 'PAID';
  debtorId?: string;
  creditorId?: string;
};

@Injectable({ providedIn: 'root' })
export class ExportService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  private endpoints: Record<ExportFormat, string> = {
    csv: environment.apiUrl + '/debts/export/csv',
    json: environment.apiUrl + '/debts/export/json',
  };

  downloadDebts(format: ExportFormat, params: DebtsExportParams = {}) {
    const isBrowser = isPlatformBrowser(this.platformId);
    if (!isBrowser) return;

    let httpParams = new HttpParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && String(v).trim() !== '') {
        httpParams = httpParams.set(k, String(v));
      }
    });

    return this.http
      .get(this.endpoints[format], {
        params: httpParams,
        observe: 'response',
        responseType: 'blob',
      })
      .subscribe({
        next: (res: HttpResponse<Blob>) => {
          const blob = res.body ?? new Blob([], { type: this.mime(format) });

          const cd = res.headers.get('Content-Disposition') || '';
          const fileName =
            this.extractFilename(cd) || this.fallbackName(format, params);

          this.saveBlob(blob, fileName);
        },
        error: (err) => {
          console.error('Export error', err);
        },
      });
  }

  private mime(fmt: ExportFormat) {
    return fmt === 'csv'
      ? 'text/csv;charset=utf-8'
      : 'application/json;charset=utf-8';
  }

  private extractFilename(contentDisposition: string): string | null {
    const match = /filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i.exec(
      contentDisposition || ''
    );
    return match?.[1] ?? null;
  }

  private fallbackName(format: ExportFormat, p: DebtsExportParams) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const suffix = p.status ? `-${p.status.toLowerCase()}` : '';
    return `deudas${suffix}-${stamp}.${format}`;
  }

  private saveBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    try {
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
    } finally {
      setTimeout(() => {
        URL.revokeObjectURL(url);
        a.remove();
      }, 0);
    }
  }
}
