import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Calendar,
  BarChart3,
  TrendingUp,
  Clock,
  Filter,
  Mail,
  Printer,
  Share,
  CheckCircle2,
  AlertCircle,
  Eye,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppContext } from './AppProvider';
import { supabase } from '../utils/supabaseClient';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'health' | 'fitness' | 'nutrition' | 'comprehensive';
  frequency: 'daily' | 'weekly' | 'monthly';
  metrics: string[];
  isActive: boolean;
}

interface GeneratedReport {
  id: string;
  template: string;
  generatedAt: string;
  period: string;
  status: 'generating' | 'ready' | 'failed';
  downloadUrl?: string;
}

const ReportsTab: React.FC = () => {
  const { currentUserId } = useAppContext();
  const [selectedTemplate, setSelectedTemplate] = useState<string>('comprehensive');
  const [reportPeriod, setReportPeriod] = useState<'week' | 'month' | 'custom'>('week');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);

  const defaultTemplates: ReportTemplate[] = [
    {
      id: 'comprehensive',
      name: 'Reporte Integral',
      description: 'Análisis completo de todas las métricas de salud y bienestar',
      type: 'comprehensive',
      frequency: 'weekly',
      metrics: ['sleep', 'steps', 'hrv', 'weight', 'mood', 'stress', 'nutrition'],
      isActive: true
    },
    {
      id: 'fitness',
      name: 'Reporte de Fitness',
      description: 'Enfoque en métricas de actividad física y rendimiento',
      type: 'fitness',
      frequency: 'weekly',
      metrics: ['steps', 'workouts', 'hrv', 'recovery'],
      isActive: true
    },
    {
      id: 'health',
      name: 'Reporte de Salud',
      description: 'Métricas de salud general y bienestar',
      type: 'health',
      frequency: 'monthly',
      metrics: ['sleep', 'hrv', 'weight', 'stress', 'mood'],
      isActive: true
    },
    {
      id: 'nutrition',
      name: 'Reporte Nutricional',
      description: 'Análisis de patrones alimentarios y nutrición',
      type: 'nutrition',
      frequency: 'weekly',
      metrics: ['nutrition', 'weight', 'energy'],
      isActive: true
    }
  ];

  useEffect(() => {
    setTemplates(defaultTemplates);
    loadGeneratedReports();
  }, [currentUserId]);

  const loadGeneratedReports = () => {
    // Simulated data - in a real app, this would come from the backend
    const mockReports: GeneratedReport[] = [
      {
        id: '1',
        template: 'Reporte Integral',
        generatedAt: new Date().toISOString(),
        period: 'Semana del 7-13 Jul 2025',
        status: 'ready'
      },
      {
        id: '2',
        template: 'Reporte de Fitness',
        generatedAt: subDays(new Date(), 7).toISOString(),
        period: 'Semana del 30 Jun - 6 Jul 2025',
        status: 'ready'
      },
      {
        id: '3',
        template: 'Reporte de Salud',
        generatedAt: subDays(new Date(), 30).toISOString(),
        period: 'Junio 2025',
        status: 'ready'
      }
    ];
    setGeneratedReports(mockReports);
  };

  const fetchReportData = async (startDate: Date, endDate: Date) => {
    if (!currentUserId) return null;

    try {
      // Fetch biometric data for the period
      const { data: biometricData, error } = await supabase
        .from('biometric_entries')
        .select('metric_type, value_numeric, entry_date, unit')
        .eq('user_id', currentUserId)
        .gte('entry_date', format(startDate, 'yyyy-MM-dd'))
        .lte('entry_date', format(endDate, 'yyyy-MM-dd'))
        .order('entry_date', { ascending: true });

      if (error) throw error;

      // Process and aggregate data
      const processedData: any = {};
      
      // Group by metric type and calculate averages/totals
      biometricData?.forEach(entry => {
        if (!processedData[entry.metric_type]) {
          processedData[entry.metric_type] = [];
        }
        processedData[entry.metric_type].push({
          value: entry.value_numeric,
          date: entry.entry_date,
          unit: entry.unit
        });
      });

      // Calculate summaries
      const summaries = Object.keys(processedData).reduce((acc, metric) => {
        const values = processedData[metric].map((item: any) => item.value);
        const unit = processedData[metric][0]?.unit || '';
        
        if (metric === 'steps') {
          acc[metric] = {
            total: values.reduce((sum: number, val: number) => sum + val, 0),
            average: values.reduce((sum: number, val: number) => sum + val, 0) / values.length,
            max: Math.max(...values),
            min: Math.min(...values),
            unit: unit
          };
        } else {
          acc[metric] = {
            average: values.reduce((sum: number, val: number) => sum + val, 0) / values.length,
            max: Math.max(...values),
            min: Math.min(...values),
            unit: unit
          };
        }
        
        return acc;
      }, {} as any);

      return {
        rawData: processedData,
        summaries,
        period: {
          start: format(startDate, 'dd/MM/yyyy'),
          end: format(endDate, 'dd/MM/yyyy')
        }
      };
    } catch (error) {
      console.error('Error fetching report data:', error);
      return null;
    }
  };

  const generatePDFReport = async () => {
    if (!currentUserId) return;

    setIsGenerating(true);
    try {
      // Determine date range based on period selection
      let startDate: Date;
      let endDate: Date;

      switch (reportPeriod) {
        case 'week':
          startDate = startOfWeek(new Date(), { weekStartsOn: 1 });
          endDate = endOfWeek(new Date(), { weekStartsOn: 1 });
          break;
        case 'month':
          startDate = startOfMonth(new Date());
          endDate = endOfMonth(new Date());
          break;
        case 'custom':
          if (!customStartDate || !customEndDate) {
            alert('Por favor selecciona las fechas de inicio y fin');
            return;
          }
          startDate = new Date(customStartDate);
          endDate = new Date(customEndDate);
          break;
        default:
          startDate = startOfWeek(new Date());
          endDate = endOfWeek(new Date());
      }

      // Fetch data for the report
      const reportData = await fetchReportData(startDate, endDate);
      if (!reportData) {
        alert('Error al obtener los datos del reporte');
        return;
      }

      // Create PDF
      const pdf = new jsPDF();
      const selectedTemplateData = templates.find(t => t.id === selectedTemplate);
      
      // Header
      pdf.setFontSize(20);
      pdf.setTextColor(139, 92, 246); // violet-500
      pdf.text('NGX Pulse', 20, 25);
      
      pdf.setFontSize(16);
      pdf.setTextColor(0, 0, 0);
      pdf.text(selectedTemplateData?.name || 'Reporte de Salud', 20, 40);
      
      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Período: ${reportData.period.start} - ${reportData.period.end}`, 20, 50);
      pdf.text(`Generado: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 20, 60);

      let yPosition = 80;

      // Summary section
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Resumen Ejecutivo', 20, yPosition);
      yPosition += 15;

      // Create summary table
      const summaryData = Object.entries(reportData.summaries).map(([metric, data]: [string, any]) => {
        const metricNames: Record<string, string> = {
          sleep_hours: 'Horas de Sueño',
          steps: 'Pasos',
          hrv: 'HRV',
          weight: 'Peso',
          mood: 'Estado de Ánimo',
          stress: 'Estrés'
        };

        const name = metricNames[metric] || metric;
        const avg = data.average ? data.average.toFixed(1) : 'N/A';
        const max = data.max ? data.max.toFixed(1) : 'N/A';
        const min = data.min ? data.min.toFixed(1) : 'N/A';
        const unit = data.unit || '';

        return [name, `${avg} ${unit}`, `${max} ${unit}`, `${min} ${unit}`];
      });

      pdf.autoTable({
        head: [['Métrica', 'Promedio', 'Máximo', 'Mínimo']],
        body: summaryData,
        startY: yPosition,
        styles: {
          fontSize: 10,
          cellPadding: 5
        },
        headStyles: {
          fillColor: [139, 92, 246],
          textColor: 255
        }
      });

      yPosition = (pdf as any).lastAutoTable.finalY + 20;

      // Recommendations section
      pdf.setFontSize(14);
      pdf.text('Recomendaciones', 20, yPosition);
      yPosition += 15;

      const recommendations = generateRecommendations(reportData.summaries);
      pdf.setFontSize(10);
      recommendations.forEach(rec => {
        pdf.text(`• ${rec}`, 20, yPosition);
        yPosition += 10;
      });

      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text('Este reporte fue generado automáticamente por NGX Pulse', 20, pdf.internal.pageSize.height - 20);

      // Save PDF
      const fileName = `ngx-pulse-${selectedTemplate}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      pdf.save(fileName);

      // Add to generated reports list
      const newReport: GeneratedReport = {
        id: Date.now().toString(),
        template: selectedTemplateData?.name || 'Reporte Personalizado',
        generatedAt: new Date().toISOString(),
        period: `${reportData.period.start} - ${reportData.period.end}`,
        status: 'ready'
      };

      setGeneratedReports(prev => [newReport, ...prev]);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error al generar el reporte PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateRecommendations = (summaries: any): string[] => {
    const recommendations: string[] = [];

    if (summaries.sleep_hours?.average < 7) {
      recommendations.push('Considera aumentar tus horas de sueño para mejorar la recuperación');
    }

    if (summaries.steps?.average < 8000) {
      recommendations.push('Intenta incrementar tu actividad física diaria para alcanzar 10,000 pasos');
    }

    if (summaries.stress?.average > 6) {
      recommendations.push('Practica técnicas de manejo del estrés como meditación o yoga');
    }

    if (summaries.hrv?.average < 30) {
      recommendations.push('Un HRV bajo puede indicar fatiga - considera más días de descanso');
    }

    if (recommendations.length === 0) {
      recommendations.push('¡Excelente trabajo! Mantén tus hábitos saludables actuales');
    }

    return recommendations;
  };

  const exportToCSV = async () => {
    if (!currentUserId) return;

    // Determine date range
    let startDate: Date;
    let endDate: Date;

    switch (reportPeriod) {
      case 'week':
        startDate = startOfWeek(new Date());
        endDate = endOfWeek(new Date());
        break;
      case 'month':
        startDate = startOfMonth(new Date());
        endDate = endOfMonth(new Date());
        break;
      case 'custom':
        if (!customStartDate || !customEndDate) return;
        startDate = new Date(customStartDate);
        endDate = new Date(customEndDate);
        break;
      default:
        startDate = startOfWeek(new Date());
        endDate = endOfWeek(new Date());
    }

    // Fetch and export data
    try {
      const { data: biometricData } = await supabase
        .from('biometric_entries')
        .select('metric_type, value_numeric, entry_date, unit')
        .eq('user_id', currentUserId)
        .gte('entry_date', format(startDate, 'yyyy-MM-dd'))
        .lte('entry_date', format(endDate, 'yyyy-MM-dd'))
        .order('entry_date', { ascending: true });

      if (!biometricData) return;

      const csvContent = [
        ['Fecha', 'Métrica', 'Valor', 'Unidad'],
        ...biometricData.map(entry => [
          entry.entry_date,
          entry.metric_type,
          entry.value_numeric.toString(),
          entry.unit || ''
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ngx-pulse-data-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting CSV:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Reports Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Centro de Reportes</h2>
          <p className="text-sm text-neutral-400">Genera y gestiona reportes detallados de tu progreso</p>
        </div>
      </div>

      <Tabs defaultValue="generate" className="w-full">
        <TabsList className="bg-neutral-800/60 border border-neutral-700/70 p-1 rounded-lg">
          <TabsTrigger value="generate" className="text-xs">Generar Reporte</TabsTrigger>
          <TabsTrigger value="history" className="text-xs">Historial</TabsTrigger>
          <TabsTrigger value="templates" className="text-xs">Plantillas</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Report Configuration */}
            <div className="lg:col-span-2 space-y-6">
              <div className="ngx-card">
                <h3 className="text-lg font-semibold text-white mb-4">Configuración del Reporte</h3>
                
                <div className="space-y-4">
                  {/* Template Selection */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Plantilla de Reporte
                    </label>
                    <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                      <SelectTrigger className="bg-neutral-800 border-neutral-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-neutral-800 border-neutral-700">
                        {templates.map(template => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-neutral-500 mt-1">
                      {templates.find(t => t.id === selectedTemplate)?.description}
                    </p>
                  </div>

                  {/* Period Selection */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Período de Tiempo
                    </label>
                    <Select value={reportPeriod} onValueChange={(value: 'week' | 'month' | 'custom') => setReportPeriod(value)}>
                      <SelectTrigger className="bg-neutral-800 border-neutral-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-neutral-800 border-neutral-700">
                        <SelectItem value="week">Esta Semana</SelectItem>
                        <SelectItem value="month">Este Mes</SelectItem>
                        <SelectItem value="custom">Personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Custom Date Range */}
                  {reportPeriod === 'custom' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-neutral-400 mb-1">Fecha Inicio</label>
                        <input
                          type="date"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                          className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-neutral-400 mb-1">Fecha Fin</label>
                        <input
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                          className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-white text-sm"
                        />
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={generatePDFReport}
                      disabled={isGenerating}
                      className="bg-violet-600 hover:bg-violet-700 text-white"
                    >
                      {isGenerating ? (
                        <>
                          <Clock size={16} className="mr-2 animate-spin" />
                          Generando...
                        </>
                      ) : (
                        <>
                          <FileText size={16} className="mr-2" />
                          Generar PDF
                        </>
                      )}
                    </Button>
                    
                    <Button
                      onClick={exportToCSV}
                      variant="outline"
                      className="bg-neutral-800 border-neutral-700 hover:bg-neutral-700"
                    >
                      <Download size={16} className="mr-2" />
                      Exportar CSV
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-6">
              <div className="ngx-card">
                <h3 className="text-lg font-semibold text-white mb-4">Vista Previa</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Plantilla:</span>
                    <span className="text-white">{templates.find(t => t.id === selectedTemplate)?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Período:</span>
                    <span className="text-white">
                      {reportPeriod === 'week' ? 'Esta Semana' : 
                       reportPeriod === 'month' ? 'Este Mes' : 
                       'Personalizado'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Métricas:</span>
                    <span className="text-white">{templates.find(t => t.id === selectedTemplate)?.metrics.length || 0}</span>
                  </div>
                </div>
              </div>

              <div className="ngx-card">
                <h3 className="text-lg font-semibold text-white mb-4">Formatos Disponibles</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-neutral-800/50 rounded-lg">
                    <FileText size={20} className="text-red-400" />
                    <div>
                      <p className="text-white text-sm font-medium">PDF</p>
                      <p className="text-xs text-neutral-400">Reporte completo con gráficos</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-neutral-800/50 rounded-lg">
                    <BarChart3 size={20} className="text-green-400" />
                    <div>
                      <p className="text-white text-sm font-medium">CSV</p>
                      <p className="text-xs text-neutral-400">Datos brutos para análisis</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <div className="ngx-card">
            <h3 className="text-lg font-semibold text-white mb-4">Reportes Generados</h3>
            
            {generatedReports.length === 0 ? (
              <div className="text-center py-12">
                <FileText size={48} className="mx-auto text-neutral-600 mb-4" />
                <p className="text-neutral-400">No hay reportes generados aún</p>
                <p className="text-sm text-neutral-500">Genera tu primer reporte desde la pestaña anterior</p>
              </div>
            ) : (
              <div className="space-y-3">
                {generatedReports.map(report => (
                  <div key={report.id} className="flex items-center justify-between p-4 bg-neutral-800/50 rounded-lg border border-neutral-700/50">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-violet-600/20">
                        <FileText size={20} className="text-violet-400" />
                      </div>
                      <div>
                        <h4 className="text-white font-medium">{report.template}</h4>
                        <p className="text-sm text-neutral-400">{report.period}</p>
                        <p className="text-xs text-neutral-500">
                          Generado {format(new Date(report.generatedAt), 'dd/MM/yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {report.status === 'ready' && (
                        <CheckCircle2 size={16} className="text-green-400" />
                      )}
                      {report.status === 'generating' && (
                        <Clock size={16} className="text-yellow-400 animate-spin" />
                      )}
                      {report.status === 'failed' && (
                        <AlertCircle size={16} className="text-red-400" />
                      )}
                      
                      <Button size="sm" variant="outline" className="bg-neutral-800 border-neutral-700">
                        <Eye size={14} className="mr-1" />
                        Ver
                      </Button>
                      <Button size="sm" variant="outline" className="bg-neutral-800 border-neutral-700">
                        <Download size={14} className="mr-1" />
                        Descargar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {templates.map(template => (
              <div key={template.id} className="ngx-card group hover:bg-neutral-800/50 transition-all duration-200">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-white font-semibold">{template.name}</h3>
                    <p className="text-sm text-neutral-400 mt-1">{template.description}</p>
                  </div>
                  <Button size="sm" variant="outline" className="bg-neutral-800 border-neutral-700">
                    <Settings size={14} />
                  </Button>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar size={14} className="text-neutral-400" />
                    <span className="text-neutral-300">Frecuencia: {template.frequency}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <BarChart3 size={14} className="text-neutral-400" />
                    <span className="text-neutral-300">{template.metrics.length} métricas incluidas</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {template.metrics.slice(0, 4).map(metric => (
                      <span key={metric} className="px-2 py-1 bg-violet-600/20 text-violet-400 text-xs rounded">
                        {metric}
                      </span>
                    ))}
                    {template.metrics.length > 4 && (
                      <span className="px-2 py-1 bg-neutral-700 text-neutral-400 text-xs rounded">
                        +{template.metrics.length - 4} más
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsTab;