import React, { useEffect, useState } from 'react';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import { FileText, Clock, User, Shield } from 'lucide-react';
import Pagination from '../../../components/ui/Pagination';

const AuditLogsTab = () => {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    itemsPerPage: 10
  });

  useEffect(() => {
    fetchLogs(1, pagination.itemsPerPage);
  }, []);

  const fetchLogs = async (page = pagination.currentPage, limit = pagination.itemsPerPage) => {
    try {
      setIsLoading(true);
      const response = await api.get(`/admin/security/audit-logs?page=${page}&limit=${limit}`);
      const data = response.data.data;
      setLogs(data.logs || data);
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (error) {
      toast.error('Failed to load audit logs');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-extrabold text-text-primary mb-1">Security Audit Logs</h3>
          <p className="text-sm text-text-muted">View a history of all security and authentication events.</p>
        </div>
      </div>
      
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        {isLoading && logs.length === 0 ? (
          <div className="p-8 text-center text-text-muted">Loading audit logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center">
            <FileText className="w-12 h-12 text-text-muted mb-4 opacity-50" />
            <h4 className="text-text-primary font-bold">No logs found</h4>
            <p className="text-text-muted text-sm mt-1">No security events have been recorded yet.</p>
          </div>
        ) : (
          <div className={`divide-y divide-border ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
            {logs.map((log) => (
              <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-hover transition-colors">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-brand-50 text-brand-600 rounded-full mt-1">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-text-primary text-sm flex items-center gap-2">
                      {log.action}
                    </div>
                    <div className="text-sm text-text-muted mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                      {log.user && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {log.user.name} ({log.user.email})
                        </span>
                      )}
                      {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-text-muted shrink-0">
                  <Clock className="w-3 h-3" />
                  {new Date(log.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}

        {pagination.totalPages > 0 && (
          <div className="p-4 border-t border-border bg-surface-background">
            <Pagination 
              currentPage={pagination.currentPage} 
              totalPages={pagination.totalPages} 
              onPageChange={(page) => fetchLogs(page, pagination.itemsPerPage)} 
              itemsPerPage={pagination.itemsPerPage}
              onItemsPerPageChange={(limit) => {
                setPagination(prev => ({ ...prev, itemsPerPage: limit, currentPage: 1 }));
                fetchLogs(1, limit);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogsTab;
