import { useAuth } from "../App";
import { Navigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Award, FileText, Target, ScanLine, CheckCircle, ArrowRight } from "lucide-react";

const Landing = () => {
  const { user, loading, login } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to={user.profession ? "/dashboard" : "/onboarding"} replace />;
  }

  const features = [
    {
      icon: Award,
      title: "Track CME Credits",
      description: "Organize certificates by type and approval body"
    },
    {
      icon: Target,
      title: "Set Goals",
      description: "Track license renewal and recertification progress"
    },
    {
      icon: ScanLine,
      title: "Quick Import",
      description: "Scan EEDS QR codes or upload certificates"
    },
    {
      icon: FileText,
      title: "Export Transcripts",
      description: "Generate PDF, Excel, or printable reports"
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
              <Award className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading font-bold text-xl text-slate-900">CME Tracker</span>
          </div>
          <Button 
            onClick={login}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm font-medium transition-all btn-active"
            data-testid="header-sign-in-btn"
          >
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-sky-50/50"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in-up">
              <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight">
                Manage Your CME Credits with{" "}
                <span className="text-indigo-600">Confidence</span>
              </h1>
              <p className="mt-6 text-lg text-slate-600 leading-relaxed max-w-xl">
                Track continuing education, set goals for license renewal and board recertification, 
                and generate professional transcripts — all in one place.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={login}
                  size="lg"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm font-medium transition-all btn-active flex items-center gap-2"
                  data-testid="hero-get-started-btn"
                >
                  Get Started Free
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
              <div className="mt-8 flex items-center gap-4 text-sm text-slate-500">
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Free forever</span>
                </div>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-sky-500 rounded-2xl blur-3xl opacity-20"></div>
                <img 
                  src="https://images.pexels.com/photos/35260793/pexels-photo-35260793.jpeg" 
                  alt="Healthcare professional"
                  className="relative rounded-2xl shadow-2xl w-full object-cover aspect-[4/3]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl font-semibold text-slate-900 tracking-tight">
              Everything You Need to Stay Compliant
            </h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              Designed for physicians, nurse practitioners, PAs, and nurses.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="p-6 rounded-xl bg-slate-50 border border-slate-100 card-hover"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="font-heading font-semibold text-lg text-slate-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-indigo-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-white tracking-tight">
            Start Tracking Your CME Credits Today
          </h2>
          <p className="mt-4 text-lg text-indigo-100 max-w-2xl mx-auto">
            Join healthcare professionals who trust CME Tracker to manage their continuing education.
          </p>
          <Button 
            onClick={login}
            size="lg"
            className="mt-8 bg-white text-indigo-600 hover:bg-indigo-50 rounded-lg shadow-sm font-medium transition-all btn-active"
            data-testid="cta-sign-in-btn"
          >
            Sign In with Google
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} CME Tracker. Built for healthcare professionals.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
