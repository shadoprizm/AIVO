import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, Clock, Tag, ArrowLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import MarketingLayout from '../components/layouts/MarketingLayout';
import SEOHead from '../components/shared/SEOHead';
import Breadcrumbs from '../components/shared/Breadcrumbs';
import { supabase } from '../lib/supabase';
import { BlogPost } from '../types/database';

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (slug) {
      fetchPost();
    }
  }, [slug]);

  const fetchPost = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('published', true)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        setError('Blog post not found');
      } else {
        setPost(data);
      }
    } catch (err) {
      console.error('Error fetching blog post:', err);
      setError('Failed to load blog post');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <MarketingLayout>
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading blog post...</p>
        </div>
      </MarketingLayout>
    );
  }

  if (error || !post) {
    return (
      <MarketingLayout>
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <p className="text-red-600 mb-4">{error || 'Blog post not found'}</p>
          <Link to="/blog" className="text-blue-600 hover:text-blue-700 font-medium">
            Back to Blog
          </Link>
        </div>
      </MarketingLayout>
    );
  }

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.meta_description || post.excerpt,
    image: post.cover_image_url,
    datePublished: post.published_at || post.created_at,
    dateModified: post.updated_at,
    author: {
      '@type': 'Person',
      name: post.author_name,
      ...(post.author_email && { email: post.author_email }),
    },
    publisher: {
      '@type': 'Organization',
      name: 'AIVO Insights',
      logo: {
        '@type': 'ImageObject',
        url: 'https://aivoinsights.com/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://aivoinsights.com/blog/${post.slug}`,
    },
    keywords: post.tags.join(', '),
  };

  return (
    <MarketingLayout>
      <SEOHead
        title={`${post.title} | AIVO Insights Blog`}
        description={post.meta_description || post.excerpt}
        canonical={`https://aivoinsights.com/blog/${post.slug}`}
        ogTitle={post.title}
        ogDescription={post.excerpt}
        ogImage={post.cover_image_url || 'https://aivoinsights.com/og-image.png'}
        ogType="article"
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Blog', href: '/blog' },
            { label: post.title },
          ]}
        />

        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Blog
        </Link>

        <header className="mb-8">
          {post.cover_image_url && (
            <img
              src={post.cover_image_url}
              alt={post.title}
              className="w-full h-96 object-cover rounded-xl mb-8"
            />
          )}

          <div className="flex flex-wrap gap-2 mb-4">
            {(post.tags ?? []).map(tag => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full"
              >
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {post.title}
          </h1>

          <div className="flex items-center gap-6 text-gray-600 mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <time dateTime={post.published_at || post.created_at}>
                {formatDate(post.published_at || post.created_at)}
              </time>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span>{post.reading_time_minutes || 5} min read</span>
            </div>
          </div>

          <div className="flex items-center gap-3 pb-8 border-b border-gray-200">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg">
              {post.author_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-gray-900">{post.author_name}</p>
              <p className="text-sm text-gray-600">Author</p>
            </div>
          </div>
        </header>

        <section className="blog-content text-gray-800 leading-relaxed space-y-4">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {post.content}
          </ReactMarkdown>
        </section>

        {post.image_author && (
          <p className="text-sm text-gray-500 mt-6">
            Cover photo by{' '}
            {post.image_author_url ? (
              <a
                href={post.image_author_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {post.image_author}
              </a>
            ) : (
              post.image_author
            )}{' '}
            {post.image_source && `via ${post.image_source}`}
          </p>
        )}

        <footer className="mt-12 pt-8 border-t border-gray-200">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to All Posts
          </Link>
        </footer>
      </article>
    </MarketingLayout>
  );
}
