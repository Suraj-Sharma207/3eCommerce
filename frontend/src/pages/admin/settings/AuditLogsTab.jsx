import React from 'react';
import { FileText } from 'lucide-react';

const AuditLogsTab = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-extrabold text-text-primary mb-1">Audit Logs</h3>
          <p className="text-sm text-text-muted">View a history of all system configuration changes.</p>
        </div>
      </div>
      
      <div className="bg-surface-background border border-border rounded-xl p-8 text-center flex flex-col items-center">
        <FileText className="w-12 h-12 text-text-muted mb-4 opacity-50" />
        <h4 className="text-text-primary font-bold">Audit Logs Coming Soon</h4>
        <p className="text-text-muted text-sm mt-1 max-w-sm">
          A dedicated UI for browsing the backend AuditLog table will be implemented here. For now, changes are securely logged in the database.
        </p>
      </div>
    </div>
  );
};

export default AuditLogsTab;
