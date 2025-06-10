import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchContentItems, fetchContentCategories, fetchContentTags } from "../utils/supabaseClient";
import { Skeleton } from "@/components/ui/skeleton";

// Define interfaces for the data structures
interface ContentItem {
  id: string;
  title: string;
  summary: string | null;
  category_id: string | null; // Changed from category_name
  category_name?: string; // Will be added manually
  tag_names: string[];
  content_type: string;
  thumbnail_url?: string | null;
  estimated_read_time_minutes?: number | null; // For articles
  duration_minutes?: number | null; // For videos
  // Add other fields as necessary from fetchContentItems
}

interface ContentCategory {
  id: string;
  name: string;
}

interface ContentTag {
  id: string;
  name: string;
}

const ResourceLibraryPage: React.FC = () => {
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [categories, setCategories] = useState<ContentCategory[]>([]);
  const [tags, setTags] = useState<ContentTag[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Selected filters - to be used later
  const [selectedCategory, setSelectedCategory] = useState<string>("All Categories");
  const [selectedProgramTag, setSelectedProgramTag] = useState<string>("All Programs");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [minDuration, setMinDuration] = useState<string>("");
  const [maxDuration, setMaxDuration] = useState<string>("");

  const navigate = useNavigate(); // Initialize useNavigate

  useEffect(() => {
    const loadContent = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [itemsRaw, fetchedCategories, fetchedTags] = await Promise.all([
          fetchContentItems(),
          fetchContentCategories(),
          fetchContentTags()
        ]);
        
        // Manually map category names to items
        const itemsWithCategoryNames = itemsRaw.map(item => {
          const category = fetchedCategories.find(cat => cat.id === item.category_id);
          return {
            ...item,
            category_name: category ? category.name : 'Uncategorized'
          };
        });

        setContentItems(itemsWithCategoryNames as ContentItem[]); 
        setCategories(fetchedCategories as ContentCategory[]);
        setTags(fetchedTags as ContentTag[]);

      } catch (err) {
        console.error("Error loading resource library content:", err);
        setError("Failed to load content. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();
  }, []);

  const filteredContentItems = contentItems.filter(item => {
    const categoryMatch = selectedCategory === "All Categories" || item.category_name === selectedCategory;
    const programTagMatch = selectedProgramTag === "All Programs" || item.tag_names.includes(
      selectedProgramTag === "NGX PRIME" ? "PRIME" : selectedProgramTag === "NGX LONGEVITY" ? "LONGEVITY" : selectedProgramTag
    );

    const searchMatch = searchTerm.trim() === "" ||
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.summary ? item.summary.toLowerCase().includes(searchTerm.toLowerCase()) : false);

    const duration = item.duration_minutes ?? null;
    let durationMatch = true;
    if (duration !== null) {
      if (minDuration) durationMatch = durationMatch && duration >= parseInt(minDuration, 10);
      if (maxDuration) durationMatch = durationMatch && duration <= parseInt(maxDuration, 10);
    }

    return categoryMatch && programTagMatch && searchMatch && durationMatch;
  });

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
          NGX Resource Library
        </h1>
        <p className="mt-4 text-lg leading-8 text-gray-300">
          Curated knowledge to empower your health and performance journey.
        </p>
      </header>

      {/* Filters Section */}
      <div className="mb-8 p-6 bg-gray-800/70 backdrop-blur-sm border border-gray-700/60 rounded-xl shadow-xl">
        <h2 className="text-xl font-semibold text-white mb-4">Filter Content</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label htmlFor="category-filter" className="block text-sm font-medium text-gray-300 mb-1.5">
              Category
            </label>
            <select
              id="category-filter"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 h-10"
            >
              <option value="All Categories">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="program-filter" className="block text-sm font-medium text-gray-300 mb-1.5">
              Program (Tag)
            </label>
            <select
              id="program-filter"
              value={selectedProgramTag}
              onChange={(e) => setSelectedProgramTag(e.target.value)}
              className="block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 h-10"
            >
              <option value="All Programs">All Programs</option>
              {/* Manually adding PRIME and LONGEVITY as they are key program tags */}
              <option value="PRIME">NGX PRIME</option>
              <option value="LONGEVITY">NGX LONGEVITY</option>
              {/* You could also dynamically populate other tags if needed */}
            </select>
          </div>
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-300 mb-1.5">
              Search
            </label>
            <input
              id="search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search titles or summaries"
              className="block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 h-10"
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label htmlFor="min-duration" className="block text-sm font-medium text-gray-300 mb-1.5">
                Min Duration
              </label>
              <input
                id="min-duration"
                type="number"
                value={minDuration}
                onChange={(e) => setMinDuration(e.target.value)}
                placeholder="min"
                className="block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 h-10"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="max-duration" className="block text-sm font-medium text-gray-300 mb-1.5">
                Max Duration
              </label>
              <input
                id="max-duration"
                type="number"
                value={maxDuration}
                onChange={(e) => setMaxDuration(e.target.value)}
                placeholder="max"
                className="block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 h-10"
              />
            </div>
          </div>
          {/* <Button className="bg-indigo-600 hover:bg-indigo-700 text-white h-10">
            Apply Filters // Filtering is now real-time on select change
          </Button> */}
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <Card key={index} className="bg-gray-800 border-gray-700 text-white flex flex-col">
              <CardHeader>
                <Skeleton className="h-6 w-3/4 bg-gray-700" />
                <Skeleton className="h-4 w-1/2 bg-gray-700 mt-2" />
              </CardHeader>
              <CardContent className="flex-grow">
                <Skeleton className="h-4 w-full bg-gray-700 mb-2" />
                <Skeleton className="h-4 w-5/6 bg-gray-700 mb-3" />
                <div className="flex flex-wrap gap-2 mb-4">
                  <Skeleton className="h-5 w-16 bg-gray-700 rounded-full" />
                  <Skeleton className="h-5 w-20 bg-gray-700 rounded-full" />
                </div>
              </CardContent>
              <div className="p-6 pt-0">
                <Skeleton className="h-10 w-full bg-indigo-700/50" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && error && (
        <div className="text-center py-10">
          <p className="text-red-400 text-lg">{error}</p>
        </div>
      )}

      {!isLoading && !error && filteredContentItems.length === 0 && (
        <div className="text-center py-10">
          <p className="text-gray-400 text-lg">No content items match your current filters. Try adjusting your selection.</p>
        </div>
      )}

      {!isLoading && !error && filteredContentItems.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContentItems.map((item) => (
            <Card key={item.id} className="bg-gray-800 border-gray-700 text-white flex flex-col justify-between hover:border-indigo-500/70 transition-colors duration-200 shadow-lg hover:shadow-indigo-500/10">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-indigo-400 group-hover:text-indigo-300 transition-colors">
                  {item.title}
                </CardTitle>
                <CardDescription className="text-gray-400 text-sm">{item.category_name} - {item.content_type}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                {item.thumbnail_url && (
                  <img src={item.thumbnail_url} alt={item.title} className="rounded-md mb-3 w-full h-40 object-cover"/>
                )}
                <p className="text-gray-300 mb-3 text-sm leading-relaxed line-clamp-3">{item.summary || "No summary available."}</p>
                {item.tag_names && item.tag_names.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {item.tag_names.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 text-xs font-semibold bg-gray-700 text-indigo-300 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
              <div className="p-6 pt-0">
                {item.content_type.toLowerCase() === "video_external" && item.duration_minutes ? (
                      <span className="text-xs text-gray-400 mb-2 inline-block">{item.duration_minutes} min video</span>
                    ) : item.estimated_read_time_minutes ? (
                      <span className="text-xs text-gray-400 mb-2 inline-block">{item.estimated_read_time_minutes} min read</span>
                    ) : null}
                <Button 
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                  onClick={() => navigate(`/content-item-page?id=${item.id}`)} // Navigate to ContentItemPage
                >
                  View Content
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResourceLibraryPage;
