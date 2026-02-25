import { useState } from "react";
import { useAuth, api } from "../App";
import Layout from "../components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import {
  User,
  Mail,
  Stethoscope,
  Heart,
  UserCog,
  LogOut,
  Check,
  ShieldCheck,
  AlertCircle,
  Loader2,
  X,
  BadgeCheck
} from "lucide-react";
import { toast } from "sonner";

const Settings = () => {
  const { user, updateUser, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [npiLoading, setNpiLoading] = useState(false);
  const [npiInput, setNpiInput] = useState("");
  const [selectedProfession, setSelectedProfession] = useState(user?.profession || "");

  const professions = [
    { id: "physician", name: "Physician (MD/DO)", icon: Stethoscope },
    { id: "np_pa", name: "Nurse Practitioner / PA", icon: UserCog },
    { id: "nurse", name: "Registered Nurse", icon: Heart }
  ];

  const handleProfessionChange = async (profession) => {
    setLoading(true);
    try {
      const response = await api.put("/users/profession", { profession });
      updateUser(response.data);
      setSelectedProfession(profession);
      toast.success("Profession updated successfully!");
    } catch (error) {
      toast.error("Failed to update profession");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNpiValidation = async () => {
    if (!npiInput || npiInput.length !== 10) {
      toast.error("Please enter a valid 10-digit NPI number");
      return;
    }

    setNpiLoading(true);
    try {
      const response = await api.post("/users/npi/validate", { npi: npiInput });
      updateUser(response.data.user);
      setNpiInput("");
      toast.success("NPI verified successfully!");
    } catch (error) {
      const message = error.response?.data?.detail || "Failed to validate NPI";
      toast.error(message);
      console.error("NPI Error:", error);
    } finally {
      setNpiLoading(false);
    }
  };

  const handleRemoveNpi = async () => {
    if (!window.confirm("Are you sure you want to remove your NPI?")) return;

    setNpiLoading(true);
    try {
      const response = await api.delete("/users/npi");
      updateUser(response.data.user);
      toast.success("NPI removed from profile");
    } catch (error) {
      toast.error("Failed to remove NPI");
    } finally {
      setNpiLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  const getProfessionInfo = (professionId) => {
    return professions.find(p => p.id === professionId) || professions[0];
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Settings
          </h1>
          <p className="mt-1 text-slate-500">
            Manage your account and preferences
          </p>
        </div>

        {/* Profile Card */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-lg font-semibold text-slate-900">
              Profile
            </CardTitle>
            <CardDescription>Your account information from Google</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user?.picture} alt={user?.name} />
                <AvatarFallback className="bg-indigo-100 text-indigo-600 text-xl font-semibold">
                  {user?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-heading font-semibold text-lg text-slate-900 flex items-center gap-2">
                  {user?.name}
                  {user?.npi_verified && (
                    <BadgeCheck className="w-5 h-5 text-emerald-500" />
                  )}
                </h3>
                <p className="text-slate-500 flex items-center gap-1.5">
                  <Mail className="w-4 h-4" />
                  {user?.email}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                <User className="w-4 h-4" />
                User ID
              </div>
              <p className="font-mono text-sm text-slate-700">{user?.user_id}</p>
            </div>
          </CardContent>
        </Card>

        {/* NPI Verification Card */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-lg font-semibold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              NPI Verification
            </CardTitle>
            <CardDescription>
              Link your National Provider Identifier for verified credentials
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {user?.npi_verified && user?.npi_data ? (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                        <BadgeCheck className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-medium text-emerald-800">NPI Verified</p>
                        <p className="text-sm text-emerald-700">
                          {user.npi_number}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleRemoveNpi}
                      disabled={npiLoading}
                      className="text-emerald-600 hover:text-red-600 hover:bg-red-50"
                      data-testid="remove-npi-btn"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">Provider Name</span>
                    <span className="font-medium text-slate-900">
                      {user.npi_data.first_name} {user.npi_data.last_name}
                      {user.npi_data.credential && `, ${user.npi_data.credential}`}
                    </span>
                  </div>
                  {user.npi_data.organization_name && (
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-500">Organization</span>
                      <span className="font-medium text-slate-900">{user.npi_data.organization_name}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">Entity Type</span>
                    <span className="font-medium text-slate-900">
                      {user.npi_data.entity_type === "NPI-1" ? "Individual" : "Organization"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">Status</span>
                    <Badge className="bg-emerald-50 text-emerald-700">
                      {user.npi_data.status || "Active"}
                    </Badge>
                  </div>
                  {user.npi_data.taxonomies && user.npi_data.taxonomies.length > 0 && (
                    <div className="py-2">
                      <span className="text-slate-500 block mb-2">Specialties</span>
                      <div className="flex flex-wrap gap-2">
                        {user.npi_data.taxonomies.map((tax, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {tax.desc}
                            {tax.primary && " (Primary)"}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                  <p className="text-sm text-amber-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>
                      Verify your NPI to add validated credentials to your profile. 
                      Your NPI will be looked up in the NPPES registry.
                    </span>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="npi">NPI Number</Label>
                  <div className="flex gap-2">
                    <Input
                      id="npi"
                      type="text"
                      placeholder="Enter 10-digit NPI"
                      value={npiInput}
                      onChange={(e) => setNpiInput(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      maxLength={10}
                      className="font-mono"
                      data-testid="npi-input"
                    />
                    <Button
                      onClick={handleNpiValidation}
                      disabled={npiLoading || npiInput.length !== 10}
                      className="bg-indigo-600 hover:bg-indigo-700 shrink-0"
                      data-testid="verify-npi-btn"
                    >
                      {npiLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <ShieldCheck className="w-4 h-4 mr-2" />
                      )}
                      Verify
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500">
                    Enter your 10-digit National Provider Identifier
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profession Card */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-lg font-semibold text-slate-900">
              Profession
            </CardTitle>
            <CardDescription>
              Your profession determines which CME credit types are displayed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              {professions.map((profession) => {
                const isSelected = user?.profession === profession.id;
                const ProfessionIcon = profession.icon;

                return (
                  <div
                    key={profession.id}
                    className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                    onClick={() => !loading && handleProfessionChange(profession.id)}
                    data-testid={`settings-profession-${profession.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
                      }`}>
                        <ProfessionIcon className="w-5 h-5" />
                      </div>
                      <span className="font-medium text-slate-900">{profession.name}</span>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {user?.profession && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <p className="text-sm text-emerald-700 flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  CME types are customized for {getProfessionInfo(user.profession).name}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-lg font-semibold text-slate-900">
              Account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              data-testid="settings-logout-btn"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Settings;
