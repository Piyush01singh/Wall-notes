import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, ChevronLeft, Trash2, LogOut, Shield, ChevronRight, ChevronDown, FileText, Book } from 'lucide-react';
import { Note, User } from '../types';

interface SidebarProps {
  notes: Note[];
  activeNoteId: string | null;
  user: User;
  onSelectNote: (id: string) => void;
  onCreateNote: (parentId?: string) => void;
  onDeleteNote: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isOpen: boolean;
  toggleSidebar: () => void;
  onLogout: () => void;
  onAdminClick: () => void;
  onToggleExpansion: (id: string) => void;
}

interface NoteItemProps {
  note: Note;
  allNotes: Note[];
  depth: number;
  activeNoteId: string | null;
  onSelectNote: (id: string) => void;
  onCreateNote: (parentId?: string) => void;
  onDeleteNote: (id: string) => void;
  onToggleExpansion: (id: string) => void;
}

// Helper to clean HTML from title for display in sidebar
const stripHtml = (html: string) => {
    if (!html) return "";
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
};

const NoteItem: React.FC<NoteItemProps> = ({ 
  note, 
  allNotes, 
  depth, 
  activeNoteId, 
  onSelectNote, 
  onCreateNote, 
  onDeleteNote,
  onToggleExpansion 
}) => {
  const children = allNotes.filter(n => n.parentId === note.id);
  const isExpanded = note.expanded;
  const isActive = activeNoteId === note.id;
  const isRoot = depth === 0;

  return (
    <div className="select-none">
      <div 
        className={`group flex items-center gap-1 py-1.5 pr-2 rounded-lg cursor-pointer transition-colors ${
           isActive 
            ? 'bg-nebula-200/60 dark:bg-nebula-800 text-nebula-900 dark:text-white' 
            : 'text-nebula-600 dark:text-nebula-400 hover:bg-nebula-100 dark:hover:bg-nebula-800/50'
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => onSelectNote(note.id)}
      >
        <div 
            className="p-0.5 rounded hover:bg-nebula-300 dark:hover:bg-nebula-700 text-nebula-400 transition-colors"
            onClick={(e) => { e.stopPropagation(); onToggleExpansion(note.id); }}
        >
            {children.length > 0 ? (
                isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
            ) : (
                <div className="w-[14px]" /> 
            )}
        </div>

        <div className={`flex items-center justify-center mr-2 ${isRoot ? 'text-nebula-900 dark:text-nebula-200' : 'text-nebula-400'}`}>
            {isRoot ? <Book size={16} className="fill-nebula-200/50 dark:fill-nebula-800/50" /> : <FileText size={14} />}
        </div>

        <span className={`truncate flex-1 text-sm ${isRoot ? 'font-semibold' : 'font-medium'}`}>
            {stripHtml(note.title) || (isRoot ? 'Untitled Book' : 'Untitled Page')}
        </span>

        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
            <button 
                onClick={(e) => { e.stopPropagation(); onCreateNote(note.id); }}
                className="p-1 hover:bg-nebula-300 dark:hover:bg-nebula-700 rounded text-nebula-500"
                title="Add Page"
            >
                <Plus size={12} />
            </button>
            <button 
                onClick={(e) => { e.stopPropagation(); onDeleteNote(note.id); }}
                className="p-1 hover:bg-red-200 dark:hover:bg-red-900/50 rounded text-nebula-500 hover:text-red-500"
                title="Delete"
            >
                <Trash2 size={12} />
            </button>
        </div>
      </div>

      {isExpanded && children.length > 0 && (
        <div className="relative">
            {/* Tree Line guide */}
            <div 
                className="absolute left-0 top-0 bottom-0 w-px bg-nebula-200 dark:bg-nebula-800" 
                style={{ left: `${depth * 16 + 15}px` }}
            />
            {children.map(child => (
                <NoteItem 
                    key={child.id} 
                    note={child} 
                    allNotes={allNotes} 
                    depth={depth + 1}
                    activeNoteId={activeNoteId}
                    onSelectNote={onSelectNote}
                    onCreateNote={onCreateNote}
                    onDeleteNote={onDeleteNote}
                    onToggleExpansion={onToggleExpansion}
                />
            ))}
        </div>
      )}
    </div>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({
  notes,
  activeNoteId,
  user,
  onSelectNote,
  onCreateNote,
  onDeleteNote,
  searchQuery,
  setSearchQuery,
  isOpen,
  toggleSidebar,
  onLogout,
  onAdminClick,
  onToggleExpansion
}) => {
  const rootNotes = notes.filter(n => !n.parentId);
  
  const isSearching = searchQuery.length > 0;
  const displayedNotes = isSearching 
    ? notes.filter(n => n.title.toLowerCase().includes(searchQuery.toLowerCase())) 
    : rootNotes;

  const MotionDiv = motion.div as any;

  return (
    <MotionDiv 
      initial={{ width: isOpen ? 280 : 0, opacity: isOpen ? 1 : 0 }}
      animate={{ width: isOpen ? 280 : 0, opacity: isOpen ? 1 : 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="h-screen border-r border-nebula-200 dark:border-nebula-800 bg-nebula-50/95 dark:bg-nebula-900/95 backdrop-blur-xl flex flex-col overflow-hidden relative z-20 shadow-2xl"
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between sticky top-0 bg-inherit z-10">
        <div className="flex items-center gap-2 font-semibold text-nebula-800 dark:text-white">
          <div className="w-8 h-8 bg-nebula-900 dark:bg-white rounded-lg flex items-center justify-center text-white dark:text-nebula-900 shadow-lg">
            <span className="font-bold font-mono tracking-tighter">WN</span>
          </div>
          <span className="tracking-tight">Wall Notes</span>
        </div>
        <button onClick={toggleSidebar} className="p-1 hover:bg-nebula-200 rounded dark:hover:bg-nebula-800 text-nebula-500 transition-colors">
          <ChevronLeft size={18} />
        </button>
      </div>

      {/* Search & New */}
      <div className="px-4 pb-2 space-y-3">
         <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-nebula-400 group-focus-within:text-nebula-600 dark:group-focus-within:text-nebula-200 transition-colors" size={14} />
          <input 
            type="text"
            placeholder="Search pages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-nebula-800 border border-nebula-200 dark:border-nebula-700 rounded-lg py-1.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-nebula-500/20 transition-all"
          />
        </div>
      </div>

      {/* Notes Tree */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 mt-2 custom-scrollbar">
        <div className="text-xs font-semibold text-nebula-400 uppercase tracking-wider px-2 mb-2">
            Library
        </div>
        
        {displayedNotes.length === 0 ? (
           <div className="text-center text-nebula-400 py-8 text-xs">
              No books found
           </div>
        ) : (
           <div className="space-y-0.5">
               {displayedNotes.map(note => isSearching ? (
                    <div 
                        key={note.id} 
                        onClick={() => onSelectNote(note.id)}
                        className="p-2 text-sm rounded-lg hover:bg-nebula-100 dark:hover:bg-nebula-800 cursor-pointer text-nebula-700 dark:text-nebula-300"
                    >
                        <div className="flex items-center gap-2">
                            <FileText size={14} />
                            {stripHtml(note.title) || 'Untitled'}
                        </div>
                    </div>
               ) : (
                   <NoteItem 
                        key={note.id}
                        note={note}
                        allNotes={notes}
                        depth={0}
                        activeNoteId={activeNoteId}
                        onSelectNote={onSelectNote}
                        onCreateNote={onCreateNote}
                        onDeleteNote={onDeleteNote}
                        onToggleExpansion={onToggleExpansion}
                   />
               ))}
           </div>
        )}
        
        <button 
            onClick={() => onCreateNote()}
            className="w-full mt-2 flex items-center gap-2 px-2 py-1.5 text-sm text-nebula-500 hover:text-nebula-900 dark:hover:text-white hover:bg-nebula-100 dark:hover:bg-nebula-800 rounded-lg transition-colors"
        >
            <Plus size={14} />
            <span>New Book</span>
        </button>
      </div>

      {/* User Profile Footer */}
      <div className="p-3 mt-auto border-t border-nebula-200 dark:border-nebula-800 bg-white/50 dark:bg-nebula-900/50">
        <div className="flex items-center gap-3 p-2 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-xs">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-nebula-900 dark:text-white truncate">{user?.name || 'User'}</p>
            </div>
            <div className="flex gap-1">
                 {user?.role === 'admin' && (
                     <button onClick={onAdminClick} title="Admin" className="p-1.5 text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors">
                        <Shield size={14} />
                    </button>
                )}
                <button onClick={onLogout} title="Logout" className="p-1.5 text-nebula-400 hover:text-nebula-900 dark:hover:text-white hover:bg-nebula-100 dark:hover:bg-nebula-800 rounded-lg transition-colors">
                    <LogOut size={14} />
                </button>
            </div>
        </div>
      </div>
    </MotionDiv>
  );
};