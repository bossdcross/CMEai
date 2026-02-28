import { useState, useEffect } from "react";
import { api } from "../App";
import Layout from "../components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  BarChart3,
  FileText,
  FileSpreadsheet,
  Globe,
  Award,
  Calendar,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from "lucide-react";
import { toast } from "sonner";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line
} from "recharts";

const Reports = () => {
  const [reportData, setReportData] = useState(null);
  const [yoyData, setYoyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [exporting, setExporting] = useState(null);
  const [activeTab, setActiveTab] = useState("current");

  // Generate years from current year back to 1990
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1989 }, (_, i) => currentYear - i);

  useEffect(() => {
    fetchReportData();
  }, [selectedYear]);

  useEffect(() => {
    if (activeTab === "comparison") {
      fetchYoyData();
    }
  }, [activeTab]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/reports/summary?year=${selectedYear}`);
      setReportData(response.data);
    } catch (error) {
      toast.error("Failed to load report data");
    } finally {
      setLoading(false);
    }
  };

  const fetchYoyData = async () => {
    try {
      const response = await api.get(`/reports/year-over-year?start_year=${currentYear - 4}&end_year=${currentYear}`);
      setYoyData(response.data);
    } catch (error) {
      toast.error("Failed to load comparison data");
    }
  };

  const handleExport = async (format) => {
    setExporting(format);
    try {
      const response = await api.get(`/reports/export/${format}?year=${selectedYear}`, {
        responseType: format === "html" ? "text" : "blob"
      });

      if (format === "html") {
        const newWindow = window.open("", "_blank");
        newWindow.document.write(response.data);
        newWindow.document.close();
      } else {
        const blob = new Blob([response.data]);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `cme_transcript_${selectedYear}.${format === "pdf" ? "pdf" : "xlsx"}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }

      toast.success(`${format.toUpperCase()} export successful!`);
    } catch (error) {
      toast.error(`Failed to export ${format.toUpperCase()}`);
      console.error("Export error:", error);
    } finally {
      setExporting(null);
    }
  };

  const getCreditTypeName = (typeId) => {
    const typeNames = {
      ama_cat1: "AMA Category 1",
      ama_cat2: "AMA Category 2",
      aoa_1a: "AOA 1-A",
      aoa_1b: "AOA 1-B",
      moc: "MOC/MOL",
      self_assessment: "Self-Assessment",
      aanp_contact: "AANP Contact",
      aapa_cat1: "AAPA Category 1",
      ancc_contact: "ANCC Contact",
      pharmacology: "Pharmacology",
      cne: "CNE",
      specialty: "Specialty CE",
      ethics: "Ethics",
      cultural: "Cultural Competency",
      pain_mgmt: "Pain Management"
    };
    return typeNames[typeId] || typeId;
  };

  const CHART_COLORS = ["#4F46E5", "#0EA5E9", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

  const getYoyChange = (index) => {
    if (!yoyData || index === 0) return null;
    const current = yoyData.years[index].total_credits;
    const previous = yoyData.years[index - 1].total_credits;
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  const chartData = Object.entries(reportData?.by_credit_type || {}).map(([key, value], index) => ({
    name: getCreditTypeName(key),
    value: value.credits,
    count: value.count,
    color: CHART_COLORS[index % CHART_COLORS.length]
  }));

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              Reports & Transcripts
            </h1>
            <p className="mt-1 text-slate-500">
              Generate and export your CME transcript
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
            <TabsTrigger value="current" data-testid="tab-current-year">
              <Calendar className="w-4 h-4 mr-2" />
              Current Year
            </TabsTrigger>
            <TabsTrigger value="comparison" data-testid="tab-comparison">
              <TrendingUp className="w-4 h-4 mr-2" />
              Year Comparison
            </TabsTrigger>
          </TabsList>

          {/* Current Year Tab */}
          <TabsContent value="current" className="space-y-6 mt-6">
            {/* Year Selector */}
            <div className="flex items-center gap-3">
              <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                <SelectTrigger className="w-[140px]" data-testid="year-select">
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-slate-200 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <Award className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Total Certificates</p>
                      <p className="font-heading text-2xl font-bold text-slate-900">
                        {reportData?.total_certificates || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-slate-200 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Total Credits</p>
                      <p className="font-heading text-2xl font-bold text-slate-900">
                        {reportData?.total_credits || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-slate-200 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-sky-100 flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-sky-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Credit Types</p>
                      <p className="font-heading text-2xl font-bold text-slate-900">
                        {Object.keys(reportData?.by_credit_type || {}).length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Export Actions */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="font-heading text-lg font-semibold text-slate-900">
                  Export Transcript
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={() => handleExport("pdf")}
                    disabled={exporting !== null}
                    className="bg-red-600 hover:bg-red-700"
                    data-testid="export-pdf-btn"
                  >
                    {exporting === "pdf" ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <FileText className="w-4 h-4 mr-2" />
                    )}
                    Export PDF
                  </Button>
                  <Button
                    onClick={() => handleExport("excel")}
                    disabled={exporting !== null}
                    className="bg-emerald-600 hover:bg-emerald-700"
                    data-testid="export-excel-btn"
                  >
                    {exporting === "excel" ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                    )}
                    Export Excel
                  </Button>
                  <Button
                    onClick={() => handleExport("html")}
                    disabled={exporting !== null}
                    variant="outline"
                    className="border-slate-200"
                    data-testid="export-html-btn"
                  >
                    {exporting === "html" ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mr-2"></div>
                    ) : (
                      <Globe className="w-4 h-4 mr-2" />
                    )}
                    Print / View HTML
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Charts & Data */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Credits by Type Chart */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="font-heading text-lg font-semibold text-slate-900">
                    Credits by Type
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {chartData.length === 0 ? (
                    <div className="text-center py-8">
                      <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500">No data for {selectedYear}</p>
                    </div>
                  ) : (
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
                                    <p className="font-medium text-slate-900">{payload[0].name}</p>
                                    <p className="text-sm text-slate-600">
                                      {payload[0].value} credits ({payload[0].payload.count} certs)
                                    </p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Legend
                            formatter={(value) => <span className="text-sm text-slate-600">{value}</span>}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Credit Type Breakdown */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="font-heading text-lg font-semibold text-slate-900">
                    Credit Type Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {Object.keys(reportData?.by_credit_type || {}).length === 0 ? (
                    <div className="text-center py-8">
                      <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500">No certificates for {selectedYear}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(reportData?.by_credit_type || {}).map(([key, value], index) => (
                        <div
                          key={key}
                          className="flex items-center justify-between p-3 rounded-lg bg-slate-50"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                            ></div>
                            <span className="font-medium text-slate-900">{getCreditTypeName(key)}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge variant="secondary" className="bg-white">
                              {value.count} cert{value.count !== 1 ? "s" : ""}
                            </Badge>
                            <span className="font-heading font-bold text-indigo-600">
                              {value.credits} credits
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Certificates Table */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="font-heading text-lg font-semibold text-slate-900">
                  Certificates for {selectedYear}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {(reportData?.certificates || []).length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No certificates for {selectedYear}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="data-table">Title</TableHead>
                          <TableHead className="data-table">Provider</TableHead>
                          <TableHead className="data-table">Credits</TableHead>
                          <TableHead className="data-table">Types</TableHead>
                          <TableHead className="data-table">Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(reportData?.certificates || []).map((cert) => {
                          const creditTypes = cert.credit_types || (cert.credit_type ? [cert.credit_type] : []);
                          return (
                            <TableRow key={cert.certificate_id}>
                              <TableCell className="font-medium max-w-[250px] truncate">
                                {cert.title}
                              </TableCell>
                              <TableCell className="text-slate-600 max-w-[150px] truncate">
                                {cert.provider}
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="bg-indigo-50 text-indigo-700">
                                  {cert.credits}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {creditTypes.slice(0, 2).map((type, idx) => (
                                    <span key={idx} className="text-xs text-slate-600">
                                      {getCreditTypeName(type)}
                                      {idx < Math.min(creditTypes.length, 2) - 1 && ", "}
                                    </span>
                                  ))}
                                  {creditTypes.length > 2 && (
                                    <span className="text-xs text-slate-400">+{creditTypes.length - 2}</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-slate-600">
                                {cert.completion_date}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Year Comparison Tab */}
          <TabsContent value="comparison" className="space-y-6 mt-6">
            {!yoyData ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <>
                {/* Year over Year Cards */}
                <div className="grid gap-4 md:grid-cols-5">
                  {yoyData.years.map((yearData, index) => {
                    const change = getYoyChange(index);
                    return (
                      <Card key={yearData.year} className="border-slate-200 shadow-sm">
                        <CardContent className="p-4">
                          <p className="text-sm text-slate-500 mb-1">{yearData.year}</p>
                          <p className="font-heading text-2xl font-bold text-slate-900">
                            {yearData.total_credits}
                          </p>
                          <p className="text-xs text-slate-500">{yearData.total_certificates} certs</p>
                          {change !== null && (
                            <div className={`flex items-center gap-1 mt-2 text-sm ${
                              parseFloat(change) > 0 ? "text-emerald-600" :
                              parseFloat(change) < 0 ? "text-red-600" : "text-slate-500"
                            }`}>
                              {parseFloat(change) > 0 ? (
                                <ArrowUpRight className="w-4 h-4" />
                              ) : parseFloat(change) < 0 ? (
                                <ArrowDownRight className="w-4 h-4" />
                              ) : (
                                <Minus className="w-4 h-4" />
                              )}
                              <span>{Math.abs(parseFloat(change))}%</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Bar Chart */}
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="font-heading text-lg font-semibold text-slate-900">
                      Credits Over Time
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={yoyData.years}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="year" stroke="#64748b" />
                          <YAxis stroke="#64748b" />
                          <Tooltip
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
                                    <p className="font-medium text-slate-900">{label}</p>
                                    <p className="text-sm text-slate-600">
                                      {payload[0].value} credits
                                    </p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar dataKey="total_credits" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Line Chart */}
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="font-heading text-lg font-semibold text-slate-900">
                      Certificates Over Time
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={yoyData.years}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="year" stroke="#64748b" />
                          <YAxis stroke="#64748b" />
                          <Tooltip
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
                                    <p className="font-medium text-slate-900">{label}</p>
                                    <p className="text-sm text-slate-600">
                                      {payload[0].value} certificates
                                    </p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="total_certificates" 
                            stroke="#10B981" 
                            strokeWidth={2}
                            dot={{ fill: "#10B981" }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Reports;
