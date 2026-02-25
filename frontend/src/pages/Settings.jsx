import { useState } from "react";
import { useAuth, api } from "../App";
import Layout from "../components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  User,
  Mail,
  Stethoscope,
  Heart,
  UserCog,
  LogOut,
  Check
} from "lucide-react";
import { toast } from "sonner";

const Settings = () => {
  const { user, updateUser, logout } = useAuth();
  const [loading, setLoading] = useState(false);
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
                <h3 className="font-heading font-semibold text-lg text-slate-900">
                  {user?.name}
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
