import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth, api } from "../App";
import Layout from "../components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { Badge } from "../components/ui/badge";
import {
  Award,
  Target,
  Calendar,
  TrendingUp,
  UploadCloud,
  ScanLine,
  FileText,
  ChevronRight,
  Clock,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get("/dashboard");
      setDashboardData(response.data);
    } catch (error) {
      toast.error("Failed to load dashboard data");
      console.error("Dashboard error:", error);
    } finally {
      setLoading(false);
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

  const getDaysUntilDue = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    return diff;
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

  const requirements = dashboardData?.requirements || [];
  const recentCerts = dashboardData?.recent_certificates || [];
  const creditsByType = dashboardData?.credits_by_type || [];
  const totalCredits = dashboardData?.total_credits_this_year || 0;

  // Calculate overall progress
  const totalRequired = requirements.reduce((sum, r) => sum + r.credits_required, 0);
  const totalEarned = requirements.reduce((sum, r) => sum + r.credits_earned, 0);
  const overallProgress = totalRequired > 0 ? Math.min((totalEarned / totalRequired) * 100, 100) : 0;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              Welcome back, {user?.name?.split(' ')[0]}
            </h1>
            <p className="mt-1 text-slate-500">
              Here's your CME progress for {dashboardData?.year}
            </p>
          </div>
          <div className="flex gap-3">
            <Button asChild variant="outline" className="border-slate-200">
              <Link to="/scanner" data-testid="scan-qr-btn">
                <ScanLine className="w-4 h-4 mr-2" />
                Scan QR
              </Link>
            </Button>
            <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
              <Link to="/certificates" data-testid="add-certificate-btn">
                <UploadCloud className="w-4 h-4 mr-2" />
                Add Certificate
              </Link>
            </Button>
          </div>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-12 gap-4 md:gap-6">
          {/* Progress Overview - Large Card */}
          <Card className="col-span-12 md:col-span-8 border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-lg font-semibold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                Overall Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                {/* Progress Ring */}
                <div className="relative w-32 h-32 mx-auto md:mx-0 shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#e2e8f0"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#4F46E5"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${overallProgress * 2.512} 251.2`}
                      className="transition-all duration-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-heading text-2xl font-bold text-slate-900">
                      {Math.round(overallProgress)}%
                    </span>
                    <span className="text-xs text-slate-500">Complete</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-slate-50">
                    <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                      <Award className="w-4 h-4" />
                      Credits Earned
                    </div>
                    <p className="font-heading text-2xl font-bold text-slate-900">{totalCredits}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-50">
                    <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                      <Target className="w-4 h-4" />
                      Active Goals
                    </div>
                    <p className="font-heading text-2xl font-bold text-slate-900">{requirements.length}</p>
                  </div>
                </div>
              </div>

              {/* Credit Breakdown */}
              {creditsByType.length > 0 && (
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <p className="text-sm font-medium text-slate-700 mb-3">Credits by Type</p>
                  <div className="flex flex-wrap gap-2">
                    {creditsByType.map((item) => (
                      <Badge 
                        key={item._id} 
                        variant="secondary"
                        className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                      >
                        {getCreditTypeName(item._id)}: {item.total}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Deadlines */}
          <Card className="col-span-12 md:col-span-4 border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-500" />
                Upcoming Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent>
              {requirements.length === 0 ? (
                <div className="text-center py-6">
                  <Target className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No requirements set yet</p>
                  <Button asChild variant="link" className="mt-2 text-indigo-600">
                    <Link to="/requirements">Add your first goal</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {requirements.slice(0, 4).map((req) => {
                    const daysLeft = getDaysUntilDue(req.due_date);
                    const progress = req.credits_required > 0 
                      ? Math.min((req.credits_earned / req.credits_required) * 100, 100)
                      : 0;
                    const isUrgent = daysLeft <= 30 && progress < 100;

                    return (
                      <div key={req.requirement_id} className="p-3 rounded-lg bg-slate-50">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="text-sm font-medium text-slate-900 line-clamp-1">
                            {req.name}
                          </p>
                          {isUrgent && (
                            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                          )}
                        </div>
                        <Progress value={progress} className="h-1.5 mb-2" />
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">
                            {req.credits_earned}/{req.credits_required} credits
                          </span>
                          <span className={`flex items-center gap-1 ${isUrgent ? 'text-amber-600' : 'text-slate-500'}`}>
                            <Clock className="w-3 h-3" />
                            {daysLeft > 0 ? `${daysLeft} days` : 'Due'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <Button asChild variant="ghost" className="w-full text-indigo-600 hover:text-indigo-700">
                    <Link to="/requirements" className="flex items-center justify-center gap-1">
                      View all
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="col-span-12 md:col-span-4 border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-lg font-semibold text-slate-900">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild variant="outline" className="w-full justify-start border-slate-200 hover:bg-slate-50">
                <Link to="/certificates" data-testid="quick-upload-btn">
                  <UploadCloud className="w-4 h-4 mr-3 text-indigo-600" />
                  Upload Certificate
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start border-slate-200 hover:bg-slate-50">
                <Link to="/scanner" data-testid="quick-scan-btn">
                  <ScanLine className="w-4 h-4 mr-3 text-indigo-600" />
                  Scan EEDS QR Code
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start border-slate-200 hover:bg-slate-50">
                <Link to="/requirements" data-testid="quick-goal-btn">
                  <Target className="w-4 h-4 mr-3 text-indigo-600" />
                  Add Requirement
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start border-slate-200 hover:bg-slate-50">
                <Link to="/reports" data-testid="quick-report-btn">
                  <FileText className="w-4 h-4 mr-3 text-indigo-600" />
                  Generate Report
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Recent Certificates */}
          <Card className="col-span-12 md:col-span-8 border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="font-heading text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-500" />
                  Recent Certificates
                </CardTitle>
                <Button asChild variant="ghost" size="sm" className="text-indigo-600">
                  <Link to="/certificates">View all</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentCerts.length === 0 ? (
                <div className="text-center py-8">
                  <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 mb-3">No certificates yet</p>
                  <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
                    <Link to="/certificates">Add your first certificate</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentCerts.map((cert) => (
                    <div
                      key={cert.certificate_id}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                          <Award className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {cert.title}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {cert.provider} • {cert.completion_date}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="shrink-0 bg-emerald-50 text-emerald-700">
                        {cert.credits} credits
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
