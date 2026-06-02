import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { backendUrl } from '../App';

const DEFAULT_CURRENCY = '$';

// =========================================================================
// UTILITY: AUTO GENERATE AVATAR FROM NAME
// =========================================================================
const getAvatar = (user) => {
  if (user.avatar) return user.avatar; 
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&color=fff&bold=true&size=128`;
};

// =========================================================================
// 🌟 SUB-COMPONENT: CustomToast 
// =========================================================================
const CustomToast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgClasses = {
    success: 'bg-emerald-50 border-emerald-100 text-emerald-800',
    error: 'bg-rose-50 border-rose-100 text-rose-800',
    info: 'bg-blue-50 border-blue-100 text-blue-800'
  };

  return (
    <div className={`flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl border text-xs font-semibold transition-all duration-300 animate-bounce ${bgClasses[type] || bgClasses.success}`}>
      <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
      {message}
      <button onClick={onClose} className="ml-3 text-sm font-bold hover:opacity-75 cursor-pointer">&times;</button>
    </div>
  );
};

const Users = ({ token }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState([]);
  
  const [filterStatus, setFilterStatus] = useState('All');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [editUser, setEditUser] = useState(null);
  const [deleteUser, setDeleteUser] = useState(null);
  const [createUserModal, setCreateUserModal] = useState(false);

  // =========================================================================
  // API FUNCTIONS
  // =========================================================================

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(backendUrl + '/api/user/list', { headers: { token } });
      if (response.data.success) {
        setUsers(response.data.users);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setIsStatusDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter(u => u.status === 'Active').length;
    const suspended = total - active;
    return { total, active, suspended };
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            user.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'All' || user.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [users, searchQuery, filterStatus]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredUsers, currentPage]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;

  useEffect(() => {
    setCurrentPage(1); 
  }, [searchQuery, filterStatus]);

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        backendUrl + '/api/user/update',
        {
          userId: editUser._id,
          name: editUser.name,
          email: editUser.email,
          status: editUser.status,
          newPassword: editUser.newPassword || ''
        },
        { headers: { token } }
      );

      if (response.data.success) {
        setUsers(prev => prev.map(u => u._id === editUser._id ? response.data.user : u));
        toast.success(`Successfully updated profile for "${editUser.name}"!`);
        setEditUser(null);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteUser) return;
    try {
      const response = await axios.post(
        backendUrl + '/api/user/remove',
        { userId: deleteUser._id },
        { headers: { token } }
      );

      if (response.data.success) {
        setUsers(prev => prev.filter(u => u._id !== deleteUser._id));
        toast.success(`Account "${deleteUser.name}" has been removed.`);
        setDeleteUser(null);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  const handleCreateUserSubmit = async (e, newUser) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        backendUrl + '/api/user/create',
        newUser,
        { headers: { token } }
      );

      if (response.data.success) {
        setUsers(prev => [response.data.user, ...prev]);
        toast.success(`User "${newUser.name}" created successfully!`);
        setCreateUserModal(false);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen p-4 sm:p-8 select-none font-sans text-slate-700 antialiased relative">
      
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2">
        {toasts.map(t => (
          <CustomToast 
            key={t.id} 
            message={t.message} 
            type={t.type} 
            onClose={() => setToasts(prev => prev.filter(item => item.id !== t.id))} 
          />
        ))}
      </div>
      
      <div className="max-w-[1500px] mx-auto space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">User Management</h1>
            <p className="text-sm text-slate-500 mt-1">Manage system user accounts.</p>
          </div>
          <button 
            onClick={() => setCreateUserModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add New User
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 flex-shrink-0">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Customers</p>
              <h4 className="text-xl font-bold text-slate-900 mt-1">{stats.total}</h4>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Users</p>
              <div className="flex items-center gap-2 mt-1">
                <h4 className="text-xl font-bold text-slate-900">{stats.active}</h4>
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 flex-shrink-0">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Suspended</p>
              <h4 className="text-xl font-bold text-slate-900 mt-1">{stats.suspended}</h4>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            
            <div className="relative lg:col-span-2">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input 
                type="text" 
                placeholder="Search by user name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800/10 focus:border-slate-800 text-xs transition-all bg-slate-50/50"
              />
            </div>

            <div ref={statusDropdownRef} className="relative">
              <div 
                onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                className="flex items-center justify-between w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs bg-white cursor-pointer hover:border-slate-350 transition-all shadow-sm"
              >
                <span className="font-semibold text-slate-600">Status: {filterStatus === 'All' ? 'All' : filterStatus}</span>
                <svg className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isStatusDropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
              {isStatusDropdownOpen && (
                <div className="absolute left-0 mt-1.5 w-full bg-white border border-slate-100 rounded-xl shadow-lg py-1 z-30 transform origin-top transition-all">
                  {['All', 'Active', 'Suspended'].map(status => (
                    <div
                      key={status}
                      onClick={() => { setFilterStatus(status); setIsStatusDropdownOpen(false); }}
                      className={`px-4 py-2 text-xs cursor-pointer transition-colors ${filterStatus === status ? 'bg-slate-100 font-bold text-slate-900' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      {status}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {(searchQuery || filterStatus !== 'All') && (
            <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
              <span className="text-slate-400">
                Found <b className="text-slate-700">{filteredUsers.length}</b> users matching your criteria.
              </span>
              <button 
                onClick={() => { setSearchQuery(''); setFilterStatus('All'); }}
                className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                Clear Filters &times;
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto pb-4">
          {filteredUsers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-20 flex flex-col items-center justify-center text-slate-400 shadow-sm w-full">
              <svg className="w-16 h-16 stroke-1 mb-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <p className="text-sm font-semibold text-slate-600">No users found</p>
              <p className="text-xs text-slate-400 mt-1">Please try different search keywords or filters.</p>
              <button 
                onClick={() => { setSearchQuery(''); setFilterStatus('All'); }}
                className="mt-4 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-xl transition-all cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <table className="w-full text-left border-separate border-spacing-y-2 sm:border-spacing-y-3">
              <thead>
                <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-1 px-3 sm:px-6 w-[40%] sm:w-[45%]">Member</th>
                  <th className="pb-1 px-3 sm:px-6 hidden md:table-cell w-auto">Email Address</th>
                  <th className="pb-1 px-3 sm:px-6 text-center w-auto whitespace-nowrap">Status</th>
                  <th className="pb-1 px-3 sm:px-6 text-right w-auto whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {paginatedUsers.map((user) => (
                  <tr key={user._id} className="group transition-all duration-150">
                    <td className="py-3 sm:py-4 px-3 sm:px-6 bg-white group-hover:bg-slate-50/80 rounded-l-2xl border-y border-l border-slate-100/80 shadow-xs transition-colors">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border border-slate-100 flex-shrink-0 bg-slate-100">
                          <img className="w-full h-full object-cover" src={getAvatar(user)} alt={user.name} />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 tracking-tight truncate">{user.name}</div>
                          <div className="text-[10px] text-slate-400 font-medium truncate md:hidden mt-0.5">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 sm:py-4 px-3 sm:px-6 bg-white group-hover:bg-slate-50/80 border-y border-slate-100/80 font-medium text-slate-500 hidden md:table-cell transition-colors">
                      <div className="truncate max-w-[200px] lg:max-w-sm">{user.email}</div>
                    </td>
                    <td className="py-3 sm:py-4 px-3 sm:px-6 bg-white group-hover:bg-slate-50/80 border-y border-slate-100/80 text-center transition-colors">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold border whitespace-nowrap
                        ${user.status === 'Active' 
                          ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                          : 'bg-rose-50 border-rose-100 text-rose-700'}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${user.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-400'}`}></span>
                        {user.status === 'Active' ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="py-3 sm:py-4 px-3 sm:px-6 bg-white group-hover:bg-slate-50/80 rounded-r-2xl border-y border-r border-slate-100/80 text-right transition-colors">
                      <div className="flex items-center justify-end gap-1 sm:gap-1.5">
                        <button 
                          onClick={() => setEditUser(user)}
                          className="p-1.5 sm:p-2 text-indigo-600 hover:text-indigo-900 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl transition-all cursor-pointer shadow-sm"
                          title="Edit user"
                        >
                          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => setDeleteUser(user)}
                          className="p-1.5 sm:p-2 text-rose-600 hover:text-rose-950 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl transition-all cursor-pointer shadow-sm"
                          title="Delete user"
                        >
                          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {filteredUsers.length > 0 && (
          <div className="py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium">
            <span>
              Showing <b className="text-slate-700">{Math.min(filteredUsers.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredUsers.length, currentPage * itemsPerPage)}</b> of <b className="text-slate-700">{filteredUsers.length}</b> users
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-slate-600 font-bold transition-all disabled:opacity-40 disabled:hover:bg-white cursor-pointer"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(idx + 1)}
                  className={`w-8 h-8 rounded-xl font-bold border transition-all cursor-pointer ${currentPage === idx + 1 ? 'bg-slate-900 border-slate-900 text-white shadow-sm' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'}`}
                >
                  {idx + 1}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-slate-600 font-bold transition-all disabled:opacity-40 disabled:hover:bg-white cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {editUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSaveEdit} className="bg-white rounded-3xl max-w-md w-full shadow-2xl relative border border-slate-100 p-6 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Edit User Account</h2>
              <p className="text-xs text-slate-400 mt-0.5">Update user profile information and access status.</p>
            </div>
            <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <img className="w-14 h-14 rounded-full border shadow-xs bg-white" src={getAvatar(editUser)} alt={editUser.name} />
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Member Profile</p>
                <p className="text-sm font-bold text-slate-700 mt-0.5">{editUser.name}</p>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1.5">Full Name</label>
              <input type="text" value={editUser.name} onChange={(e) => setEditUser(prev => ({ ...prev, name: e.target.value }))} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800/10 focus:border-slate-800 text-xs transition-all" required />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1.5">Email Address</label>
              <input type="email" value={editUser.email} onChange={(e) => setEditUser(prev => ({ ...prev, email: e.target.value }))} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800/10 focus:border-slate-800 text-xs transition-all" required />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1.5">New Password (Reset)</label>
              <input type="password" placeholder="Enter new password (leave blank to keep current)" value={editUser.newPassword || ''} onChange={(e) => setEditUser(prev => ({ ...prev, newPassword: e.target.value }))} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800/10 focus:border-slate-800 text-xs transition-all" minLength="8" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1.5">Status</label>
              <select value={editUser.status} onChange={(e) => setEditUser(prev => ({ ...prev, status: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-600 font-semibold cursor-pointer focus:outline-none">
                <option value="Active">Active</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
            <div className="border-t border-slate-100 pt-4 flex justify-end gap-3">
              <button type="button" onClick={() => setEditUser(null)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer">Cancel</button>
              <button type="submit" className="px-5 py-2 text-xs font-semibold text-white bg-slate-950 hover:bg-slate-850 rounded-xl shadow-md transition-all cursor-pointer">Save Changes</button>
            </div>
          </form>
        </div>
      )}

      {deleteUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-rose-500"></div>
            <div className="flex items-center gap-4 mt-2">
              <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 flex-shrink-0">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Delete Account?</h3>
                <p className="text-xs text-slate-500">This action is permanent and cannot be undone.</p>
              </div>
            </div>
            <div className="my-5 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-sm text-slate-700 font-medium">Are you sure you want to permanently remove this user?</p>
              <p className="text-xs text-rose-700 font-semibold mt-1.5 truncate">{deleteUser.name} ({deleteUser.email})</p>
            </div>
            <div className="flex items-center gap-3 justify-end mt-4">
              <button onClick={() => setDeleteUser(null)} className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer">Cancel</button>
              <button onClick={handleDeleteConfirm} className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold shadow-md shadow-rose-600/10 active:scale-95 transition-all cursor-pointer">Confirm Delete</button>
            </div>
          </div>
        </div>
      )}

      {createUserModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={(e) => handleCreateUserSubmit(e, { name: e.target[0].value, email: e.target[1].value, password: e.target[2].value, status: e.target[3].value })} className="bg-white rounded-3xl max-w-md w-full shadow-2xl relative border border-slate-100 p-6 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Create New User</h2>
              <p className="text-xs text-slate-400 mt-0.5">Add a new customer account to the management system.</p>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1.5">Full Name</label>
              <input type="text" placeholder="Enter customer name..." className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800/10 focus:border-slate-800 text-xs transition-all" required />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1.5">Email Address</label>
              <input type="email" placeholder="customer@domain.com" className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800/10 focus:border-slate-800 text-xs transition-all" required />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1.5">Password</label>
              <input type="password" placeholder="Password (min. 8 characters)..." className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800/10 focus:border-slate-800 text-xs transition-all" minLength="8" required />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1.5">Status</label>
              <select className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-600 font-semibold cursor-pointer focus:outline-none">
                <option value="Active">Active</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
            <div className="border-t border-slate-100 pt-4 flex justify-end gap-3">
              <button type="button" onClick={() => setCreateUserModal(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer">Cancel</button>
              <button type="submit" className="px-5 py-2 text-xs font-semibold text-white bg-slate-950 hover:bg-slate-850 rounded-xl shadow-md transition-all cursor-pointer">Create User</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Users;