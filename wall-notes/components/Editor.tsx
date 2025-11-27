import React, { useState, useEffect, useRef } from 'react';
import { Note } from '../types';
import { 
    MoreHorizontal, Sun, Moon, ChevronRight, 
    Bold, Italic, Underline, 
    AlignLeft, AlignCenter, AlignRight,
    List, ListOrdered,
    Palette, ChevronDown,
    Type, Loader2, Cloud, Check,
    AArrowUp
} from 'lucide-react';
import { clsx } from 'clsx';

interface EditorProps {
  note: Note;
  breadcrumbs: Note[];
  onUpdate: (note: Note) => void;
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
  isDark: boolean;
  onToggleTheme: (e: React.MouseEvent) => void;
}

const FONT_SIZES = [
  { value: '1', label: 'Tiny' },
  { value: '2', label: 'Small' },
  { value: '3', label: 'Normal' },
  { value: '4', label: 'Medium' },
  { value: '5', label: 'Large' },
  { value: '6', label: 'X-Large' },
  { value: '7', label: 'Huge' },
];

const FONT_FAMILIES = [
  { value: 'Inter, ui-sans-serif, system-ui, sans-serif', label: 'Sans' },
  { value: '"Times New Roman", Times, serif', label: 'Serif' },
  { value: '"JetBrains Mono", monospace', label: 'Mono' },
  { value: '"Comic Sans MS", "Chalkboard SE", sans-serif', label: 'Comic' },
];

export const Editor: React.FC<EditorProps> = ({ 
    note, 
    breadcrumbs,
    onUpdate, 
    toggleSidebar, 
    isSidebarOpen,
    isDark,
    onToggleTheme
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const sizeButtonRef = useRef<HTMLButtonElement>(null);
  const fontButtonRef = useRef<HTMLButtonElement>(null);
  const savedSelection = useRef<Range | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Custom Dropdown & Toolbar State
  const [showSizeSelect, setShowSizeSelect] = useState(false);
  const [showFontSelect, setShowFontSelect] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  
  const [currentFontSize, setCurrentFontSize] = useState('3');
  const [currentFontName, setCurrentFontName] = useState('Sans');
  const [activeFormats, setActiveFormats] = useState<string[]>([]);
  const [isTitleFocused, setIsTitleFocused] = useState(false);

  // Sync state when switching notes (Uncontrolled Component Pattern)
  useEffect(() => {
    if (titleRef.current) {
        if (titleRef.current.innerHTML !== note.title) {
            titleRef.current.innerHTML = note.title;
        }
    }
    if (contentRef.current) {
        if (contentRef.current.innerHTML !== note.content) {
            contentRef.current.innerHTML = note.content;
        }
    }
    setCurrentFontSize('3');
    setCurrentFontName('Sans');
    setActiveFormats([]);
    setIsTitleFocused(false);
    savedSelection.current = null;
    setShowSizeSelect(false);
    setShowFontSelect(false);
  }, [note.id]);

  // Global Selection Change Listener
  useEffect(() => {
    const handleSelectionChange = () => {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            const isInsideEditor = contentRef.current?.contains(range.commonAncestorContainer);
            const isInsideTitle = titleRef.current?.contains(range.commonAncestorContainer);
            
            if (isInsideEditor || isInsideTitle) {
                updateToolbarState();
            }
        }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    // Close dropdowns on scroll/resize
    const closeDropdowns = () => {
        setShowSizeSelect(false);
        setShowFontSelect(false);
    };
    window.addEventListener('scroll', closeDropdowns, true);
    window.addEventListener('resize', closeDropdowns);

    return () => {
        document.removeEventListener('selectionchange', handleSelectionChange);
        window.removeEventListener('scroll', closeDropdowns, true);
        window.removeEventListener('resize', closeDropdowns);
    };
  }, [isTitleFocused]);

  const triggerSave = () => {
    setIsSaving(true);
    if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
        const newTitle = titleRef.current?.innerHTML || '';
        const newContent = contentRef.current?.innerHTML || '';
        
        onUpdate({
            ...note,
            title: newTitle, 
            content: newContent,
            updatedAt: Date.now()
        });
        setIsSaving(false);
    }, 800);
  };

  const handleInput = () => {
    triggerSave();
  };

  // --- Formatting Commands ---
  
  const updateToolbarState = () => {
      // 1. Check basic formats
      const formats = ['bold', 'italic', 'underline', 'insertUnorderedList', 'insertOrderedList', 'justifyLeft', 'justifyCenter', 'justifyRight'];
      const active = formats.filter(cmd => document.queryCommandState(cmd));
      setActiveFormats(active);

      // 2. Check font size
      const size = document.queryCommandValue('fontSize');
      setCurrentFontSize(size || '3');

      // 3. Check font family
      const font = document.queryCommandValue('fontName');
      if (font) {
        const cleanFont = font.replace(/['"]/g, '');
        const matched = FONT_FAMILIES.find(f => f.value.includes(cleanFont) || cleanFont.includes(f.label.toLowerCase()));
        setCurrentFontName(matched ? matched.label : 'Sans');
      }
  };

  const saveSelectionRange = () => {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
          return sel.getRangeAt(0);
      }
      return null;
  };

  const restoreSelectionRange = (range: Range) => {
      const sel = window.getSelection();
      if (sel) {
          sel.removeAllRanges();
          sel.addRange(range);
      }
  };

  const execCmd = (command: string, value: string | undefined = undefined) => {
      // Restore focus/selection if needed
      const active = document.activeElement;
      const isEditorFocused = active === titleRef.current || active === contentRef.current;
      
      if (!isEditorFocused && savedSelection.current) {
          restoreSelectionRange(savedSelection.current);
      } else if (!isEditorFocused) {
          contentRef.current?.focus();
      }

      document.execCommand(command, false, value);
      updateToolbarState();
      
      // Ensure we keep focus after command
      if (!isEditorFocused && !savedSelection.current) {
          contentRef.current?.focus();
      }
  };

  const handleFormatting = (command: string, value?: string) => {
      // If we are applying via dropdown, we MUST rely on savedSelection
      if (savedSelection.current) {
          restoreSelectionRange(savedSelection.current);
          savedSelection.current = null; // Consume the saved selection
      }
      execCmd(command, value);
      
      // Close all dropdowns
      setShowSizeSelect(false);
      setShowFontSelect(false);
  };

  const preventFocusLoss = (e: React.MouseEvent) => {
      e.preventDefault();
  };

  const toggleDropdown = (type: 'size' | 'font') => {
      // Closing
      if ((type === 'size' && showSizeSelect) || (type === 'font' && showFontSelect)) {
          setShowSizeSelect(false);
          setShowFontSelect(false);
          savedSelection.current = null;
          return;
      }

      // Opening: Save selection!
      savedSelection.current = saveSelectionRange();
      
      // Close others
      setShowSizeSelect(false);
      setShowFontSelect(false);

      if (type === 'size' && sizeButtonRef.current) {
          const rect = sizeButtonRef.current.getBoundingClientRect();
          setDropdownPos({ top: rect.bottom + 6, left: rect.left });
          setShowSizeSelect(true);
      } else if (type === 'font' && fontButtonRef.current) {
          const rect = fontButtonRef.current.getBoundingClientRect();
          setDropdownPos({ top: rect.bottom + 6, left: rect.left });
          setShowFontSelect(true);
      }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
          e.preventDefault();
          contentRef.current?.focus();
      }
  };

  const stripHtml = (html: string) => {
      const tmp = document.createElement("DIV");
      tmp.innerHTML = html;
      return tmp.textContent || tmp.innerText || "";
  };

  const getCurrentSizeLabel = () => {
      return FONT_SIZES.find(s => s.value === currentFontSize)?.label || 'Normal';
  }

  return (
    <div className="flex-1 h-screen flex flex-col relative bg-white dark:bg-nebula-950 overflow-hidden transition-colors duration-500">
      
      {/* Header */}
      <header className="h-14 border-b border-nebula-100 dark:border-nebula-900 flex items-center justify-between px-4 bg-white/80 dark:bg-nebula-950/80 backdrop-blur-sm z-20 sticky top-0">
        <div className="flex items-center gap-3 overflow-hidden">
            {!isSidebarOpen && (
                <button onClick={toggleSidebar} className="p-1.5 rounded-lg hover:bg-nebula-100 dark:hover:bg-nebula-800 text-nebula-500">
                    <MoreHorizontal size={20} />
                </button>
            )}
            
            {/* Breadcrumbs */}
            <div className="flex items-center gap-1 text-sm text-nebula-500 overflow-hidden whitespace-nowrap mask-linear-fade">
                {breadcrumbs.map((crumb, index) => (
                    <React.Fragment key={crumb.id}>
                        {index > 0 && <ChevronRight size={14} className="text-nebula-300" />}
                        <span className={`${index === breadcrumbs.length - 1 ? 'text-nebula-900 dark:text-white font-medium' : ''}`}>
                            {stripHtml(crumb.title) || 'Untitled'}
                        </span>
                    </React.Fragment>
                ))}
            </div>
        </div>

        <div className="flex items-center gap-3">
             <div className="flex items-center gap-1.5 text-xs font-medium text-nebula-400 mr-2">
                {isSaving ? (
                    <>
                        <Loader2 size={12} className="animate-spin text-accent-500" />
                        <span className="text-accent-500">Saving...</span>
                    </>
                ) : (
                    <>
                        <Cloud size={12} className="text-green-500" />
                        <span className="text-nebula-400 dark:text-nebula-500">Saved</span>
                    </>
                )}
             </div>

             <button 
                onClick={onToggleTheme}
                className="p-2 text-nebula-500 hover:text-nebula-900 dark:hover:text-white hover:bg-nebula-100 dark:hover:bg-nebula-800 rounded-lg transition-colors"
            >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
        </div>
      </header>

      {/* WYSIWYG Toolbar */}
      <div className="h-12 border-b border-nebula-100 dark:border-nebula-900 flex items-center gap-1 px-4 bg-nebula-50/50 dark:bg-nebula-900/30 backdrop-blur-sm overflow-x-auto custom-scrollbar flex-shrink-0 select-none z-10">
          
          {/* Font Size Selector */}
          <button 
                ref={sizeButtonRef}
                onMouseDown={preventFocusLoss}
                onClick={() => toggleDropdown('size')}
                className={clsx(
                    "flex items-center gap-2 px-2 py-1.5 rounded text-sm font-medium min-w-[100px] justify-between transition-colors border border-transparent mr-1",
                    "hover:bg-nebula-200 dark:hover:bg-nebula-800 text-nebula-700 dark:text-nebula-200 hover:border-nebula-200 dark:hover:border-nebula-700 cursor-pointer",
                    showSizeSelect && "bg-nebula-200 dark:bg-nebula-800"
                )}
            >
                <div className="flex items-center gap-2">
                    <Type size={14} className="text-nebula-500" />
                    <span>{getCurrentSizeLabel()}</span>
                </div>
                <ChevronDown size={12} className="text-nebula-400" />
          </button>

          {/* Font Family Selector */}
          <button 
                ref={fontButtonRef}
                onMouseDown={preventFocusLoss}
                onClick={() => toggleDropdown('font')}
                className={clsx(
                    "flex items-center gap-2 px-2 py-1.5 rounded text-sm font-medium min-w-[90px] justify-between transition-colors border border-transparent mr-2",
                    "hover:bg-nebula-200 dark:hover:bg-nebula-800 text-nebula-700 dark:text-nebula-200 hover:border-nebula-200 dark:hover:border-nebula-700 cursor-pointer",
                    showFontSelect && "bg-nebula-200 dark:bg-nebula-800"
                )}
            >
                <div className="flex items-center gap-2">
                    <AArrowUp size={14} className="text-nebula-500" />
                    <span>{currentFontName}</span>
                </div>
                <ChevronDown size={12} className="text-nebula-400" />
          </button>
          
          <div className="w-px h-5 bg-nebula-200 dark:bg-nebula-700 mx-1" />

          {/* Text Styles */}
          <div className="flex items-center gap-0.5">
             <button onMouseDown={preventFocusLoss} onClick={() => execCmd('bold')} className={clsx("p-1.5 rounded transition-colors", activeFormats.includes('bold') ? "bg-nebula-200 dark:bg-nebula-700 text-nebula-900 dark:text-white" : "text-nebula-600 dark:text-nebula-400 hover:bg-nebula-200 dark:hover:bg-nebula-800")} title="Bold"><Bold size={16}/></button>
             <button onMouseDown={preventFocusLoss} onClick={() => execCmd('italic')} className={clsx("p-1.5 rounded transition-colors", activeFormats.includes('italic') ? "bg-nebula-200 dark:bg-nebula-700 text-nebula-900 dark:text-white" : "text-nebula-600 dark:text-nebula-400 hover:bg-nebula-200 dark:hover:bg-nebula-800")} title="Italic"><Italic size={16}/></button>
             <button onMouseDown={preventFocusLoss} onClick={() => execCmd('underline')} className={clsx("p-1.5 rounded transition-colors", activeFormats.includes('underline') ? "bg-nebula-200 dark:bg-nebula-700 text-nebula-900 dark:text-white" : "text-nebula-600 dark:text-nebula-400 hover:bg-nebula-200 dark:hover:bg-nebula-800")} title="Underline"><Underline size={16}/></button>
          </div>

          <div className="w-px h-5 bg-nebula-200 dark:bg-nebula-700 mx-1" />

          {/* Lists */}
          <div className="flex items-center gap-0.5">
             <button onMouseDown={preventFocusLoss} onClick={() => execCmd('insertUnorderedList')} className={clsx("p-1.5 rounded transition-colors", activeFormats.includes('insertUnorderedList') ? "bg-nebula-200 dark:bg-nebula-700 text-nebula-900 dark:text-white" : "text-nebula-600 dark:text-nebula-400 hover:bg-nebula-200 dark:hover:bg-nebula-800")} title="Bullet List"><List size={16}/></button>
             <button onMouseDown={preventFocusLoss} onClick={() => execCmd('insertOrderedList')} className={clsx("p-1.5 rounded transition-colors", activeFormats.includes('insertOrderedList') ? "bg-nebula-200 dark:bg-nebula-700 text-nebula-900 dark:text-white" : "text-nebula-600 dark:text-nebula-400 hover:bg-nebula-200 dark:hover:bg-nebula-800")} title="Numbered List"><ListOrdered size={16}/></button>
          </div>

          <div className="w-px h-5 bg-nebula-200 dark:bg-nebula-700 mx-1" />

          {/* Alignment */}
          <div className="flex items-center gap-0.5">
             <button onMouseDown={preventFocusLoss} onClick={() => execCmd('justifyLeft')} className={clsx("p-1.5 rounded transition-colors", activeFormats.includes('justifyLeft') ? "bg-nebula-200 dark:bg-nebula-700 text-nebula-900 dark:text-white" : "text-nebula-600 dark:text-nebula-400 hover:bg-nebula-200 dark:hover:bg-nebula-800")} title="Align Left"><AlignLeft size={16}/></button>
             <button onMouseDown={preventFocusLoss} onClick={() => execCmd('justifyCenter')} className={clsx("p-1.5 rounded transition-colors", activeFormats.includes('justifyCenter') ? "bg-nebula-200 dark:bg-nebula-700 text-nebula-900 dark:text-white" : "text-nebula-600 dark:text-nebula-400 hover:bg-nebula-200 dark:hover:bg-nebula-800")} title="Align Center"><AlignCenter size={16}/></button>
          </div>

          <div className="w-px h-5 bg-nebula-200 dark:bg-nebula-700 mx-1" />

          {/* Colors */}
          <div className="flex items-center gap-2 px-2">
             <div className="relative group cursor-pointer" onMouseDown={preventFocusLoss}>
                <input 
                    type="color" 
                    onChange={(e) => { execCmd('foreColor', e.target.value); }} 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    title="Pick any color"
                />
                <div className="p-1.5 bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 rounded text-white shadow-sm group-hover:scale-105 transition-transform">
                    <Palette size={16} />
                </div>
             </div>
             
             {['#1e293b', '#ef4444', '#f59e0b', '#22c55e', '#3b82f6'].map(color => (
                 <button 
                    key={color}
                    onMouseDown={preventFocusLoss}
                    onClick={() => execCmd('foreColor', color)}
                    className="w-4 h-4 rounded-full border border-nebula-200 hover:scale-110 transition-transform shadow-sm"
                    style={{ backgroundColor: color }}
                    title={color}
                 />
             ))}
          </div>
      </div>

      {/* Main Editor Area */}
      <main 
          className="flex-1 overflow-y-auto relative custom-scrollbar cursor-text bg-white dark:bg-nebula-950" 
          onClick={(e) => {
              // Only focus editor if clicking the empty background
              if (e.target === e.currentTarget) {
                  contentRef.current?.focus();
              }
          }}
      >
          <div className="w-full mx-auto py-12 px-12 min-h-full">
                {/* Rich Text Title */}
                <div
                    ref={titleRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={handleInput}
                    onKeyDown={handleTitleKeyDown}
                    onFocus={() => { setIsTitleFocused(true); updateToolbarState(); }}
                    onBlur={() => { setIsTitleFocused(false); }}
                    onKeyUp={updateToolbarState}
                    onMouseUp={updateToolbarState}
                    className="w-full text-4xl font-bold text-nebula-900 dark:text-white bg-transparent outline-none mb-6 transition-colors empty:before:content-[attr(placeholder)] empty:before:text-nebula-300 dark:empty:before:text-nebula-700"
                    placeholder="Untitled Page"
                    spellCheck={false}
                />
                
                {/* Body Content */}
                <div
                    ref={contentRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={handleInput}
                    onFocus={updateToolbarState}
                    onKeyUp={updateToolbarState}
                    onMouseUp={updateToolbarState}
                    className="outline-none min-h-[50vh] text-nebula-800 dark:text-nebula-100 prose prose-lg max-w-none dark:prose-invert prose-headings:font-bold prose-p:my-2 prose-headings:my-4 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 empty:before:content-[attr(data-placeholder)] empty:before:text-nebula-300 dark:empty:before:text-nebula-700"
                    data-placeholder="Type '/' for commands"
                />
                
                {/* Bottom spacer for comfort */}
                <div className="h-32" />
          </div>
      </main>

      {/* DROPDOWNS RENDERED AT ROOT TO AVOID CLIPPING */}
      {showSizeSelect && (
        <>
            <div className="fixed inset-0 z-[100]" onClick={() => setShowSizeSelect(false)} />
            <div 
                className="fixed w-48 bg-white dark:bg-nebula-800 rounded-lg shadow-xl border border-nebula-200 dark:border-nebula-600 py-1 z-[101] flex flex-col ring-1 ring-black/5"
                style={{ top: dropdownPos.top, left: dropdownPos.left }}
            >
                {FONT_SIZES.map(size => (
                    <button 
                        key={size.value}
                        onMouseDown={preventFocusLoss} 
                        onClick={() => handleFormatting('fontSize', size.value)} 
                        className="px-3 py-2 text-left hover:bg-nebula-100 dark:hover:bg-nebula-700/50 text-sm text-nebula-700 dark:text-nebula-200 flex items-center justify-between"
                    >
                        <span>{size.label}</span>
                        {currentFontSize === size.value && <Check size={14} className="text-accent-500" />}
                    </button>
                ))}
            </div>
        </>
      )}

      {showFontSelect && (
        <>
            <div className="fixed inset-0 z-[100]" onClick={() => setShowFontSelect(false)} />
            <div 
                className="fixed w-40 bg-white dark:bg-nebula-800 rounded-lg shadow-xl border border-nebula-200 dark:border-nebula-600 py-1 z-[101] flex flex-col ring-1 ring-black/5"
                style={{ top: dropdownPos.top, left: dropdownPos.left }}
            >
                {FONT_FAMILIES.map(font => (
                    <button 
                        key={font.value}
                        onMouseDown={preventFocusLoss} 
                        onClick={() => handleFormatting('fontName', font.value)} 
                        className="px-3 py-2 text-left hover:bg-nebula-100 dark:hover:bg-nebula-700/50 text-sm text-nebula-700 dark:text-nebula-200 flex items-center justify-between font-medium"
                        style={{ fontFamily: font.value }}
                    >
                        <span>{font.label}</span>
                        {currentFontName === font.label && <Check size={14} className="text-accent-500" />}
                    </button>
                ))}
            </div>
        </>
      )}

    </div>
  );
};