import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  canonical?: string;
}

const SEO: React.FC<SEOProps> = ({
  title = 'Dashboard++ - Advanced CRM Analytics Dashboard for Kommo',
  description = 'Transform your Kommo CRM data into actionable insights. Advanced analytics, real-time reporting, team performance tracking, and powerful dashboards for better business decisions.',
  keywords = 'CRM analytics, Kommo dashboard, business intelligence, sales analytics, team performance, CRM reporting, data visualization, Kommo integration',
  image = 'https://iili.io/FtAePhG.th.webp',
  url = 'https://dashboard-plus.com',
  type = 'website',
  canonical
}) => {
  const fullUrl = canonical || url;

  useEffect(() => {
    // Update document title
    document.title = title;
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    }
    
    // Update canonical URL
    const canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) {
      canonicalLink.setAttribute('href', fullUrl);
    }
  }, [title, description, fullUrl]);

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      {canonical && <link rel="canonical" href={canonical} />}
      
      {/* Open Graph / Facebook */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:type" content={type} />
      
      {/* Twitter */}
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:card" content="summary_large_image" />
      
      {/* Additional Meta Tags */}
      <meta name="robots" content="index, follow" />
      <meta name="author" content="MASAAF Badr Eddine" />
    </Helmet>
  );
};

export default SEO;
