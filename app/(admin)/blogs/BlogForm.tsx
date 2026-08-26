'use client';

import { useState, useRef, useEffect, ReactNode, FormEvent, ChangeEvent, DragEvent } from 'react';
import { useRouter } from 'next/navigation';

function SpinnerIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3.5" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

function CloudUploadIcon({ className = '' }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
      <path d="M12 12v9" />
      <path d="m16 16-4-4-4 4" />
    </svg>
  );
}

interface ToolbarBtnProps {
  title: string;
  onClick: () => void;
  active?: boolean;
  children: ReactNode;
}

function ToolbarBtn({ title, onClick, active, children }: ToolbarBtnProps) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      className={`px-2.5 py-1.5 rounded-lg text-[13px] font-semibold transition-all cursor-pointer select-none ${active ? 'bg-futuremilestone-accent text-futuremilestone-bg shadow-sm' : 'text-futuremilestone-ink hover:bg-futuremilestone-accent/10'}`}
    >
      {children}
    </button>
  );
}

export interface BlogFormProps {
  blog?: any;
  isEdit?: boolean;
}

export default function BlogForm({ blog, isEdit = false }: BlogFormProps) {
  const router = useRouter();

  const [form, setForm] = useState({
    title:    blog?.title    ?? '',
    summary:  blog?.summary  ?? '',
    content:  blog?.content  ?? '',
    image:    blog?.image    ?? '',
    category: blog?.category ?? '',
    readTime: blog?.readTime ?? '5 min read',
  });

  const [collections, setCollections] = useState<any[]>([]);

  const [saving, setSaving]           = useState(false);
  const [uploading, setUploading]     = useState(false);
  const [isDragging, setIsDragging]   = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [saveError, setSaveError]     = useState('');

  const imageInputRef = useRef<HTMLInputElement>(null);
  const editorRef     = useRef<HTMLDivElement>(null);

  // Sync initial content + fetch collections on mount
  useEffect(() => {
    if (editorRef.current && form.content) {
      editorRef.current.innerHTML = form.content;
    }
    // Fetch collections from local admin api
    fetch('/api/collections')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.collections?.length > 0) {
          setCollections(data.collections);
          // Set default if not already set
          setForm(f => ({ ...f, category: f.category || data.collections[0].name }));
        } else {
          setCollections([
            { id: 'design', name: 'Design' },
            { id: 'craftsmanship', name: 'Craftsmanship' },
            { id: 'sustainability', name: 'Sustainability' },
            { id: 'lifestyle', name: 'Lifestyle' },
          ]);
        }
      })
      .catch(() => {
        setCollections([
          { id: 'design', name: 'Design' },
          { id: 'craftsmanship', name: 'Craftsmanship' },
          { id: 'sustainability', name: 'Sustainability' },
          { id: 'lifestyle', name: 'Lifestyle' },
        ]);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateField(field: string, value: any) {
    setForm(f => ({ ...f, [field]: value }));
  }

  // ── Cloudinary upload ──────────────────────────────────────────────────

  async function uploadImage(file?: File) {
    if (!file || !file.type.startsWith('image/')) return;
    setUploadError('');
    setUploading(true);
    try {
      const signRes = await fetch(`/api/cloudinary/sign-blog`, { method: 'POST' });
      if (!signRes.ok) throw new Error('Could not prepare upload');
      const { apiKey, cloudName, folder, signature, timestamp } = await signRes.json();

      const fd = new FormData();
      fd.append('file', file);
      fd.append('api_key', apiKey);
      fd.append('folder', folder);
      fd.append('signature', signature);
      fd.append('timestamp', String(timestamp));

      const upRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: fd });
      if (!upRes.ok) throw new Error('Upload failed');
      const result = await upRes.json();
      updateField('image', result.secure_url);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) await uploadImage(file);
    e.target.value = '';
  }

  async function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await uploadImage(file);
  }

  // ── WYSIWYG toolbar commands ───────────────────────────────────────────

  function execCmd(cmd: string, value: string | null = null) {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value ?? undefined);
    syncContent();
  }

  function insertHTML(html: string) {
    editorRef.current?.focus();
    document.execCommand('insertHTML', false, html);
    syncContent();
  }

  function syncContent() {
    if (editorRef.current) {
      updateField('content', editorRef.current.innerHTML);
    }
  }

  function queryCmd(cmd: string) {
    try { return document.queryCommandState(cmd); } catch { return false; }
  }

  // ── Save / Update ──────────────────────────────────────────────────────

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaveError('');
    if (!form.title.trim()) { setSaveError('Title is required.'); return; }
    if (!editorRef.current?.innerHTML?.trim()) { setSaveError('Content is required.'); return; }

    const payload = { ...form, content: editorRef.current.innerHTML };

    setSaving(true);
    try {
      let res: Response;
      if (isEdit && blog?.id) {
        res = await fetch(`/api/blogs/${blog.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/blogs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      const data = await res.json();
      if (data.success) {
        router.push('/blogs');
      } else {
        setSaveError(data.error || 'Failed to save blog');
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  const inputClass = 'w-full border border-futuremilestone-ink/10 rounded-[18px] bg-futuremilestone-input-bg px-[18px] py-4 text-futuremilestone-ink outline-none transition-all duration-[160ms] focus:border-futuremilestone-ink/25 focus:ring-4 focus:ring-futuremilestone-ink/6 text-[14px]';

  return (
    <form onSubmit={handleSubmit} className="grid gap-3">
      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-futuremilestone-muted mb-1">Content</p>
          <h1 className="text-[28px] font-bold tracking-[-0.05em] text-futuremilestone-ink">
            {isEdit ? 'Edit Post' : 'Write Post'}
          </h1>
          <p className="text-futuremilestone-muted text-[14px] mt-1">
            {isEdit ? 'Update your blog post details and content.' : 'Create a new blog post for the Futuremilestone website.'}
          </p>
        </div>
        <button
          type="submit"
          disabled={saving || uploading}
          className="rounded-full px-6 py-3 bg-futuremilestone-accent text-futuremilestone-bg font-semibold text-[14px] hover:bg-opacity-90 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60 flex items-center gap-2 whitespace-nowrap"
        >
          {saving ? <><SpinnerIcon className="h-4 w-4" /> Saving...</> : (isEdit ? 'Update Post' : 'Publish Post')}
        </button>
      </div>

      {/* Error banner */}
      {(saveError || uploadError) && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-[18px] px-5 py-3.5 text-[13px] font-medium">
          {saveError || uploadError}
        </div>
      )}

      {/* ── Cover Image ─────────────────────────────────────────────────── */}
      <section className="p-[18px] sm:p-[22px] bg-futuremilestone-panel/72 border border-futuremilestone-soft-line backdrop-blur-[14px] rounded-[32px] shadow-futuremilestone-soft">
        <div className="mb-[18px]">
          <h2 className="text-[20px] font-bold tracking-[-0.05em]">Cover Image</h2>
          <p className="text-futuremilestone-muted text-[14px] mt-1">Upload a high-quality cover image for the blog post.</p>
        </div>

        <input accept="image/*" className="hidden" id="blogImageUpload" onChange={handleImageChange} ref={imageInputRef} type="file" disabled={uploading} />

        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && imageInputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center min-h-[220px] rounded-[24px] border-2 border-dashed p-6 transition-all duration-300 cursor-pointer overflow-hidden ${isDragging ? 'border-futuremilestone-accent bg-futuremilestone-accent/5 scale-[0.99]' : 'border-futuremilestone-line bg-futuremilestone-panel/40 hover:border-futuremilestone-accent/40 hover:bg-futuremilestone-panel/60'}`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-3 animate-pulse">
              <SpinnerIcon className="w-6 h-6 text-futuremilestone-accent" />
              <span className="text-futuremilestone-ink font-medium text-[13px]">Uploading image...</span>
            </div>
          ) : form.image ? (
            <div className="absolute inset-0 w-full h-full group">
              <img alt="Cover" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" src={form.image} />
              <div className="absolute inset-0 bg-futuremilestone-ink/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4 backdrop-blur-[2px]">
                <button type="button" onClick={(e) => { e.stopPropagation(); imageInputRef.current?.click(); }} className="px-4 py-2 bg-white text-futuremilestone-ink rounded-full text-[13px] font-semibold hover:bg-futuremilestone-accent hover:text-white transition">Change image</button>
                <button type="button" onClick={(e) => { e.stopPropagation(); updateField('image', ''); }} className="w-9 h-9 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-lg transition">✕</button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center gap-3 group">
              <div className="w-12 h-12 rounded-2xl bg-futuremilestone-accent/10 text-futuremilestone-accent flex items-center justify-center transition-all group-hover:scale-110 group-hover:bg-futuremilestone-accent group-hover:text-white">
                <CloudUploadIcon className="w-6 h-6" />
              </div>
              <p className="text-[14px] font-semibold text-futuremilestone-ink m-0">Drag & drop or <span className="text-futuremilestone-accent underline font-bold">browse</span></p>
              <p className="text-[12px] text-futuremilestone-muted m-0">Supports JPG, PNG, WEBP</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Meta Fields ─────────────────────────────────────────────────── */}
      <section className="p-[18px] sm:p-[22px] bg-futuremilestone-panel/72 border border-futuremilestone-soft-line backdrop-blur-[14px] rounded-[32px] shadow-futuremilestone-soft">
        <div className="mb-[18px]">
          <h2 className="text-[20px] font-bold tracking-[-0.05em]">Post Details</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2.5 md:col-span-2">
            <label className="text-[14px] font-semibold">Title *</label>
            <input value={form.title} onChange={e => updateField('title', e.target.value)} placeholder="e.g. 5 Ways Interior Design Transforms Your Space" className={inputClass} />
          </div>
          <div className="grid gap-2.5 md:col-span-2">
            <label className="text-[14px] font-semibold">Summary / Excerpt</label>
            <textarea value={form.summary} onChange={e => updateField('summary', e.target.value)} rows={3} placeholder="A short description shown in blog listings and search results..." className={inputClass} />
          </div>
          <div className="grid gap-2.5">
            <label className="text-[14px] font-semibold">Collection</label>
            <select value={form.category} onChange={e => updateField('category', e.target.value)} className={inputClass}>
              <option value="">Select a collection</option>
              {collections.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid gap-2.5">
            <label className="text-[14px] font-semibold">Read Time</label>
            <input value={form.readTime} onChange={e => updateField('readTime', e.target.value)} placeholder="e.g. 5 min read" className={inputClass} />
          </div>
        </div>
      </section>

      {/* ── WYSIWYG Content Editor ──────────────────────────────────────── */}
      <section className="p-[18px] sm:p-[22px] bg-futuremilestone-panel/72 border border-futuremilestone-soft-line backdrop-blur-[14px] rounded-[32px] shadow-futuremilestone-soft">
        <div className="mb-[18px]">
          <h2 className="text-[20px] font-bold tracking-[-0.05em]">Content *</h2>
          <p className="text-futuremilestone-muted text-[14px] mt-1">Write the full blog article. Use the toolbar to format text.</p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-1 p-2 bg-futuremilestone-panel-strong rounded-[16px] border border-futuremilestone-soft-line mb-3">
          {/* Text style */}
          <ToolbarBtn title="Bold" onClick={() => execCmd('bold')} active={queryCmd('bold')}><strong>B</strong></ToolbarBtn>
          <ToolbarBtn title="Italic" onClick={() => execCmd('italic')} active={queryCmd('italic')}><em>I</em></ToolbarBtn>
          <ToolbarBtn title="Underline" onClick={() => execCmd('underline')} active={queryCmd('underline')}><u>U</u></ToolbarBtn>
          <ToolbarBtn title="Strikethrough" onClick={() => execCmd('strikeThrough')} active={queryCmd('strikeThrough')}><s>S</s></ToolbarBtn>

          <span className="w-px h-6 bg-futuremilestone-soft-line mx-1" />

          {/* Headings */}
          <ToolbarBtn title="Heading 2" onClick={() => execCmd('formatBlock', '<h2>')}>H2</ToolbarBtn>
          <ToolbarBtn title="Heading 3" onClick={() => execCmd('formatBlock', '<h3>')}>H3</ToolbarBtn>
          <ToolbarBtn title="Paragraph" onClick={() => execCmd('formatBlock', '<p>')}>¶</ToolbarBtn>

          <span className="w-px h-6 bg-futuremilestone-soft-line mx-1" />

          {/* Lists */}
          <ToolbarBtn title="Bullet list" onClick={() => execCmd('insertUnorderedList')} active={queryCmd('insertUnorderedList')}>• List</ToolbarBtn>
          <ToolbarBtn title="Numbered list" onClick={() => execCmd('insertOrderedList')} active={queryCmd('insertOrderedList')}>1. List</ToolbarBtn>

          <span className="w-px h-6 bg-futuremilestone-soft-line mx-1" />

          {/* Alignment */}
          <ToolbarBtn title="Align left" onClick={() => execCmd('justifyLeft')} active={queryCmd('justifyLeft')}>Left</ToolbarBtn>
          <ToolbarBtn title="Align center" onClick={() => execCmd('justifyCenter')} active={queryCmd('justifyCenter')}>Center</ToolbarBtn>

          <span className="w-px h-6 bg-futuremilestone-soft-line mx-1" />

          {/* Link */}
          <ToolbarBtn title="Insert link" onClick={() => {
            const url = prompt('Enter URL:');
            if (url) execCmd('createLink', url);
          }}>🔗</ToolbarBtn>

          {/* Blockquote */}
          <ToolbarBtn title="Blockquote" onClick={() => insertHTML('<blockquote style="border-left: 4px solid #ccc; padding-left: 16px; margin: 16px 0; color: #555;"></blockquote>')}>❝</ToolbarBtn>

          {/* Clear */}
          <ToolbarBtn title="Remove formatting" onClick={() => execCmd('removeFormat')}>✕ Format</ToolbarBtn>
        </div>

        {/* Editor */}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={syncContent}
          onBlur={syncContent}
          className="min-h-[320px] rounded-[18px] border border-futuremilestone-ink/10 bg-futuremilestone-input-bg px-6 py-5 text-futuremilestone-ink text-[14px] leading-relaxed outline-none focus:border-futuremilestone-ink/25 focus:ring-4 focus:ring-futuremilestone-ink/6 transition-all prose prose-sm max-w-none
            [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-5 [&_h2]:mb-2
            [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mt-4 [&_h3]:mb-2
            [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5
            [&_a]:text-futuremilestone-accent [&_a]:underline
            [&_blockquote]:border-l-4 [&_blockquote]:border-futuremilestone-line [&_blockquote]:pl-4 [&_blockquote]:text-futuremilestone-muted"
        />
        <p className="text-[11px] text-futuremilestone-muted mt-2">The content will be rendered as HTML on the blog page. Use the toolbar to format your text.</p>
      </section>
    </form>
  );
}
