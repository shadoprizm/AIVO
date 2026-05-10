import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Tag, ArrowRight } from 'lucide-react';
import MarketingLayout from '../components/layouts/MarketingLayout';
import SEOHead from '../components/shared/SEOHead';
import Breadcrumbs from '../components/shared/Breadcrumbs';
import { supabase } from '../lib/supabase';
import { BlogPost } from '../types/database';
import { SITE } from '../config/site';

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const stripFormatting = (value: string) =>
    value
      .replace(/[#*_>`~-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const uniquePosts = posts.reduce<BlogPost[]>((acc, post) => {
    const titleKey = post.title.trim().toLowerCase();
    if (acc.find(existing => existing.title.trim().toLowerCase() === titleKey)) {
      return acc;
    }
    return [...acc, post];
  }, []);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('published', true)
        .order('published_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (err) {
      console.error('Error fetching blog posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const allTags = Array.from(new Set(uniquePosts.flatMap(post => post.tags ?? [])));
  const filteredPosts = selectedTag
    ? uniquePosts.filter(post => (post.tags ?? []).includes(selectedTag))
    : uniquePosts;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const siteUrl = SITE.url.replace(/\/$/, '');
  const blogSchema = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'AIVO Insights Blog',
    description: 'Expert insights on AI visibility optimization, semantic SEO, and improving your website\'s discoverability in AI-powered search',
    url: `${siteUrl}/blog`,
    publisher: {
      '@type': 'Organization',
      name: SITE.name,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/logo.png`,
      },
    },
  };

  return (
    <MarketingLayout>
      <SEOHead
        title="Blog - AI Visibility & SEO Insights | AIVO Insights"
        description="Expert articles on AI visibility optimization, semantic SEO best practices, schema markup, and strategies to improve your website's discoverability in AI-powered search."
        canonical={`${siteUrl}/blog`}
        ogTitle="AIVO Insights Blog"
        ogDescription="Learn how to optimize your website for AI visibility with expert insights and best practices."
        ogImage={`${siteUrl}/og-image.png`}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }} />

      <article className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Blog' },
          ]}
        />

        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            AI Visibility Blog
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Expert insights on optimizing your website for AI models, semantic SEO, and the future of digital discoverability
          </p>
        </header>

        {allTags.length > 0 && (
          <section className="mb-12">
            <div className="max-w-xl mx-auto">
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Filter by topic
              </label>
              <div className="relative">
                <select
                  value={selectedTag ?? ''}
                  onChange={(e) => setSelectedTag(e.target.value || null)}
                  className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">All posts</option>
                  {allTags.map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
                <Tag className="w-4 h-4 text-gray-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              {selectedTag && (
                <button
                  onClick={() => setSelectedTag(null)}
                  className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear filter
                </button>
              )}
            </div>
          </section>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading blog posts...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">
              {selectedTag ? `No posts found with tag "${selectedTag}"` : 'No blog posts published yet. Check back soon!'}
            </p>
          </div>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map(post => (
              <article
                key={post.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {post.cover_image_url && (
                  <img
                    src={post.cover_image_url}
                    alt={post.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-6">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {(post.tags ?? []).slice(0, 3).map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded"
                      >
                        <Tag className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                    {(post.tags?.length ?? 0) > 3 && (
                      <span className="text-xs text-gray-500">
                        +{(post.tags?.length ?? 0) - 3} more
                      </span>
                    )}
                  </div>

                  <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                    <Link to={`/blog/${post.slug}`} className="hover:text-blue-600 transition-colors">
                      {post.title}
                    </Link>
                  </h2>

                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {stripFormatting(post.excerpt || post.content || '').slice(0, 180) || 'Read the latest insights on AI visibility.'}
                  </p>

                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <time dateTime={post.published_at || post.created_at}>
                        {formatDate(post.published_at || post.created_at)}
                      </time>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{post.reading_time_minutes || 5} min read</span>
                    </div>
                  </div>

                  <Link
                    to={`/blog/${post.slug}`}
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Read More
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </article>
            ))}
          </section>
        )}
      </article>
    </MarketingLayout>
  );
}
