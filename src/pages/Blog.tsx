import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Tag, ArrowRight } from 'lucide-react';
import MarketingLayout from '../components/layouts/MarketingLayout';
import SEOHead from '../components/shared/SEOHead';
import Breadcrumbs from '../components/shared/Breadcrumbs';
import { supabase } from '../lib/supabase';
import { BlogPost } from '../types/database';

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

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

  const allTags = Array.from(new Set(posts.flatMap(post => post.tags ?? [])));
  const filteredPosts = selectedTag
    ? posts.filter(post => (post.tags ?? []).includes(selectedTag))
    : posts;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const blogSchema = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'AIVO Insights Blog',
    description: 'Expert insights on AI visibility optimization, semantic SEO, and improving your website\'s discoverability in AI-powered search',
    url: 'https://aivoinsights.com/blog',
    publisher: {
      '@type': 'Organization',
      name: 'AIVO Insights',
      logo: {
        '@type': 'ImageObject',
        url: 'https://aivoinsights.com/logo.png',
      },
    },
  };

  return (
    <MarketingLayout>
      <SEOHead
        title="Blog - AI Visibility & SEO Insights | AIVO Insights"
        description="Expert articles on AI visibility optimization, semantic SEO best practices, schema markup, and strategies to improve your website's discoverability in AI-powered search."
        canonical="https://aivoinsights.com/blog"
        ogTitle="AIVO Insights Blog"
        ogDescription="Learn how to optimize your website for AI visibility with expert insights and best practices."
        ogImage="https://aivoinsights.com/og-image.png"
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
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => setSelectedTag(null)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedTag === null
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Posts
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedTag === tag
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
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
                    {(post.tags ?? []).map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded"
                      >
                        <Tag className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                  </div>

                  <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                    <Link to={`/blog/${post.slug}`} className="hover:text-blue-600 transition-colors">
                      {post.title}
                    </Link>
                  </h2>

                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {post.excerpt}
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
