import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchContentItems, fetchContentCategories, fetchContentTags, type UserProgram } from "../utils/supabaseClient";
import { Skeleton } from "@/components/ui/skeleton";
import ProgramWizard from "../components/ProgramWizard";
import ActiveProgramCard from "../components/ActiveProgramCard";
import { useAppContext } from "../components/AppProvider";
import { 
  Wand2, 
  BookOpen, 
  Target, 
  Search, 
  Filter,
  Clock,
  Tag,
  Grid3X3,
  List,
  Dumbbell,
  Apple
} from 'lucide-react';

// Define interfaces for the data structures
interface ContentItem {
  id: string;
  title: string;
  summary: string | null;
  category_id: string | null;
  category_name?: string;
  tag_names: string[];
  content_type: string;
  thumbnail_url?: string | null;
  estimated_read_time_minutes?: number | null;
  duration_minutes?: number | null;
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
  const { currentUserId } = useAppContext();
  const navigate = useNavigate();
  
  // Content state
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [categories, setCategories] = useState<ContentCategory[]>([]);
  const [tags, setTags] = useState<ContentTag[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState<string>("All Categories");
  const [selectedProgramTag, setSelectedProgramTag] = useState<string>("All Programs");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [minDuration, setMinDuration] = useState<string>("");
  const [maxDuration, setMaxDuration] = useState<string>("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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
  }, [refreshTrigger]);

  const handleProgramCreated = (program: UserProgram) => {
    console.log('Program created:', program);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleProgramUpdate = () => {
    setRefreshTrigger(prev => prev + 1);
  };

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

  const clearFilters = () => {
    setSelectedCategory("All Categories");
    setSelectedProgramTag("All Programs");
    setSearchTerm("");
    setMinDuration("");
    setMaxDuration("");
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100">
      <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
        
        {/* Page Header */}
        <header className="mb-12">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl mb-4">
              Centro de Programas Inteligentes
            </h1>
            <p className="text-lg leading-8 text-neutral-400 max-w-3xl mx-auto">
              Explora contenido curado y crea programas personalizados con IA para optimizar tu salud y bienestar
            </p>
          </div>
        </header>

        {/* Content Library Section - MOVED UP */}
        <section className="mb-16">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2 flex items-center">
                <BookOpen className="w-8 h-8 mr-3 text-emerald-400" />
                Biblioteca de Contenido
              </h2>
              <p className="text-neutral-400">
                Explora contenido curado para complementar tu programa personalizado
              </p>
            </div>
            
            {/* View Mode Toggle */}
            <div className="hidden md:flex items-center space-x-2 bg-neutral-800/60 rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="text-neutral-300"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="text-neutral-300"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Filters Section */}
          <Card className="ngx-card mb-8">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-white flex items-center">
                <Filter className="w-5 h-5 mr-2 text-neutral-400" />
                Filtros de Contenido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
                  <Input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar contenido..."
                    className="pl-10 bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
                  />
                </div>

                {/* Category Filter */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-neutral-800 border border-neutral-700 text-white rounded-md px-3 py-2 focus:border-brand-violet focus:ring-1 focus:ring-brand-violet"
                >
                  <option value="All Categories">Todas las Categorías</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>

                {/* Program Filter */}
                <select
                  value={selectedProgramTag}
                  onChange={(e) => setSelectedProgramTag(e.target.value)}
                  className="bg-neutral-800 border border-neutral-700 text-white rounded-md px-3 py-2 focus:border-brand-violet focus:ring-1 focus:ring-brand-violet"
                >
                  <option value="All Programs">Todos los Programas</option>
                  <option value="PRIME">NGX PRIME</option>
                  <option value="LONGEVITY">NGX LONGEVITY</option>
                </select>

                {/* Duration Filter */}
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={minDuration}
                    onChange={(e) => setMinDuration(e.target.value)}
                    placeholder="Min min"
                    className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
                  />
                  <Input
                    type="number"
                    value={maxDuration}
                    onChange={(e) => setMaxDuration(e.target.value)}
                    placeholder="Max min"
                    className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
                  />
                </div>
              </div>

              {/* Filter Actions */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-neutral-400">
                  {filteredContentItems.length} contenido{filteredContentItems.length !== 1 ? 's' : ''} encontrado{filteredContentItems.length !== 1 ? 's' : ''}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="border-neutral-600 text-neutral-300 hover:bg-neutral-700"
                >
                  Limpiar Filtros
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Content Grid */}
          {isLoading && (
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
              {[...Array(6)].map((_, index) => (
                <Card key={index} className="ngx-card animate-pulse">
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 bg-neutral-700" />
                    <Skeleton className="h-4 w-1/2 bg-neutral-700" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-32 w-full bg-neutral-700 mb-3" />
                    <Skeleton className="h-4 w-full bg-neutral-700 mb-2" />
                    <Skeleton className="h-4 w-2/3 bg-neutral-700" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!isLoading && error && (
            <div className="text-center py-16">
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 max-w-md mx-auto">
                <p className="text-red-400 text-lg font-medium">{error}</p>
                <Button 
                  onClick={() => setRefreshTrigger(prev => prev + 1)}
                  className="mt-4 bg-red-600 hover:bg-red-700"
                >
                  Intentar de Nuevo
                </Button>
              </div>
            </div>
          )}

          {!isLoading && !error && filteredContentItems.length === 0 && (
            <div className="text-center py-16">
              <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-8 max-w-md mx-auto">
                <BookOpen className="w-16 h-16 text-neutral-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No se encontró contenido</h3>
                <p className="text-neutral-400 mb-4">
                  No hay contenido que coincida con tus filtros actuales.
                </p>
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  className="border-neutral-600 text-neutral-300 hover:bg-neutral-700"
                >
                  Limpiar Filtros
                </Button>
              </div>
            </div>
          )}

          {!isLoading && !error && filteredContentItems.length > 0 && (
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
              {filteredContentItems.map((item) => (
                <Card 
                  key={item.id} 
                  className="ngx-card hover:border-brand-violet/50 transition-all duration-200 group cursor-pointer"
                  onClick={() => navigate(`/content-item-page?id=${item.id}`)}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold text-white group-hover:text-brand-violet transition-colors line-clamp-2">
                      {item.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-neutral-400">{item.category_name}</span>
                      <span className="text-neutral-600">•</span>
                      <span className="text-neutral-400">{item.content_type}</span>
                      {(item.duration_minutes || item.estimated_read_time_minutes) && (
                        <>
                          <span className="text-neutral-600">•</span>
                          <span className="text-neutral-400 flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {item.duration_minutes || item.estimated_read_time_minutes} min
                          </span>
                        </>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {item.thumbnail_url && (
                      <div className="aspect-video bg-neutral-800 rounded-lg overflow-hidden">
                        <img 
                          src={item.thumbnail_url} 
                          alt={item.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                    )}
                    
                    <p className="text-neutral-300 text-sm leading-relaxed line-clamp-3">
                      {item.summary || "Contenido educativo para complementar tu programa de salud."}
                    </p>
                    
                    {item.tag_names && item.tag_names.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {item.tag_names.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium bg-neutral-800 text-neutral-300 rounded-full"
                          >
                            <Tag className="w-2 h-2 mr-1" />
                            {tag}
                          </span>
                        ))}
                        {item.tag_names.length > 3 && (
                          <span className="text-xs text-neutral-500">
                            +{item.tag_names.length - 3} más
                          </span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Program Management Section - MOVED DOWN */}
        <section className="mt-16 pt-16 border-t border-neutral-800">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4 flex items-center justify-center">
              <Target className="w-8 h-8 mr-3 text-brand-violet" />
              Crea Tu Programa Personalizado
            </h2>
            <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
              Utiliza nuestra IA avanzada para crear programas completamente personalizados según tus objetivos específicos
            </p>
          </div>

          {/* Active Program Display */}
          {currentUserId && (
            <div className="mb-12">
              <ActiveProgramCard 
                key={refreshTrigger} 
                onProgramUpdate={handleProgramUpdate} 
              />
            </div>
          )}

          {/* Program Creation Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Fitness Program Card */}
            <Card className="bg-gradient-to-br from-brand-violet/10 to-brand-violet/5 border-brand-violet/30 hover:border-brand-violet/50 transition-all duration-200 group">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-brand-violet/20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200">
                  <Dumbbell className="w-10 h-10 text-brand-violet" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Programa de Fitness
                </h3>
                <p className="text-sm text-neutral-400 mb-6">
                  Entrenamientos personalizados, planes de fuerza, cardio y acondicionamiento físico adaptados a tu nivel
                </p>
                
                {currentUserId ? (
                  <ProgramWizard 
                    programType="fitness"
                    onProgramCreated={handleProgramCreated}
                    triggerButton={
                      <Button className="bg-brand-violet hover:bg-brand-violet/80 text-white w-full">
                        <Wand2 size={16} className="mr-2" />
                        Crear Programa Fitness
                      </Button>
                    }
                  />
                ) : (
                  <Button 
                    onClick={() => navigate('/login')}
                    variant="outline" 
                    className="border-brand-violet text-brand-violet hover:bg-brand-violet/10 w-full"
                  >
                    Iniciar Sesión
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Nutrition Program Card */}
            <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/30 hover:border-emerald-500/50 transition-all duration-200 group">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200">
                  <Apple className="w-10 h-10 text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Programa de Nutrición
                </h3>
                <p className="text-sm text-neutral-400 mb-6">
                  Planes alimentarios inteligentes, recetas personalizadas y estrategias nutricionales para tus objetivos
                </p>
                
                {currentUserId ? (
                  <ProgramWizard 
                    programType="nutrition"
                    onProgramCreated={handleProgramCreated}
                    triggerButton={
                      <Button className="bg-emerald-500 hover:bg-emerald-600 text-white w-full">
                        <Wand2 size={16} className="mr-2" />
                        Crear Programa Nutrición
                      </Button>
                    }
                  />
                ) : (
                  <Button 
                    onClick={() => navigate('/login')}
                    variant="outline" 
                    className="border-emerald-500 text-emerald-400 hover:bg-emerald-500/10 w-full"
                  >
                    Iniciar Sesión
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Help Text for Non-logged Users */}
          {!currentUserId && (
            <div className="text-center mt-8">
              <p className="text-neutral-500 text-sm">
                Inicia sesión para acceder a programas personalizados con IA y hacer seguimiento de tu progreso
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ResourceLibraryPage;