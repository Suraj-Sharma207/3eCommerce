import React, { useEffect, useState } from'react';
import api from'../../../services/api';
import Button from'../../../components/ui/Button';
import toast from'react-hot-toast';
import { Monitor, Smartphone, Globe, ShieldAlert, Trash2 } from'lucide-react';
import SkeletonLoader from'../../../components/ui/SkeletonLoader';
import useConfirmStore from'../../../store/confirmStore';

const ActiveSessionsTab = () => {
 const [sessions, setSessions] = useState([]);
 const [isLoading, setIsLoading] = useState(true);
 const { confirm } = useConfirmStore();

 useEffect(() => {
 fetchSessions();
 }, []);

 const fetchSessions = async () => {
 try {
 setIsLoading(true);
 const response = await api.get('/admin/security/sessions');
 setSessions(response.data.data);
 } catch (error) {
 toast.error('Failed to load active sessions');
 } finally {
 setIsLoading(false);
 }
 };

 const handleTerminateSession = async (id) => {
 const isConfirmed = await confirm({
 title:'Terminate Session',
 description:'Are you sure you want to terminate this session?',
 variant:'warning',
 confirmText:'Terminate'
 });
 if (isConfirmed) {
 try {
 await api.delete(`/admin/security/sessions/${id}`);
 toast.success('Session terminated.');
 setSessions(sessions.filter(s => s.id !== id));
 } catch (error) {
 toast.error('Failed to terminate session.');
 }
 }
 };

 if (isLoading) return (
 <div className="p-8 space-y-6">
 <SkeletonLoader className="h-8 w-48 mb-4" />
 <SkeletonLoader className="h-12 w-full" />
 <SkeletonLoader className="h-12 w-full" />
 <SkeletonLoader className="h-12 w-full" />
 </div>
 );

 return (
 <div className="space-y-6 animate-in fade-in duration-300">
 <div className="flex items-center justify-between">
 <div>
 <h3 className="text-lg text-text-primary mb-1 font-bold">Active Sessions</h3>
 <p className="text-sm text-text-muted font-medium">Monitor and terminate active user sessions across all devices.</p>
 </div>
 </div>

 <div className="space-y-4">
 {sessions.length === 0 ? (
 <div className="text-center p-8 border border-border rounded-xl bg-surface">
 <ShieldAlert className="w-8 h-8 text-text-muted mx-auto mb-2 opacity-50 font-medium" />
 <p className="text-text-muted font-medium">No active sessions found.</p>
 </div>
 ) : (
 sessions.map(session => (
 <div key={session.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-border rounded-xl bg-surface-background">
 <div className="flex items-start gap-4">
 <div className="p-3 bg-brand-50 text-brand-600 rounded-full">
 {session.device ==='Mobile' ? <Smartphone className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
 </div>
 <div>
 <div className="text-text-primary">
 {session.user?.name} <span className="text-sm text-text-muted font-medium">({session.user?.email})</span>
 </div>
 <div className="text-sm text-text-muted flex items-center gap-2 mt-1 font-medium">
 <Globe className="w-3 h-3" /> {session.ipAddress ||'Unknown IP'}
 <span>&bull;</span>
 {session.browser} on {session.operatingSystem}
 </div>
 <div className="text-xs text-text-muted mt-1 font-medium">
 Last active: {new Date(session.lastActivity).toLocaleString()}
 </div>
 </div>
 </div>
 <div className="mt-4 sm:mt-0">
 <Button variant="danger" size="sm" onClick={() => handleTerminateSession(session.id)}>
 <Trash2 className="w-4 h-4 mr-1" /> Terminate
 </Button>
 </div>
 </div>
 ))
 )}
 </div>
 </div>
 );
};

export default ActiveSessionsTab;
