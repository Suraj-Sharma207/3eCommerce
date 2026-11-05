import React, { useEffect, useRef, useState, useCallback } from "react";
import api from "../../../services/api";
import toast from "react-hot-toast";
import { FileText, Clock, User, Shield } from "lucide-react";
import SkeletonLoader from "../../../components/ui/SkeletonLoader";
import Pagination from "../../../components/ui/Pagination";

const AuditLogsTab = () => {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    filteredItems: 0,
    itemsPerPage: 10,
    pageSize: 10,
  });

  // AbortController to cancel in-flight requests when component unmounts or page changes
  const abortRef = useRef(null);

  const fetchLogs = useCallback(
    async (page = 1, limit = pagination.itemsPerPage) => {
      // Cancel any previous in-flight request
      if (abortRef.current) {
        abortRef.current.abort();
      }
      const controller = new AbortController();
      abortRef.current = controller;

      // Safe integer clamping
      let safePage = parseInt(page, 10);
      let safeLimit = parseInt(limit, 10);
      if (!Number.isFinite(safePage) || safePage < 1) safePage = 1;
      if (!Number.isFinite(safeLimit) || safeLimit < 1) safeLimit = 10;

      setIsLoading(true);
      try {
        const response = await api.get(
          `/admin/security/audit-logs?page=${safePage}&limit=${safeLimit}`,
          { signal: controller.signal },
        );
        const data = response.data.data;
        // Always replace — never append
        setLogs(data.logs || []);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      } catch (error) {
        if (error?.code === "ERR_CANCELED") return;
        toast.error("Failed to load audit logs");
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchLogs(1, 10);
    return () => {
      // Cleanup: cancel request when component unmounts
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, [fetchLogs]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg text-text-primary mb-1 font-bold">
            Security Audit Logs
          </h3>
          <p className="text-sm text-text-muted font-medium">
            View a history of all security and authentication events.
          </p>
        </div>
      </div>

      {/* Card with sticky pagination footer */}
      <div
        className="bg-surface border border-border rounded-xl overflow-hidden flex flex-col"
        style={{ maxHeight: "70vh" }}
      >
        {/* Scrollable log list */}
        <div className="overflow-auto flex-1 min-h-0">
          {isLoading && logs.length === 0 ? (
            <div className="space-y-4">
              <SkeletonLoader className="h-12 w-full" />
              <SkeletonLoader className="h-12 w-full" />
              <SkeletonLoader className="h-12 w-full" />
            </div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center">
              <FileText className="w-12 h-12 text-text-muted mb-4 opacity-50 font-medium" />
              <h4 className="text-text-primary">No logs found</h4>
              <p className="text-text-muted text-sm mt-1 font-medium">
                No security events have been recorded yet.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-hover transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-brand-50 text-brand-600 rounded-full mt-1">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-text-primary text-sm flex items-center gap-2">
                        {log.action}
                      </div>
                      <div className="text-sm text-text-muted mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 font-medium">
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
                  <div className="flex items-center gap-2 text-xs text-text-muted shrink-0 font-medium">
                    <Clock className="w-3 h-3" />
                    {new Date(log.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sticky pagination footer */}
        {pagination.totalPages > 0 && (
          <div className="shrink-0 border-t border-border bg-white shadow-[0_-1px_4px_rgba(0,0,0,0.06)] px-4 py-3">
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              filteredItems={pagination.filteredItems}
              label="Log Entries"
              onPageChange={(page) => fetchLogs(page, pagination.itemsPerPage)}
              itemsPerPage={pagination.itemsPerPage}
              onItemsPerPageChange={(limit) => {
                setPagination((prev) => ({
                  ...prev,
                  itemsPerPage: limit,
                  pageSize: limit,
                  currentPage: 1,
                }));
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
