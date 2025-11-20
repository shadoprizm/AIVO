import { FormEvent, useEffect, useMemo, useState } from 'react';
import { BookOpenCheck, Eye, EyeOff, ImageIcon, Loader2, RefreshCw, Save, Trash2, UploadCloud } from 'lucide-react';
import DashboardLayout from '../components/layouts/DashboardLayout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { supabase } from '../lib/supabase';
import { BlogPost } from '../types/database';
import { useAuth } from '../contexts/AuthContext';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface BlogFormState {
  title: string;
  slug: string;
  tags: string;
  excerpt: string;
  content: string;
  authorName: string;
  metaDescription: string;
  coverImageUrl: string;
  imageAuthor: string;
  imageAuthorUrl: string;
  imageSource: string;
  published: boolean;
}

const defaultForm: BlogFormState = {
  title: '',
  slug: '',
  tags: '',
  excerpt: '',
  content: '',
  authorName: 'AIVO Insights',
  metaDescription: '',
  coverImageUrl: '',
  imageAuthor: '',
  imageAuthorUrl: '',
  imageSource: 'Pexels',
  published: false,
};

const quillModules = {
  toolbar: [[{ header: [1, 2, 3, false] }], ['bold', 'italic', 'underline', 'strike'], [{ list: 'ordered' }, { list: 'bullet' }], ['link', 'blockquote', 'code-block'], ['clean']],
};

const quillFormats = ['header', 'bold', 'italic', 'underline', 'strike', 'list', 'bullet', 'link', 'blockquote', 'code-block'];

function generateSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function stripHtml(input: string) {
  return input.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function estimateReadingTime(html: string) {
  if (!html) return 1;
  const words = stripHtml(html).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function parseTags(value: string) {
  return value
    .split(',')
    .map(tag => tag.trim())
    .filter(Boolean);
}

export default function AdminBlog() {
  const { isAdmin } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<BlogFormState>(defaultForm);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [slugLocked, setSlugLocked] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState('');

  useEffect(() => {
    if (isAdmin) {
      fetchPosts();
    }
  }, [isAdmin]);

  const fetchPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch posts:', error);
    } else {
      setPosts(data || []);
    }
    setLoading(false);
  };

  const handleCreateNew = () => {
    setEditingPost(null);
    setForm(defaultForm);
    setSlugLocked(false);
    setStatusMessage('');
    setFormError('');
  };

  const populateForm = (post: BlogPost) => {
    setEditingPost(post);
    setForm({
      title: post.title,
      slug: post.slug,
      tags: (post.tags || []).join(', '),
      excerpt: post.excerpt,
      content: post.content,
      authorName: post.author_name,
      metaDescription: post.meta_description || post.excerpt,
      coverImageUrl: post.cover_image_url || '',
      imageAuthor: post.image_author || '',
      imageAuthorUrl: post.image_author_url || '',
      imageSource: post.image_source || 'Pexels',
      published: post.published,
    });
    setSlugLocked(true);
    setStatusMessage('');
    setFormError('');
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setStatusMessage('');
    setFormError('');

    if (!form.title || !form.slug || !form.content) {
      setFormError('Title, slug, and content are required');
      setSaving(false);
      return;
    }

    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim(),
      excerpt: form.excerpt.trim() || stripHtml(form.content).substring(0, 200),
      content: form.content,
      content_format: 'html',
      author_name: form.authorName.trim() || 'AIVO Insights',
      meta_description: form.metaDescription.trim() || form.excerpt.trim(),
      tags: parseTags(form.tags),
      cover_image_url: form.coverImageUrl || null,
      image_author: form.imageAuthor || null,
      image_author_url: form.imageAuthorUrl || null,
      image_source: form.imageSource || (form.coverImageUrl ? 'Pexels' : null),
      published: form.published,
      reading_time_minutes: estimateReadingTime(form.content),
      published_at: form.published ? new Date().toISOString() : null,
    };

    try {
      if (editingPost) {
        const { data, error } = await supabase
          .from('blog_posts')
          .update({
            ...payload,
            published_at: form.published
              ? editingPost.published_at || new Date().toISOString()
              : null,
          })
          .eq('id', editingPost.id)
          .select()
          .single();

        if (error) throw error;
        setStatusMessage(`Updated "${data.title}"`);
      } else {
        const { data, error } = await supabase
          .from('blog_posts')
          .insert(payload)
          .select()
          .single();

        if (error) throw error;
        setStatusMessage(`Created "${data.title}"`);
        setEditingPost(data);
        setSlugLocked(true);
      }

      await fetchPosts();
    } catch (error) {
      console.error('Failed to save post:', error);
      setFormError(error instanceof Error ? error.message : 'Failed to save post');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (post: BlogPost) => {
    if (!confirm(`Delete post "${post.title}"?`)) return;
    try {
      await supabase.from('blog_posts').delete().eq('id', post.id);
      setStatusMessage(`Deleted "${post.title}"`);
      await fetchPosts();
    } catch (error) {
      console.error('Failed to delete post:', error);
      setFormError('Failed to delete post');
    }
  };

  const togglePublish = async (post: BlogPost) => {
    try {
      const nextPublished = !post.published;
      await supabase
        .from('blog_posts')
        .update({
          published: nextPublished,
          published_at: nextPublished ? new Date().toISOString() : null,
        })
        .eq('id', post.id);
      await fetchPosts();
      setStatusMessage(`${nextPublished ? 'Published' : 'Unpublished'} "${post.title}"`);
    } catch (error) {
      console.error('Failed to toggle publish:', error);
      setFormError('Failed to update publish status');
    }
  };

  const handleTitleChange = (value: string) => {
    setForm(prev => ({ ...prev, title: value }));
    if (!slugLocked) {
      setForm(prev => ({ ...prev, slug: generateSlug(value) }));
    }
  };

  const generateCoverImage = async () => {
    const apiKey = import.meta.env.VITE_PEXELS_API_KEY;
    if (!apiKey) {
      setImageError('Add VITE_PEXELS_API_KEY to your .env to use the image generator.');
      return;
    }

    setImageLoading(true);
    setImageError('');

    const query = form.title || parseTags(form.tags).join(' ') || 'AI visibility';
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&orientation=landscape&per_page=40`;

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: apiKey,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch images from Pexels');
      }

      const data = await response.json();
      const photos = data.photos || [];
      if (!photos.length) {
        throw new Error('No images found for that topic');
      }

      const choice = photos[Math.floor(Math.random() * photos.length)];
      setForm(prev => ({
        ...prev,
        coverImageUrl: choice.src?.large2x || choice.src?.large || choice.src?.original || '',
        imageAuthor: choice.photographer || '',
        imageAuthorUrl: choice.photographer_url || '',
        imageSource: 'Pexels',
      }));
    } catch (error) {
      console.error(error);
      setImageError(error instanceof Error ? error.message : 'Failed to generate image');
    } finally {
      setImageLoading(false);
    }
  };

  const postsByStatus = useMemo(() => {
    return {
      published: posts.filter(post => post.published),
      drafts: posts.filter(post => !post.published),
    };
  }, [posts]);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Blog Management</h1>
            <p className="text-gray-600">Create rich text articles, manage publication state, and assign cover images.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={fetchPosts} className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            <Button onClick={handleCreateNew} className="flex items-center gap-2">
              <BookOpenCheck className="w-4 h-4" />
              New Post
            </Button>
          </div>
        </div>

        {statusMessage && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {statusMessage}
          </div>
        )}
        {formError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {formError}
          </div>
        )}

        <section className="bg-white border border-gray-200 rounded-2xl shadow-sm">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Published Posts</h2>
            <span className="text-sm text-gray-500">{postsByStatus.published.length} live</span>
          </div>
          {loading ? (
            <div className="p-6 text-center text-gray-500 flex items-center justify-center gap-3">
              <Loader2 className="animate-spin w-5 h-5" /> Loading posts...
            </div>
          ) : postsByStatus.published.length === 0 ? (
            <div className="p-6 text-gray-500">No published posts yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-left text-gray-600 uppercase text-xs tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Title</th>
                    <th className="px-6 py-3">Slug</th>
                    <th className="px-6 py-3">Updated</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {postsByStatus.published.map(post => (
                    <tr key={post.id} className="border-t border-gray-100">
                      <td className="px-6 py-3 font-medium text-gray-900">{post.title}</td>
                      <td className="px-6 py-3 text-gray-500">{post.slug}</td>
                      <td className="px-6 py-3 text-gray-500">{new Date(post.updated_at).toLocaleString()}</td>
                      <td className="px-6 py-3 flex gap-3">
                        <button onClick={() => populateForm(post)} className="text-blue-600 text-sm font-medium">Edit</button>
                        <button onClick={() => togglePublish(post)} className="text-gray-600 text-sm font-medium flex items-center gap-1">
                          <EyeOff className="w-4 h-4" /> Unpublish
                        </button>
                        <button onClick={() => handleDelete(post)} className="text-red-600 text-sm font-medium flex items-center gap-1">
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="bg-white border border-gray-200 rounded-2xl shadow-sm">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Drafts</h2>
            <span className="text-sm text-gray-500">{postsByStatus.drafts.length} drafts</span>
          </div>
          {loading ? (
            <div className="p-6 text-center text-gray-500 flex items-center justify-center gap-3">
              <Loader2 className="animate-spin w-5 h-5" /> Loading drafts...
            </div>
          ) : postsByStatus.drafts.length === 0 ? (
            <div className="p-6 text-gray-500">All caught up. Create a new post!</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-left text-gray-600 uppercase text-xs tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Title</th>
                    <th className="px-6 py-3">Slug</th>
                    <th className="px-6 py-3">Updated</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {postsByStatus.drafts.map(post => (
                    <tr key={post.id} className="border-t border-gray-100">
                      <td className="px-6 py-3 font-medium text-gray-900">{post.title}</td>
                      <td className="px-6 py-3 text-gray-500">{post.slug}</td>
                      <td className="px-6 py-3 text-gray-500">{new Date(post.updated_at).toLocaleString()}</td>
                      <td className="px-6 py-3 flex gap-3">
                        <button onClick={() => populateForm(post)} className="text-blue-600 text-sm font-medium">Edit</button>
                        <button onClick={() => togglePublish(post)} className="text-green-600 text-sm font-medium flex items-center gap-1">
                          <Eye className="w-4 h-4" /> Publish
                        </button>
                        <button onClick={() => handleDelete(post)} className="text-red-600 text-sm font-medium flex items-center gap-1">
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="bg-white border border-gray-200 rounded-2xl shadow-sm">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {editingPost ? `Editing: ${editingPost.title}` : 'Create New Post'}
            </h2>
            {editingPost && (
              <button onClick={handleCreateNew} className="text-sm text-gray-500 hover:text-gray-800">
                Reset form
              </button>
            )}
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Title"
                value={form.title}
                onChange={e => handleTitleChange(e.target.value)}
                placeholder="AI Visibility Playbook"
                required
              />
              <Input
                label="Slug"
                value={form.slug}
                onChange={e => {
                  setSlugLocked(true);
                  setForm(prev => ({ ...prev, slug: e.target.value }));
                }}
                placeholder="ai-visibility-playbook"
                required
              />
              <Input
                label="Tags (comma separated)"
                value={form.tags}
                onChange={e => setForm(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="AI visibility, schema markup"
              />
              <Input
                label="Author"
                value={form.authorName}
                onChange={e => setForm(prev => ({ ...prev, authorName: e.target.value }))}
                placeholder="AIVO Insights"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Excerpt</label>
                <textarea
                  className="w-full min-h-[120px] rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-blue-500"
                  value={form.excerpt}
                  onChange={e => setForm(prev => ({ ...prev, excerpt: e.target.value }))}
                  placeholder="Short summary for listing pages"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Meta Description</label>
                <textarea
                  className="w-full min-h-[120px] rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-blue-500"
                  value={form.metaDescription}
                  onChange={e => setForm(prev => ({ ...prev, metaDescription: e.target.value }))}
                  placeholder="Description for SEO metadata"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
              <ReactQuill
                theme="snow"
                value={form.content}
                onChange={value => setForm(prev => ({ ...prev, content: value }))}
                modules={quillModules}
                formats={quillFormats}
                className="bg-white"
              />
              <p className="text-sm text-gray-500 mt-2">Content is stored as semantic HTML, ready for AI consumption.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <label className="block text-sm font-medium text-gray-700">Cover Image</label>
                {form.coverImageUrl ? (
                  <img src={form.coverImageUrl} alt="Cover" className="rounded-xl border border-gray-200 h-64 object-cover w-full" />
                ) : (
                  <div className="flex items-center justify-center border-dashed border-2 border-gray-300 rounded-xl h-64 text-gray-500">
                    <ImageIcon className="w-6 h-6 mr-2" /> No image yet
                  </div>
                )}
                <Input
                  label="Cover Image URL"
                  value={form.coverImageUrl}
                  onChange={e => setForm(prev => ({ ...prev, coverImageUrl: e.target.value }))}
                  placeholder="https://"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Image Author"
                    value={form.imageAuthor}
                    onChange={e => setForm(prev => ({ ...prev, imageAuthor: e.target.value }))}
                  />
                  <Input
                    label="Image Author URL"
                    value={form.imageAuthorUrl}
                    onChange={e => setForm(prev => ({ ...prev, imageAuthorUrl: e.target.value }))}
                  />
                </div>
                <Input
                  label="Image Source"
                  value={form.imageSource}
                  onChange={e => setForm(prev => ({ ...prev, imageSource: e.target.value }))}
                />
                {imageError && <p className="text-sm text-red-600">{imageError}</p>}
                <Button type="button" onClick={generateCoverImage} disabled={imageLoading} className="flex items-center gap-2">
                  {imageLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                  {imageLoading ? 'Generating image...' : 'Generate Cover Image'}
                </Button>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">Publication</label>
                <div className="flex items-center gap-3">
                  <input
                    id="published"
                    type="checkbox"
                    className="h-5 w-5 text-blue-600 rounded border-gray-300"
                    checked={form.published}
                    onChange={e => setForm(prev => ({ ...prev, published: e.target.checked }))}
                  />
                  <label htmlFor="published" className="text-gray-800 font-medium">
                    Published
                  </label>
                </div>
                <p className="text-sm text-gray-500">
                  When checked, the post will appear on the public blog immediately with the current timestamp.
                </p>
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800">
                  Estimated reading time:{' '}
                  <span className="font-semibold">{estimateReadingTime(form.content)} minutes</span>
                </div>
                <div className="pt-4 border-t border-gray-100">
                  <Button type="submit" disabled={saving} className="w-full flex items-center justify-center gap-2">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? 'Saving...' : 'Save Post'}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </section>
      </div>
    </DashboardLayout>
  );
}
