import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../types';
import { Button } from './Button';
import { Shield, Trash2, Eye, EyeOff, Search, LogOut, ChevronLeft, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AdminDashboardProps {
  users: User[];
  currentUser: User;
  onDeleteUser: (userId: string) => void;
  onLogout: () => void;
  onBack: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  users, 
  currentUser, 
  onDeleteUser, 
  onLogout,
  onBack
}) => {
  const [search, setSearch] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);

  const togglePassword = (id: string) => {
    const newSet = new Set(visiblePasswords);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setVisiblePasswords(newSet);
  };

  const handleDeleteClick = (id: string) => {
      setDeleteConfirmation(id);
  };

  const confirmDelete = () => {
      if (deleteConfirmation) {
          onDeleteUser(deleteConfirmation);
          setDeleteConfirmation(null);
      }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const MotionDiv = motion.div as any;

  return (
    <div className="min-h-screen bg-nebula-50 dark:bg-nebula-950 p-6">
      <div className="max-w-6xl mx-auto relative">
        
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
             <button onClick={onBack} className="p-2 rounded-lg bg-white dark:bg-nebula-900 border border-nebula-200 dark:border-nebula-800 text-nebula-500 hover:text-nebula-900 dark:hover:text-white transition-colors">
                <ChevronLeft size={20} />
             </button>
             <div>
                <h1 className="text-2xl font-bold text-nebula-900 dark:text-white flex items-center gap-2">
                <Shield className="text-purple-500" />
                Admin Control Center
                </h1>
                <p className="text-nebula-500">Manage users and system access</p>
             </div>
          </div>
          <Button variant="secondary" onClick={onLogout} icon={<LogOut size={16} />}>Sign Out</Button>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-nebula-900 p-6 rounded-2xl border border-nebula-200 dark:border-nebula-800 shadow-sm">
            <p className="text-sm text-nebula-500 mb-1">Total Users</p>
            <p className="text-3xl font-bold text-nebula-900 dark:text-white">{users.length}</p>
          </div>
           <div className="bg-white dark:bg-nebula-900 p-6 rounded-2xl border border-nebula-200 dark:border-nebula-800 shadow-sm">
            <p className="text-sm text-nebula-500 mb-1">Active Admins</p>
            <p className="text-3xl font-bold text-purple-600">{users.filter(u => u.role === 'admin').length}</p>
          </div>
           <div className="bg-white dark:bg-nebula-900 p-6 rounded-2xl border border-nebula-200 dark:border-nebula-800 shadow-sm">
            <p className="text-sm text-nebula-500 mb-1">System Status</p>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                <p className="text-lg font-medium text-nebula-900 dark:text-white">Operational</p>
            </div>
          </div>
        </div>

        {/* User Table */}
        <div className="bg-white dark:bg-nebula-900 rounded-2xl border border-nebula-200 dark:border-nebula-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-nebula-200 dark:border-nebula-800 flex items-center justify-between">
            <h3 className="font-semibold text-nebula-900 dark:text-white">Registered Users</h3>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-nebula-400" size={16} />
                <input 
                    type="text" 
                    placeholder="Search users..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-nebula-50 dark:bg-nebula-950 border border-nebula-200 dark:border-nebula-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-nebula-50 dark:bg-nebula-950/50 text-xs uppercase text-nebula-500 font-medium">
                    <tr>
                        <th className="px-6 py-4">User</th>
                        <th className="px-6 py-4">Role</th>
                        <th className="px-6 py-4">Password</th>
                        <th className="px-6 py-4">Joined</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-nebula-100 dark:divide-nebula-800">
                    {filteredUsers.map(user => (
                        <tr key={user.id} className="hover:bg-nebula-50 dark:hover:bg-nebula-800/30 transition-colors">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-nebula-200 to-nebula-300 dark:from-nebula-700 dark:to-nebula-800 flex items-center justify-center text-xs font-bold text-nebula-600 dark:text-nebula-300">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-medium text-nebula-900 dark:text-white">{user.name}</p>
                                        <p className="text-xs text-nebula-500">{user.email}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    user.role === 'admin' 
                                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' 
                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                }`}>
                                    {user.role}
                                </span>
                            </td>
                            <td className="px-6 py-4 font-mono text-sm text-nebula-600 dark:text-nebula-400">
                                <div className="flex items-center gap-2">
                                    <span>{visiblePasswords.has(user.id) ? user.password : '••••••••'}</span>
                                    <button onClick={() => togglePassword(user.id)} className="text-nebula-400 hover:text-nebula-600 dark:hover:text-nebula-200">
                                        {visiblePasswords.has(user.id) ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-nebula-500">
                                {formatDistanceToNow(user.createdAt, { addSuffix: true })}
                            </td>
                            <td className="px-6 py-4 text-right">
                                <Button 
                                    size="sm" 
                                    variant="danger" 
                                    disabled={user.id === currentUser.id} 
                                    onClick={() => handleDeleteClick(user.id)}
                                    // Always visible
                                    className=""
                                    icon={<Trash2 size={14} />}
                                >
                                    Delete
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {filteredUsers.length === 0 && (
                <div className="p-8 text-center text-nebula-500">
                    No users found matching your search.
                </div>
            )}
          </div>
        </div>

        {/* Confirmation Modal */}
        <AnimatePresence>
            {deleteConfirmation && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <MotionDiv 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setDeleteConfirmation(null)}
                    />
                    <MotionDiv 
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="relative bg-white dark:bg-nebula-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-nebula-200 dark:border-nebula-800 z-10"
                    >
                        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600 mb-4 mx-auto">
                            <AlertTriangle size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-center text-nebula-900 dark:text-white mb-2">
                            Delete User?
                        </h3>
                        <p className="text-center text-nebula-500 mb-6">
                            Are you sure you want to delete this user? This action cannot be undone and all their associated notes will be permanently lost.
                        </p>
                        <div className="flex gap-3">
                            <Button 
                                variant="secondary" 
                                className="flex-1" 
                                onClick={() => setDeleteConfirmation(null)}
                            >
                                Cancel
                            </Button>
                            <Button 
                                variant="danger" 
                                className="flex-1" 
                                onClick={confirmDelete}
                            >
                                Confirm Delete
                            </Button>
                        </div>
                    </MotionDiv>
                </div>
            )}
        </AnimatePresence>

      </div>
    </div>
  );
};