import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Editor } from './components/Editor';
import { Auth } from './components/Auth';
import { AdminDashboard } from './components/AdminDashboard';
import { Note, User, AppView } from './types';
import { motion, AnimatePresence } from 'framer-motion';

// Helper for generating IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

const App: React.FC = () => {
  // --- State Management ---
  
  // View Routing
  const [view, setView] = useState<AppView>('login');
  
  // Users & Auth
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('nebula_users');
    if (saved) return JSON.parse(saved);
    // Default Admin User
    return [{
      id: 'admin-1',
      name: 'Admin User',
      email: 'admin@nebula.com',
      password: 'admin',
      role: 'admin',
      createdAt: Date.now()
    }];
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('nebula_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Notes
  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem('nebula_notes');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Theme State: Load from local storage or system preference
  const [isDark, setIsDark] = useState(() => {
    try {
        const saved = localStorage.getItem('nebula_theme');
        if (saved !== null) return saved === 'dark';
        if (typeof window !== 'undefined') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
    } catch {
        // ignore
    }
    return false;
  });

  // --- Effects ---

  // Apply theme class and save to localStorage
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('nebula_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('nebula_theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    localStorage.setItem('nebula_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('nebula_notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('nebula_current_user', JSON.stringify(currentUser));
      // Only switch to app if we are currently in a login/signup view
      if (view === 'login' || view === 'signup') {
        setView('app');
      }
    } else {
      localStorage.removeItem('nebula_current_user');
      // If logged out, force login view
      if (view !== 'login' && view !== 'signup') {
        setView('login');
      }
    }
  }, [currentUser, view]);

  // Determine active note on load
  useEffect(() => {
     if (currentUser && notes.length > 0 && !activeNoteId) {
        const userNotes = notes.filter(n => n.userId === currentUser.id);
        if (userNotes.length > 0) setActiveNoteId(userNotes[0].id);
     }
  }, [currentUser, notes, activeNoteId]);

  // --- Logic Handlers ---

  // Theme Toggle with Water Wave Effect (View Transitions API)
  const handleThemeToggle = async (e: React.MouseEvent) => {
    // Fallback for browsers without View Transition API
    if (!(document as any).startViewTransition) {
      setIsDark(!isDark);
      return;
    }

    // Calculate click position for the circle center
    const x = e.clientX;
    const y = e.clientY;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = (document as any).startViewTransition(() => {
        setIsDark(prev => !prev);
    });

    await transition.ready;

    // Animate the clip path
    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${endRadius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration: 500,
        easing: "ease-in",
        pseudoElement: "::view-transition-new(root)",
      }
    );
  };

  const handleAuth = (data: any, mode: 'login' | 'signup') => {
    setAuthError(null);
    if (mode === 'signup') {
      if (users.some(u => u.email === data.email)) {
        setAuthError('User already exists with this email.');
        return;
      }
      const newUser: User = {
        id: generateId(),
        name: data.name || 'New User',
        email: data.email,
        password: data.password,
        role: 'user',
        createdAt: Date.now()
      };
      setUsers([...users, newUser]);
      setCurrentUser(newUser);
    } else {
      const user = users.find(u => u.email === data.email && u.password === data.password);
      if (user) {
        setCurrentUser(user);
      } else {
        setAuthError('Invalid credentials.');
      }
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthError(null);
    setView('login');
  };

  const handleCreateNote = (parentId?: string) => {
    if (!currentUser) return;
    const newNote: Note = {
      id: generateId(),
      title: '',
      content: '',
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isFavorite: false,
      userId: currentUser.id,
      parentId: parentId || null,
      expanded: true
    };
    
    // If creating a child, ensure parent is expanded
    if (parentId) {
        setNotes(prev => prev.map(n => n.id === parentId ? { ...n, expanded: true } : n).concat(newNote));
    } else {
        setNotes([newNote, ...notes]);
    }
    
    setActiveNoteId(newNote.id);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  // Recursive delete function
  const getDescendantIds = (allNotes: Note[], rootId: string): string[] => {
      const children = allNotes.filter(n => n.parentId === rootId);
      let ids = children.map(c => c.id);
      children.forEach(c => {
          ids = [...ids, ...getDescendantIds(allNotes, c.id)];
      });
      return ids;
  };

  const handleDeleteNote = (id: string) => {
    const descendants = getDescendantIds(notes, id);
    const idsToDelete = [id, ...descendants];
    
    const newNotes = notes.filter(n => !idsToDelete.includes(n.id));
    setNotes(newNotes);

    if (idsToDelete.includes(activeNoteId || '')) {
      // find next note for this user
      const userNotes = newNotes.filter(n => n.userId === currentUser?.id);
      setActiveNoteId(userNotes.length > 0 ? userNotes[0].id : null);
    }
  };

  const handleUpdateNote = (updatedNote: Note) => {
    setNotes(notes.map(n => n.id === updatedNote.id ? updatedNote : n));
  };

  const toggleNoteExpansion = (id: string) => {
      setNotes(notes.map(n => n.id === id ? { ...n, expanded: !n.expanded } : n));
  };

  const handleDeleteUser = (userId: string) => {
    if (userId === currentUser?.id) return; // Can't delete self
    setUsers(users.filter(u => u.id !== userId));
    // Delete user's notes too
    setNotes(notes.filter(n => n.userId !== userId));
  };

  // --- Render Logic ---

  // 1. Auth Guard
  if (!currentUser || view === 'login' || view === 'signup') {
    return (
      <Auth 
        mode={view === 'signup' ? 'signup' : 'login'} 
        onSwitchMode={() => {
          setAuthError(null);
          setView(view === 'login' ? 'signup' : 'login');
        }}
        onSubmit={(data) => handleAuth(data, view === 'signup' ? 'signup' : 'login')}
        error={authError}
      />
    );
  }

  // 2. Admin Guard
  if (view === 'admin') {
    if (currentUser.role !== 'admin') {
        setView('app');
        return null;
    }
    return (
        <AdminDashboard 
            users={users} 
            currentUser={currentUser}
            onDeleteUser={handleDeleteUser}
            onLogout={handleLogout}
            onBack={() => setView('app')}
        />
    );
  }

  // 3. Main App View
  const userNotes = notes.filter(n => n.userId === currentUser.id);
  const activeNote = userNotes.find(n => n.id === activeNoteId);
  const MotionDiv = motion.div as any;
  
  // Build ancestry for breadcrumbs in Editor
  const getBreadcrumbs = (noteId: string | null): Note[] => {
      if (!noteId) return [];
      const note = userNotes.find(n => n.id === noteId);
      if (!note) return [];
      if (!note.parentId) return [note];
      return [...getBreadcrumbs(note.parentId), note];
  };
  const breadcrumbs = getBreadcrumbs(activeNoteId);

  return (
    <div className="flex h-screen bg-white dark:bg-nebula-950 text-nebula-900 dark:text-white overflow-hidden font-sans selection:bg-accent-100 dark:selection:bg-accent-900">
      
      <Sidebar 
        notes={userNotes}
        activeNoteId={activeNoteId}
        user={currentUser}
        onSelectNote={setActiveNoteId}
        onCreateNote={handleCreateNote}
        onDeleteNote={handleDeleteNote}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onLogout={handleLogout}
        onAdminClick={() => setView('admin')}
        onToggleExpansion={toggleNoteExpansion}
      />

      <div className="flex-1 h-full relative flex flex-col">
        {activeNote ? (
          <Editor 
            note={activeNote} 
            breadcrumbs={breadcrumbs}
            onUpdate={handleUpdateNote} 
            toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            isSidebarOpen={isSidebarOpen}
            isDark={isDark}
            onToggleTheme={handleThemeToggle}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-nebula-400 p-4 text-center bg-nebula-50/50 dark:bg-nebula-950">
             <MotionDiv 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="max-w-md"
             >
                <div className="w-20 h-20 bg-white dark:bg-nebula-900 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-2xl shadow-nebula-200 dark:shadow-none">
                    <span className="text-3xl font-bold text-nebula-900 dark:text-white font-mono">W</span>
                </div>
                <h2 className="text-3xl font-bold text-nebula-800 dark:text-white mb-3">Welcome back, {currentUser.name}</h2>
                <p className="mb-8 text-nebula-500">Ready to build your wall?</p>
                <button 
                    onClick={() => handleCreateNote()}
                    className="bg-nebula-900 text-white dark:bg-white dark:text-nebula-900 px-8 py-3 rounded-xl font-medium shadow-xl hover:shadow-2xl transition-all active:scale-95"
                >
                    Create Page
                </button>
             </MotionDiv>
          </div>
        )}
      </div>

      {isSidebarOpen && (
        <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-10 md:hidden" 
            onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default App;