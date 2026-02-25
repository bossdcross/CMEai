import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, api } from "../App";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Stethoscope, Heart, UserCog, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";

const Onboarding = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [selectedProfession, setSelectedProfession] = useState(null);
  const [loading, setLoading] = useState(false);

  const professions = [
    {
      id: "physician",
      title: "Physician (MD/DO)",
      description: "AMA PRA, AOA, MOC credits",
      icon: Stethoscope,
      credits: ["AMA PRA Category 1", "AMA PRA Category 2", "AOA Category 1-A/1-B", "MOC/MOL", "Self-Assessment"]
    },
    {
      id: "np_pa",
      title: "Nurse Practitioner / PA",
      description: "AANP, AAPA, Pharmacology",
      icon: UserCog,
      credits: ["AANP Contact Hours", "AAPA Category 1", "AMA PRA Category 1", "Pharmacology CE"]
    },
    {
      id: "nurse",
      title: "Registered Nurse",
      description: "ANCC, CNE, Specialty CE",
      icon: Heart,
      credits: ["ANCC Contact Hours", "CNE Credits", "Pharmacology CE", "Specialty CE"]
    }
  ];

  const handleSubmit = async () => {
    if (!selectedProfession) {
      toast.error("Please select your profession");
      return;
    }

    setLoading(true);
    try {
      const response = await api.put("/users/profession", { profession: selectedProfession });
      updateUser(response.data);
      toast.success("Profile updated successfully!");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      toast.error("Failed to update profile. Please try again.");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="max-w-3xl w-full animate-fade-in-up">
        <div className="text-center mb-8">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
            Welcome, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="mt-3 text-lg text-slate-600">
            Select your profession to personalize your CME tracking experience.
          </p>
        </div>

        <div className="grid gap-4">
          {professions.map((profession) => (
            <Card
              key={profession.id}
              className={`cursor-pointer transition-all border-2 ${
                selectedProfession === profession.id
                  ? "border-indigo-600 bg-indigo-50/50 shadow-md"
                  : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
              }`}
              onClick={() => setSelectedProfession(profession.id)}
              data-testid={`profession-${profession.id}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${
                    selectedProfession === profession.id
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}>
                    <profession.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-heading font-semibold text-lg text-slate-900">
                        {profession.title}
                      </h3>
                      {selectedProfession === profession.id && (
                        <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-slate-500 text-sm mt-1">{profession.description}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {profession.credits.slice(0, 4).map((credit, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700"
                        >
                          {credit}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <Button
            onClick={handleSubmit}
            disabled={!selectedProfession || loading}
            size="lg"
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm font-medium transition-all btn-active flex items-center gap-2 min-w-[200px]"
            data-testid="continue-btn"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
