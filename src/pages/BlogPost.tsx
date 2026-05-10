import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, Clock, Tag, ArrowLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import MarketingLayout from '../components/layouts/MarketingLayout';
import SEOHead from '../components/shared/SEOHead';
import Breadcrumbs from '../components/shared/Breadcrumbs';
import { supabase } from '../lib/supabase';
import { BlogPost } from '../types/database';
import { SITE } from '../config/site';

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);

  const fetchPost = useCallback(async () => {
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
  }, [slug]);

  useEffect(() => {
    if (slug) {
      fetchPost();
    }
  }, [slug, fetchPost]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const looksLikeHtml = (value: string) => /<\s*(article|section|div|p|h[1-6]|ul|ol|li|strong|em|table)/i.test(value);
  const looksLikeMarkdown = (value: string) =>
    /(^|\n)\s*#{1,6}\s+|(\*\*|__)[^*_]+(\*\*|__)|\n- |\n\d+\. /.test(value);
  const normalizePlainText = (value: string) =>
    value
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean)
      .join('\n\n');
  const convertMarkdownishToHtml = (value: string) => {
    let processed = value || '';

    processed = processed.replace(/(^|\s)(#{1,6})\s+([^\n#][^\n]*)/g, (_match, pre, hashes, text) => `${pre}\n${hashes} ${text}\n`);
    processed = processed.replace(/^###\s+(.*)$/gm, '<h3>$1</h3>');
    processed = processed.replace(/^##\s+(.*)$/gm, '<h2>$1</h2>');
    processed = processed.replace(/^#\s+(.*)$/gm, '<h1>$1</h1>');
    processed = processed.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    processed = processed.replace(/__(.+?)__/g, '<strong>$1</strong>');

    const lines = processed.split(/\r?\n/);
    const htmlParts: string[] = [];
    let inUl = false;
    let inOl = false;

    const closeLists = () => {
      if (inUl) {
        htmlParts.push('</ul>');
        inUl = false;
      }
      if (inOl) {
        htmlParts.push('</ol>');
        inOl = false;
      }
    };

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        closeLists();
        return;
      }

      if (/^\d+\.\s+/.test(trimmed)) {
        if (inUl) {
          htmlParts.push('</ul>');
          inUl = false;
        }
        if (!inOl) {
          htmlParts.push('<ol>');
          inOl = true;
        }
        htmlParts.push(`<li>${trimmed.replace(/^\d+\.\s+/, '')}</li>`);
        return;
      }

      if (/^[-*]\s+/.test(trimmed)) {
        if (inOl) {
          htmlParts.push('</ol>');
          inOl = false;
        }
        if (!inUl) {
          htmlParts.push('<ul>');
          inUl = true;
        }
        htmlParts.push(`<li>${trimmed.replace(/^[-*]\s+/, '')}</li>`);
        return;
      }

      closeLists();
      htmlParts.push(trimmed);
    });

    closeLists();
    processed = htmlParts.join('\n');
    return processed.replace(/#+/g, '');
  };
  const prepareMarkdown = (value: string) => {
    let next = value || '';
    next = next.replace(/(\s+)(#{1,6}\s+)/g, '\n\n$2');
    next = next.replace(/(#{1,6}\s+[^\n#]+)(\s+(?=[A-Za-z0-9]))/g, '$1\n\n');
    next = next.replace(/(\S)([-*]\s+)/g, '$1\n$2');
    next = next.replace(/(\n)(#{1,6}\s+)/g, '\n\n$2');
    return normalizePlainText(next);
  };
  const ensureParagraphWrappedHtml = (value: string) => {
    const trimmed = value?.trim() ?? '';
    if (!trimmed) return '';
    const converted = convertMarkdownishToHtml(trimmed);
    const hasBlocks = /<\s*(p|h[1-6]|ul|ol|blockquote|table|pre|li)/i.test(converted);
    if (hasBlocks) return converted;
    const paragraphs = converted
      .split(/\n{2,}/)
      .map(chunk => chunk.trim())
      .filter(Boolean);
    if (!paragraphs.length) return `<p>${converted}</p>`;
    return paragraphs.map(p => `<p>${p.replace(/\n+/g, '<br />')}</p>`).join('\n');
  };
  const stripFormatting = (value: string) =>
    value
      .replace(/<[^>]*>/g, ' ')
      .replace(/[#*_>`~-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const fetchRelatedPosts = useCallback(async (currentPost: BlogPost) => {
    setRelatedLoading(true);
    try {
      const tagList = currentPost.tags ?? [];
      const related: BlogPost[] = [];

      if (tagList.length) {
        const { data: tagged, error: taggedError } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('published', true)
          .neq('id', currentPost.id)
          .contains('tags', [tagList[0]])
          .order('published_at', { ascending: false })
          .limit(6);

        if (taggedError) throw taggedError;
        if (tagged) {
          related.push(...tagged);
        }
      }

      if (related.length < 3) {
        const { data: fallback, error: fallbackError } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('published', true)
          .neq('id', currentPost.id)
          .order('published_at', { ascending: false })
          .limit(6);

        if (fallbackError) throw fallbackError;
        if (fallback) {
          const existing = new Set(related.map(post => post.id));
          fallback.forEach(post => {
            if (!existing.has(post.id)) {
              related.push(post);
            }
          });
        }
      }

      setRelatedPosts(related.slice(0, 4));
    } catch (err) {
      console.error('Error fetching related posts:', err);
    } finally {
      setRelatedLoading(false);
    }
  }, []);

  useEffect(() => {
    if (post) {
      fetchRelatedPosts(post);
    }
  }, [post, fetchRelatedPosts]);

  const contentShape = (() => {
    const rawContent = post?.content || '';
    const isHtml =
      (post?.content_format === 'html' && rawContent.trim() !== '') ||
      looksLikeHtml(rawContent);

    if (isHtml) {
      return { type: 'html' as const, value: ensureParagraphWrappedHtml(rawContent) };
    }

    const markdownSource = looksLikeMarkdown(rawContent) ? prepareMarkdown(rawContent) : normalizePlainText(rawContent);
    return { type: 'markdown' as const, value: markdownSource };
  })();


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

  const siteUrl = SITE.url.replace(/\/$/, '');
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
      name: SITE.name,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteUrl}/blog/${post.slug}`,
    },
    keywords: post.tags.join(', '),
  };

  return (
    <MarketingLayout>
      <SEOHead
        title={`${post.title} | AIVO Insights Blog`}
        description={post.meta_description || post.excerpt}
        canonical={`${siteUrl}/blog/${post.slug}`}
        ogTitle={post.title}
        ogDescription={post.excerpt}
        ogImage={post.cover_image_url || `${siteUrl}/og-image.png`}
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

        <section className="blog-content text-gray-800 leading-relaxed">
          {contentShape.type === 'markdown' ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: (props) => <h1 className="text-3xl font-bold mt-10 mb-4" {...props} />,
                h2: (props) => <h2 className="text-2xl font-semibold mt-8 mb-3" {...props} />,
                h3: (props) => <h3 className="text-xl font-semibold mt-6 mb-3" {...props} />,
                p: (props) => <p className="mb-4 leading-7" {...props} />,
                ul: (props) => <ul className="list-disc pl-6 mb-4 space-y-2" {...props} />,
                ol: (props) => <ol className="list-decimal pl-6 mb-4 space-y-2" {...props} />,
                li: (props) => <li className="leading-7" {...props} />,
                blockquote: (props) => (
                  <blockquote className="border-l-4 border-blue-200 pl-4 italic text-gray-700 mb-4" {...props} />
                ),
                a: (props) => <a className="text-blue-600 hover:text-blue-700 underline font-medium" {...props} />,
              }}
            >
              {contentShape.value}
            </ReactMarkdown>
          ) : (
            <div
              className="space-y-4"
              dangerouslySetInnerHTML={{ __html: contentShape.value }}
            />
          )}
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

        <section className="mt-16 bg-gray-50 border border-gray-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm uppercase tracking-wide text-gray-500 font-semibold">Keep reading</p>
              <h2 className="text-2xl font-bold text-gray-900">Related articles from AIVO Insights</h2>
            </div>
            <Link to="/blog" className="text-blue-600 hover:text-blue-700 font-medium">
              View all
            </Link>
          </div>
          {relatedLoading ? (
            <div className="text-gray-600 flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              Loading recommendations...
            </div>
          ) : relatedPosts.length === 0 ? (
            <p className="text-gray-600">We&apos;re adding more articles soon. Visit the main blog for the latest insights.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {relatedPosts.map(related => (
                <Link
                  key={related.id}
                  to={`/blog/${related.slug}`}
                  className="group p-5 bg-white rounded-xl border border-gray-200 hover:border-blue-200 hover:shadow-sm transition"
                >
                  <div className="flex flex-wrap gap-2 mb-3">
                    {(related.tags ?? []).slice(0, 2).map(tag => (
                      <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded">
                        <Tag className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-700 transition-colors mb-2">
                    {related.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {stripFormatting(related.excerpt || related.content || '').slice(0, 140)}…
                  </p>
                  <div className="mt-3 flex items-center text-sm text-gray-500 gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{related.reading_time_minutes || 5} min read</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

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
