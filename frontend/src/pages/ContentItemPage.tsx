
import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react"; // Replaced Heroicons
import { ArrowLeftIcon } from "@radix-ui/react-icons";
import { fetchContentItemById, fetchContentCategories, fetchRelatedContentItems } from "../utils/supabaseClient";

// Interface for the detailed content item
interface DetailedContentItem {
  id: string;
  title: string;
  content_type: string;
  summary: string | null;
  content_body: string | null; // For articles/text content
  external_url: string | null; // For videos or external links
  thumbnail_url?: string | null;
  published_at: string | null;
  estimated_read_time_minutes?: number | null;
  duration_minutes?: number | null;
  category_id: string | null;
  tag_names: string[];
  // Derived field
  category_name?: string;
}

interface ContentCategory {
  id: string;
  name: string;
  description?: string; // Optional
}

interface RelatedContentItem {
  id: string;
  title: string;
  summary: string | null;
  content_type: string;
  thumbnail_url?: string | null;
  estimated_read_time_minutes?: number | null;
  duration_minutes?: number | null;
  category_id: string | null;
  category_name?: string;
  tag_names: string[];
}

const ContentItemPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const itemId = searchParams.get("id");

  const [contentItem, setContentItem] = useState<DetailedContentItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<ContentCategory[]>([]);
  const [relatedItems, setRelatedItems] = useState<RelatedContentItem[]>([]);
  const [isRelatedLoading, setIsRelatedLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!itemId) {
      setError("No content item ID provided.");
      setIsLoading(false);
      return;
    }

    const loadContentItem = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const itemData = await fetchContentItemById(itemId);
        if (!itemData) {
          setError("Content item not found.");
          setContentItem(null);
          setIsLoading(false);
          return;
        }

        const fetchedCategories = await fetchContentCategories();
        setCategories(fetchedCategories as ContentCategory[]);

        let categoryName = "Uncategorized";
        if (itemData.category_id) {
          const category = fetchedCategories.find((cat: ContentCategory) => cat.id === itemData.category_id);
          if (category) {
            categoryName = category.name;
          }
        }

        setContentItem({ ...itemData, category_name: categoryName } as DetailedContentItem);

      } catch (err) {
        console.error("Error loading content item:", err);
        setError("Failed to load content. Please try again later.");
        setContentItem(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadContentItem();
  }, [itemId]);

  useEffect(() => {
    const loadRelated = async () => {
      if (!contentItem) return;
      setIsRelatedLoading(true);
      try {
        const items = await fetchRelatedContentItems(contentItem.category_id, contentItem.id);
        const mapped = items.map(item => ({
          ...item,
          category_name: categories.find(cat => cat.id === item.category_id)?.name || 'Uncategorized'
        })) as RelatedContentItem[];
        setRelatedItems(mapped);
      } catch (err) {
        console.error('Error loading related content:', err);
      } finally {
        setIsRelatedLoading(false);
      }
    };

    loadRelated();
  }, [contentItem, categories]);

  const renderContentBody = () => {
    if (!contentItem || !contentItem.content_body) return null;
    // Assuming content_body might contain HTML. Use with caution.
    // For Markdown, a library like 'react-markdown' would be needed.
    return (
      <div 
        className="prose prose-invert max-w-none text-gray-300 prose-headings:text-indigo-400 prose-a:text-indigo-400 hover:prose-a:text-indigo-300 prose-strong:text-gray-200 prose-img:rounded-lg prose-img:shadow-md"
        dangerouslySetInnerHTML={{ __html: contentItem.content_body }} 
      />
    );
  };

  const renderVideoPlayer = () => {
    if (!contentItem || !contentItem.external_url || !contentItem.content_type.toLowerCase().includes("video")) return null;
    
    let videoUrl = contentItem.external_url;
    if (videoUrl.includes("youtube.com/watch?v=")) {
      const videoId = videoUrl.split("v=")[1].split("&")[0];
      videoUrl = `https://www.youtube-nocookie.com/embed/${videoId}`;
    } else if (videoUrl.includes("youtu.be/")) {
      const videoId = videoUrl.split("youtu.be/")[1].split("?")[0];
      videoUrl = `https://www.youtube-nocookie.com/embed/${videoId}`;
    } else if (videoUrl.includes("vimeo.com/")) {
      const videoId = videoUrl.split("vimeo.com/")[1].split("?")[0];
      videoUrl = `https://player.vimeo.com/video/${videoId}`;
    }

    return (
      <div className="aspect-w-16 aspect-h-9 my-6 rounded-lg overflow-hidden shadow-xl border border-gray-700/60">
        <iframe
          src={videoUrl}
          title={contentItem.title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-12 px-4 md:px-6 lg:px-8 text-white">
        <Skeleton className="h-10 w-40 mb-8 bg-gray-700 rounded-md" /> {/* Back Button Placeholder */}
        <Skeleton className="h-12 w-3/4 mb-4 bg-gray-700 rounded-md" /> {/* Title Placeholder */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Skeleton className="h-6 w-24 bg-gray-700 rounded-full" />
          <Skeleton className="h-6 w-20 bg-gray-700 rounded-full" />
          <Skeleton className="h-6 w-28 bg-gray-700 rounded-full" />
        </div>
        <Skeleton className="h-4 w-1/3 mb-6 bg-gray-700 rounded-md" /> {/* Read time/duration */}
        <Skeleton className="h-px w-full bg-gray-700 my-6" /> {/* Separator */}
        <Skeleton className="h-4 w-full bg-gray-700 mb-2" />
        <Skeleton className="h-4 w-full bg-gray-700 mb-2" />
        <Skeleton className="h-4 w-5/6 bg-gray-700 mb-6" /> 
        <Skeleton className="h-96 w-full bg-gray-700 mb-6 rounded-lg" /> {/* Main content area / Video player */}
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-12 px-4 text-center text-red-400 flex flex-col items-center">
        <p className="text-2xl mb-4">An Error Occurred</p>
        <p className="text-lg mb-6">{error}</p>
        <Button onClick={() => navigate("/resource-library-page")} className="bg-indigo-600 hover:bg-indigo-700 text-white w-auto">
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Resource Library
        </Button>
      </div>
    );
  }

  if (!contentItem) {
    return (
      <div className="container mx-auto py-12 px-4 text-center text-gray-400 flex flex-col items-center">
        <p className="text-2xl mb-6">Content Item Not Found</p>
        <Button onClick={() => navigate("/resource-library-page") } className="bg-indigo-600 hover:bg-indigo-700 text-white w-auto">
           <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Resource Library
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8 text-white">
      <Button 
        onClick={() => navigate("/resource-library-page") }
        variant="outline" 
        className="mb-8 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white bg-gray-800/80 backdrop-blur-sm shadow-md"
      >
        <ArrowLeftIcon className="h-5 w-5 mr-2" />
        Back to Resource Library
      </Button>

      <article className="bg-gray-800/60 backdrop-blur-md p-6 sm:p-8 md:p-10 rounded-xl shadow-2xl border border-gray-700/70">
        <header className="mb-6 pb-6 border-b border-gray-700/50">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-indigo-300 mb-4 leading-tight">
            {contentItem.title}
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-400 mb-4">
            {contentItem.category_name && 
                <Badge variant="outline" className="border-indigo-500/50 text-indigo-300 bg-indigo-900/20 text-xs py-1 px-2.5">{contentItem.category_name}</Badge>
            }
            {contentItem.content_type && 
                <Badge variant="outline" className="border-teal-500/50 text-teal-300 bg-teal-900/20 text-xs py-1 px-2.5">
                    {contentItem.content_type.replace("_", " ").split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </Badge>
            }
            {(contentItem.content_type.toLowerCase().includes("video") && contentItem.duration_minutes) || contentItem.estimated_read_time_minutes ? (
                <Badge variant="outline" className="border-gray-600 text-gray-400 bg-gray-700/30 text-xs py-1 px-2.5">
                    {contentItem.content_type.toLowerCase().includes("video") && contentItem.duration_minutes ? (
                        `${contentItem.duration_minutes} min video`
                    ) : contentItem.estimated_read_time_minutes ? (
                        `${contentItem.estimated_read_time_minutes} min read`
                    ) : null}
                </Badge>
            ) : null}
          </div>
          {contentItem.tag_names && contentItem.tag_names.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {contentItem.tag_names.map((tag) => (
                <Badge key={tag} variant="secondary" className="bg-gray-700 text-indigo-300 border-gray-600/80 text-xs py-1 px-2">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </header>

        {contentItem.thumbnail_url && 
         !contentItem.content_type.toLowerCase().includes("video") && 
         !contentItem.content_body?.includes(`<img src="${contentItem.thumbnail_url}"`) && // Avoid duplicate image if in body
          <img 
            src={contentItem.thumbnail_url} 
            alt={contentItem.title} 
            className="rounded-lg mb-8 w-full max-h-[450px] object-cover shadow-xl border border-gray-700/60"
        />}

        {contentItem.content_type.toLowerCase().includes("video") 
          ? renderVideoPlayer() 
          : renderContentBody()}
        
        {contentItem.external_url &&
         !contentItem.content_type.toLowerCase().includes("video") &&
         contentItem.external_url !== contentItem.content_body && // Don't show if body is just the URL
          <div className="mt-10 pt-6 border-t border-gray-700/50">
            <Button
                onClick={() => window.open(contentItem.external_url ?? '', '_blank')}
                className="bg-indigo-600 hover:bg-indigo-500 text-white transition-colors duration-150 text-base font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75"
            >
                View Full External Resource
            </Button>
          </div>}

      </article>

      {isRelatedLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          {[...Array(3)].map((_, index) => (
            <Card key={index} className="bg-gray-800 border-gray-700 text-white flex flex-col">
              <CardHeader>
                <Skeleton className="h-6 w-3/4 bg-gray-700" />
                <Skeleton className="h-4 w-1/2 bg-gray-700 mt-2" />
              </CardHeader>
              <CardContent className="flex-grow">
                <Skeleton className="h-4 w-full bg-gray-700 mb-2" />
                <Skeleton className="h-4 w-5/6 bg-gray-700 mb-3" />
              </CardContent>
              <div className="p-6 pt-0">
                <Skeleton className="h-10 w-full bg-indigo-700/50" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {!isRelatedLoading && relatedItems.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-indigo-300 mb-6">Related Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedItems.map(item => (
              <Card key={item.id} className="bg-gray-800 border-gray-700 text-white flex flex-col justify-between hover:border-indigo-500/70 transition-colors duration-200 shadow-lg hover:shadow-indigo-500/10">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-indigo-400 group-hover:text-indigo-300 transition-colors">
                    {item.title}
                  </CardTitle>
                  <CardDescription className="text-gray-400 text-sm">
                    {item.category_name} - {item.content_type}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  {item.thumbnail_url && (
                    <img src={item.thumbnail_url} alt={item.title} className="rounded-md mb-3 w-full h-32 object-cover" />
                  )}
                  <p className="text-gray-300 mb-3 text-sm leading-relaxed line-clamp-3">{item.summary || "No summary available."}</p>
                </CardContent>
                <div className="p-6 pt-0">
                  <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => navigate(`/content-item-page?id=${item.id}`)}>
                    View Content
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

    </div>
  );
};

export default ContentItemPage;
