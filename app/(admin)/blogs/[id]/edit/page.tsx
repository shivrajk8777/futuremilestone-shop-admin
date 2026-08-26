'use client';

import { useEffect, useState, use } from 'react';
import BlogForm from '../../BlogForm';

export interface EditBlogPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditBlogPage({ params }: EditBlogPageProps) {
  const { id } = use(params);
  const [blog, setBlog] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/blogs/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) setBlog(data.blog);
        else setError('Blog not found');
      })
      .catch(() => setError('Failed to load blog'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg className="animate-spin h-6 w-6 text-futuremilestone-muted" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-red-500 font-semibold">{error || 'Blog not found'}</p>
      </div>
    );
  }

  return <BlogForm blog={blog} isEdit />;
}
