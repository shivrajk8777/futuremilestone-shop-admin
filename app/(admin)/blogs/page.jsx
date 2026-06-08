'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function BlogsPage() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch('http://localhost:3000/api/blogs')
      .then(r => r.json())
      .then(data => {
        if (data.success) setBlogs(data.blogs);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id, title) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await fetch(`http://localhost:3000/api/blogs/${id}`, { method: 'DELETE' });
      setBlogs(prev => prev.filter(b => b.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  const filteredBlogs = blogs.filter((b) =>
    b.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.summary && b.summary.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (b.category && b.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredBlogs.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedBlogs = filteredBlogs.slice(startIndex, startIndex + rowsPerPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-fjord-muted mb-1">Content</p>
          <h1 className="text-[28px] font-bold tracking-[-0.05em] text-fjord-ink">Blogs</h1>
          <p className="text-fjord-muted text-[14px] mt-1">Manage your blog posts — create, edit, and delete articles.</p>
        </div>
        <Link
          href="/blogs/new"
          className="rounded-full px-5 py-3 bg-fjord-accent text-fjord-bg font-semibold text-[14px] hover:bg-opacity-90 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
        >
          + Write post
        </Link>
      </div>

      {/* Table & Controls Section */}
      <section className="bg-fjord-panel-strong border border-fjord-soft-line rounded-[24px] shadow-fjord-soft overflow-hidden">
        {/* Search and Rows controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-b border-fjord-soft-line bg-fjord-bg/20">
          <div className="flex items-center gap-2 text-[13px] text-fjord-muted">
            <span>Show</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-fjord-panel-strong border border-fjord-soft-line rounded-lg px-2.5 py-1 text-fjord-ink font-medium focus:outline-none"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>entries</span>
          </div>
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-fjord-panel-strong border border-fjord-soft-line rounded-full px-4 py-1.5 pl-9 text-[13px] text-fjord-ink placeholder-fjord-muted outline-none focus:border-fjord-ink/20 focus:ring-2 focus:ring-fjord-ink/4 transition-all"
            />
            <svg className="absolute left-3.5 top-2.5 w-4 h-4 text-fjord-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <svg className="animate-spin h-6 w-6 text-fjord-muted" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center px-4">
            <svg className="w-12 h-12 text-fjord-muted/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-fjord-muted text-[14px] font-medium">No blog posts found.</p>
            {blogs.length === 0 && (
              <Link href="/blogs/new" className="text-fjord-accent font-semibold text-[13px] hover:underline">Write a post →</Link>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px] text-left">
                <thead>
                  <tr className="border-b border-fjord-soft-line bg-fjord-bg/10 text-fjord-muted uppercase tracking-wider text-[11px] font-semibold">
                    <th className="px-5 py-3">Title</th>
                    <th className="px-5 py-3 hidden sm:table-cell">Collection</th>
                    <th className="px-5 py-3 hidden md:table-cell">Read Time</th>
                    <th className="px-5 py-3 hidden lg:table-cell">Date</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-fjord-soft-line/60">
                  {paginatedBlogs.map((blog) => (
                    <tr key={blog.id} className="hover:bg-fjord-accent/2 transition-colors animate-fade-in">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          {blog.image ? (
                            <img src={blog.image} alt={blog.title} className="w-9 h-9 rounded-lg object-cover flex-shrink-0 border border-fjord-soft-line" />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-fjord-ink/8 border border-fjord-soft-line grid place-items-center text-fjord-muted text-[10px] flex-shrink-0">No image</div>
                          )}
                          <div>
                            <p className="font-semibold text-fjord-ink line-clamp-1">{blog.title}</p>
                            <p className="text-fjord-muted text-[11px] mt-0.5 line-clamp-1">{blog.summary}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-fjord-muted hidden sm:table-cell capitalize">{blog.category}</td>
                      <td className="px-5 py-3 text-fjord-muted hidden md:table-cell">{blog.readTime}</td>
                      <td className="px-5 py-3 text-fjord-muted hidden lg:table-cell">{blog.date}</td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/blogs/${blog.id}/edit`}
                            className="px-3 py-1.5 rounded-full border border-fjord-line bg-fjord-panel-strong text-fjord-ink text-[12px] font-semibold hover:bg-fjord-accent hover:text-fjord-bg hover:border-fjord-accent transition-all active:scale-[0.97]"
                          >
                            Edit
                          </Link>
                          <a
                            href={`http://localhost:3000/blog/${blog.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-full border border-fjord-line bg-fjord-panel-strong text-fjord-muted text-[12px] font-semibold hover:bg-fjord-ink hover:text-fjord-bg hover:border-fjord-ink transition-all active:scale-[0.97]"
                          >
                            View ↗
                          </a>
                          <button
                            onClick={() => handleDelete(blog.id, blog.title)}
                            disabled={deleting === blog.id}
                            className="px-3 py-1.5 rounded-full border border-red-200 text-red-500 text-[12px] font-semibold hover:bg-red-500 hover:text-fjord-bg hover:border-red-500 transition-all cursor-pointer disabled:opacity-50 active:scale-[0.97]"
                          >
                            {deleting === blog.id ? '...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-fjord-soft-line bg-fjord-bg/10 text-[13px] text-fjord-muted">
              <div>
                Showing {filteredBlogs.length === 0 ? 0 : startIndex + 1} to{" "}
                {Math.min(startIndex + rowsPerPage, filteredBlogs.length)} of {filteredBlogs.length} entries
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                  className="rounded-lg px-3 py-1.5 border border-fjord-line bg-fjord-panel-strong text-fjord-ink font-semibold hover:bg-fjord-accent hover:text-fjord-bg disabled:opacity-40 transition cursor-pointer select-none"
                >
                  Previous
                </button>
                <button
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  className="rounded-lg px-3 py-1.5 border border-fjord-line bg-fjord-panel-strong text-fjord-ink font-semibold hover:bg-fjord-accent hover:text-fjord-bg disabled:opacity-40 transition cursor-pointer select-none"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
