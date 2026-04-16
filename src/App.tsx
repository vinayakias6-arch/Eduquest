import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Search, 
  ShoppingCart, 
  User, 
  FileText, 
  MessageSquare, 
  LayoutDashboard, 
  LogOut, 
  Plus, 
  Star, 
  ChevronRight,
  TrendingUp,
  Package,
  Upload,
  BrainCircuit,
  Menu,
  X
} from 'lucide-react';
import { auth, googleProvider, signInWithPopup, signOut, db, collection, onSnapshot, query, orderBy, addDoc, serverTimestamp } from './firebase';
import { useAuth } from './contexts/AuthContext';
import { cn, formatCurrency } from './lib/utils';
import { generateQuestionsFromText } from './services/geminiService';

// --- Components ---

const Sidebar = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: string) => void }) => {
  const { isAdmin } = useAuth();

  const navItems = [
    { id: 'browse', label: 'Marketplace', icon: BookOpen },
    { id: 'exams', label: 'Question Bank', icon: FileText },
    { id: 'forum', label: 'Discussions', icon: MessageSquare },
    ...(isAdmin ? [
      { id: 'admin', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'inventory', label: 'Inventory Mgmt', icon: Package },
      { id: 'sales', label: 'Sales Reports', icon: TrendingUp }
    ] : []),
  ];

  return (
    <aside className="w-60 bg-sidebar-bg text-white flex flex-col h-screen sticky top-0 shrink-0">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="bg-primary-light p-1.5 rounded-lg">
            <BookOpen className="text-white w-5 h-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-primary-light">LUMINA ACADEMIX</span>
        </div>
        
        <nav className="space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all rounded-lg",
                activeTab === item.id 
                  ? "bg-primary-light/15 text-white border-l-4 border-primary-light" 
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>
      </div>
      
      <div className="mt-auto p-6 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-light/20 flex items-center justify-center text-primary-light font-bold text-xs">
            ?
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold truncate">Help Center</p>
            <p className="text-[10px] text-slate-500 truncate">Support & Docs</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

const Header = () => {
  const { user, profile } = useAuth();

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = () => signOut(auth);

  return (
    <header className="h-16 bg-white border-b border-border-color flex items-center justify-between px-8 shrink-0">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
        <input 
          type="text" 
          placeholder="Search textbooks, PDFs, or discussions..."
          className="bg-bg-main border-none rounded-lg py-2 pl-10 pr-4 w-80 text-sm outline-none focus:ring-1 focus:ring-primary-light transition-all"
        />
      </div>

      <div className="flex items-center gap-6">
        {user ? (
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-bold text-text-dark">{profile?.displayName}</p>
              <p className="text-[11px] text-text-muted uppercase tracking-wider font-semibold">{profile?.role} Portal</p>
            </div>
            <div className="relative group">
              <img 
                src={profile?.photoURL} 
                alt="Profile" 
                className="w-9 h-9 rounded-full border border-border-color cursor-pointer"
                referrerPolicy="no-referrer"
              />
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-border-color rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 p-2">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button 
            onClick={handleLogin}
            className="bg-primary-light text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-primary transition-all shadow-sm"
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
};

// --- Views ---

const BrowseView = () => {
  const [textbooks, setTextbooks] = useState<any[]>([]);
  const { isAdmin } = useAuth();

  useEffect(() => {
    const q = query(collection(db, 'textbooks'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      setTextbooks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-text-dark">Active Marketplace</h2>
        {isAdmin && (
          <button className="bg-primary-light text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-primary transition-all flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Upload New Textbook
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
        {textbooks.map((book) => (
          <div 
            key={book.id}
            className="bg-white border border-border-color rounded-xl overflow-hidden hover:shadow-md transition-all group"
          >
            <div className="h-40 bg-slate-100 flex items-center justify-center relative overflow-hidden">
              <img 
                src={book.coverUrl || `https://picsum.photos/seed/${book.id}/400/600`} 
                alt={book.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold text-primary-light uppercase">
                {book.category}
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-sm text-text-dark line-clamp-1 mb-1">{book.title}</h3>
              <p className="text-xs text-text-muted mb-3">{book.author}</p>
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-primary-light">{formatCurrency(book.price)}</span>
                <span className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded uppercase",
                  book.stock > 10 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                )}>
                  Stock: {book.stock}
                </span>
              </div>
            </div>
          </div>
        ))}
        
        {/* Mock items to fill space if empty */}
        {textbooks.length === 0 && [1,2,3].map(i => (
          <div key={i} className="bg-white border border-border-color rounded-xl overflow-hidden opacity-50">
            <div className="h-40 bg-slate-100 flex items-center justify-center text-xs text-text-muted">
              Sample Textbook {i}
            </div>
            <div className="p-4 space-y-2">
              <div className="h-4 bg-slate-100 rounded w-3/4" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
              <div className="flex justify-between pt-2">
                <div className="h-4 bg-slate-100 rounded w-1/4" />
                <div className="h-3 bg-slate-100 rounded w-1/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ExamsView = () => {
  const [papers, setPapers] = useState<any[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<any>(null);

  useEffect(() => {
    const q = query(collection(db, 'examPapers'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      setPapers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, []);

  if (selectedPaper) {
    return (
      <div className="max-w-4xl space-y-6">
        <button 
          onClick={() => setSelectedPaper(null)}
          className="text-primary-light text-sm font-bold flex items-center gap-2 hover:underline"
        >
          ← Back to Question Bank
        </button>
        
        <div className="bg-white p-8 rounded-2xl border border-border-color shadow-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-text-dark">{selectedPaper.title}</h2>
            <p className="text-sm text-text-muted">{selectedPaper.examType} • {selectedPaper.questions?.length} Questions</p>
          </div>

          <div className="space-y-8">
            {selectedPaper.questions?.map((q: any, idx: number) => (
              <div key={idx} className="space-y-4 pb-8 border-b border-border-color last:border-0">
                <p className="font-bold text-text-dark">Question {idx + 1}</p>
                <p className="text-text-dark leading-relaxed">{q.question}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {q.options.map((opt: string, i: number) => (
                    <button key={i} className="text-left p-4 rounded-xl border border-border-color hover:border-primary-light hover:bg-primary-light/5 transition-all text-sm font-medium">
                      {opt}
                    </button>
                  ))}
                </div>
                <details className="group">
                  <summary className="text-xs font-bold text-primary-light cursor-pointer list-none flex items-center gap-2 uppercase tracking-wider">
                    <ChevronRight className="w-3 h-3 group-open:rotate-90 transition-transform" />
                    Reveal Answer & Explanation
                  </summary>
                  <div className="mt-4 p-5 bg-emerald-50 rounded-xl border border-emerald-100 text-sm">
                    <p className="font-bold text-emerald-800 mb-2">Correct Answer: {q.correctAnswer}</p>
                    <p className="text-emerald-700 leading-relaxed">{q.explanation}</p>
                  </div>
                </details>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-text-dark">AI Question Bank</h2>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-text-muted">
          <BrainCircuit className="w-3 h-3" />
          Powered by Gemini AI
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {papers.map((paper) => (
          <div 
            key={paper.id}
            onClick={() => setSelectedPaper(paper)}
            className="bg-white p-6 rounded-xl border border-border-color shadow-sm hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="bg-slate-100 w-10 h-10 rounded-lg flex items-center justify-center group-hover:bg-primary-light transition-colors">
                <FileText className="text-primary-light group-hover:text-white w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded uppercase">
                Ready
              </span>
            </div>
            <h3 className="font-bold text-text-dark mb-1">{paper.title}</h3>
            <p className="text-xs text-text-muted mb-6">{paper.examType}</p>
            <div className="flex items-center justify-between pt-4 border-t border-border-color">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                {paper.questions?.length || 0} Questions
              </span>
              <span className="text-primary-light text-xs font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Start Solving <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AdminView = () => {
  const [activeSubTab, setActiveSubTab] = useState('inventory');
  const [isUploading, setIsUploading] = useState(false);
  const [newBook, setNewBook] = useState({ title: '', author: '', price: '', stock: '', category: '' });
  const [newPaper, setNewPaper] = useState({ title: '', examType: '', pdfText: '' });

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    await addDoc(collection(db, 'textbooks'), {
      ...newBook,
      price: parseFloat(newBook.price),
      stock: parseInt(newBook.stock),
      ownerUid: currentUser.uid,
      rating: 0,
      reviewCount: 0,
      createdAt: serverTimestamp()
    });
    setNewBook({ title: '', author: '', price: '', stock: '', category: '' });
  };

  const handleUploadPaper = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    try {
      const questions = await generateQuestionsFromText(newPaper.pdfText);
      await addDoc(collection(db, 'examPapers'), {
        title: newPaper.title,
        examType: newPaper.examType,
        pdfUrl: 'dummy-url',
        questions,
        createdAt: serverTimestamp()
      });
      setNewPaper({ title: '', examType: '', pdfText: '' });
      alert('Paper processed and added successfully!');
    } catch (error) {
      console.error(error);
      alert('Failed to process paper.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
      <div className="xl:col-span-2 space-y-8">
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-text-dark">Inventory Management</h2>
          </div>
          <div className="bg-white p-6 rounded-xl border border-border-color shadow-sm">
            <form onSubmit={handleAddBook} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Book Title</label>
                <input 
                  className="w-full bg-bg-main border-none rounded-lg p-3 text-sm outline-none focus:ring-1 focus:ring-primary-light"
                  value={newBook.title}
                  onChange={e => setNewBook({...newBook, title: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Author</label>
                <input 
                  className="w-full bg-bg-main border-none rounded-lg p-3 text-sm outline-none focus:ring-1 focus:ring-primary-light"
                  value={newBook.author}
                  onChange={e => setNewBook({...newBook, author: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Price (INR)</label>
                <input 
                  type="number" 
                  className="w-full bg-bg-main border-none rounded-lg p-3 text-sm outline-none focus:ring-1 focus:ring-primary-light"
                  value={newBook.price}
                  onChange={e => setNewBook({...newBook, price: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Stock Units</label>
                <input 
                  type="number" 
                  className="w-full bg-bg-main border-none rounded-lg p-3 text-sm outline-none focus:ring-1 focus:ring-primary-light"
                  value={newBook.stock}
                  onChange={e => setNewBook({...newBook, stock: e.target.value})}
                  required
                />
              </div>
              <button className="md:col-span-2 bg-primary-light text-white py-3 rounded-lg font-bold hover:bg-primary transition-all shadow-sm mt-2">
                Add to Inventory
              </button>
            </form>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-text-dark">AI PDF Extraction Queue</h2>
          </div>
          <div className="bg-white rounded-xl border border-border-color shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border-color bg-slate-50/50">
              <form onSubmit={handleUploadPaper} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input 
                    placeholder="Exam Title" 
                    className="bg-white border border-border-color rounded-lg p-3 text-sm outline-none focus:ring-1 focus:ring-primary-light"
                    value={newPaper.title}
                    onChange={e => setNewPaper({...newPaper, title: e.target.value})}
                    required
                  />
                  <input 
                    placeholder="Exam Type" 
                    className="bg-white border border-border-color rounded-lg p-3 text-sm outline-none focus:ring-1 focus:ring-primary-light"
                    value={newPaper.examType}
                    onChange={e => setNewPaper({...newPaper, examType: e.target.value})}
                  />
                </div>
                <textarea 
                  placeholder="Paste extracted text from PDF here for AI processing..." 
                  className="w-full h-40 bg-white border border-border-color rounded-lg p-4 text-sm outline-none focus:ring-1 focus:ring-primary-light resize-none"
                  value={newPaper.pdfText}
                  onChange={e => setNewPaper({...newPaper, pdfText: e.target.value})}
                  required
                />
                <button 
                  disabled={isUploading}
                  className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:bg-slate-900 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                >
                  {isUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      AI Processing...
                    </>
                  ) : (
                    <>
                      <BrainCircuit className="w-4 h-4" />
                      Generate Question Bank
                    </>
                  )}
                </button>
              </form>
            </div>
            
            <div className="divide-y divide-border-color">
              <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div>
                  <p className="text-sm font-bold text-text-dark">GATE_CS_2023_Original.pdf</p>
                  <p className="text-[11px] text-text-muted">Extracted 120 Questions from 45 Pages</p>
                </div>
                <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded uppercase">Completed</span>
              </div>
              <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div>
                  <p className="text-sm font-bold text-text-dark">NEET_Physics_Bulk_Set.pdf</p>
                  <p className="text-[11px] text-text-muted">Mapping images to OCR text...</p>
                </div>
                <span className="text-[9px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded uppercase">Decoding (72%)</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-bold text-text-dark mb-4">Sales Overview</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-primary p-5 rounded-xl text-white shadow-sm">
              <p className="text-[10px] font-bold opacity-70 uppercase tracking-wider mb-1">Monthly Revenue</p>
              <p className="text-xl font-bold">{formatCurrency(12450)}</p>
            </div>
            <div className="bg-slate-800 p-5 rounded-xl text-white shadow-sm">
              <p className="text-[10px] font-bold opacity-70 uppercase tracking-wider mb-1">Textbooks Sold</p>
              <p className="text-xl font-bold">342</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text-dark mb-4">Top Rated Books</h2>
          <div className="bg-white p-4 rounded-xl border border-border-color shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text-dark">Advanced Calculus V2</span>
              <span className="text-amber-500 text-xs">★★★★★</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text-dark">Organic Chem Concepts</span>
              <span className="text-amber-500 text-xs">★★★★☆</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text-dark">Modern Macroeconomics</span>
              <span className="text-amber-500 text-xs">★★★★☆</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

const ForumView = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [newPost, setNewPost] = useState({ title: '', content: '' });
  const { user, profile } = useAuth();

  useEffect(() => {
    const q = query(collection(db, 'forumPosts'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, []);

  const handleAddPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    await addDoc(collection(db, 'forumPosts'), {
      ...newPost,
      authorUid: user.uid,
      authorName: profile?.displayName || 'Anonymous',
      createdAt: serverTimestamp(),
      replyCount: 0
    });
    setNewPost({ title: '', content: '' });
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
      <div className="xl:col-span-2 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-text-dark">Discussions</h2>
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
            {posts.length} Active Topics
          </div>
        </div>

        {user && (
          <div className="bg-white p-6 rounded-xl border border-border-color shadow-sm">
            <form onSubmit={handleAddPost} className="space-y-4">
              <input 
                placeholder="Start a new discussion topic..." 
                className="w-full bg-bg-main border-none rounded-lg p-3 text-sm font-bold outline-none focus:ring-1 focus:ring-primary-light"
                value={newPost.title}
                onChange={e => setNewPost({...newPost, title: e.target.value})}
                required
              />
              <textarea 
                placeholder="What would you like to ask or share with the community?" 
                className="w-full h-32 bg-bg-main border-none rounded-lg p-4 text-sm outline-none focus:ring-1 focus:ring-primary-light resize-none"
                value={newPost.content}
                onChange={e => setNewPost({...newPost, content: e.target.value})}
                required
              />
              <button className="bg-primary-light text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-primary transition-all shadow-sm">
                Post Topic
              </button>
            </form>
          </div>
        )}

        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="bg-white p-5 rounded-xl border border-border-color hover:border-primary-light transition-all shadow-sm group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-primary-light font-bold text-xs">
                  {post.authorName[0]}
                </div>
                <div>
                  <p className="text-xs font-bold text-primary-light uppercase tracking-wider">@{post.authorName.toLowerCase().replace(/\s/g, '_')}</p>
                  <p className="text-[10px] text-text-muted">Active recently</p>
                </div>
              </div>
              <h3 className="text-lg font-bold text-text-dark mb-2 group-hover:text-primary-light transition-colors">{post.title}</h3>
              <p className="text-sm text-text-muted line-clamp-2 leading-relaxed mb-4">{post.content}</p>
              <div className="flex items-center gap-4 pt-4 border-t border-border-color">
                <button className="flex items-center gap-2 text-[10px] font-bold text-text-muted hover:text-primary-light transition-colors uppercase tracking-widest">
                  <MessageSquare className="w-3 h-3" />
                  {post.replyCount} Replies
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-bold text-text-dark mb-4">Forum Activity</h2>
          <div className="bg-white p-5 rounded-xl border border-border-color shadow-sm space-y-4">
            <div className="pb-4 border-b border-border-color last:border-0 last:pb-0">
              <p className="text-[11px] font-bold text-primary-light uppercase mb-1">@jenny_lee99</p>
              <p className="text-xs text-text-muted leading-relaxed">Are the answers for the 2022 Math PDF verified? Question 12 seems off.</p>
            </div>
            <div className="pb-4 border-b border-border-color last:border-0 last:pb-0">
              <p className="text-[11px] font-bold text-primary-light uppercase mb-1">@prof_marcus</p>
              <p className="text-xs text-text-muted leading-relaxed">Just uploaded the new Bio-Chemistry workbook. Looking for reviews!</p>
            </div>
            <div className="pb-4 border-b border-border-color last:border-0 last:pb-0">
              <p className="text-[11px] font-bold text-primary-light uppercase mb-1">@study_buddy</p>
              <p className="text-xs text-text-muted leading-relaxed">Looking for a study group for the upcoming NEET exams. Anyone?</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState('browse');
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-main">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 border-4 border-primary-light border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-text-muted text-sm font-bold uppercase tracking-widest animate-pulse">Initializing Lumina Academix...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-bg-main text-text-dark font-sans selection:bg-primary-light/20 selection:text-primary">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        
        <main className="flex-1 p-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'browse' && <BrowseView />}
              {activeTab === 'exams' && <ExamsView />}
              {activeTab === 'forum' && <ForumView />}
              {(activeTab === 'admin' || activeTab === 'inventory' || activeTab === 'sales') && <AdminView />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
