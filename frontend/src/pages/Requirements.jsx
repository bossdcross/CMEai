import { useState, useEffect } from "react";
import { api } from "../App";
import Layout from "../components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Textarea } from "../components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Target,
  Plus,
  Trash2,
  Edit,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Trophy
} from "lucide-react";
import { toast } from "sonner";

const Requirements = () => {
  const [requirements, setRequirements] = useState([]);
  const [cmeTypes, setCmeTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedReq, setSelectedReq] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    requirement_type: "",
    credit_type: "",
    credits_required: "",
    due_date: "",
    notes: ""
  });

  const requirementTypes = [
    { id: "license_renewal", name: "License Renewal" },
    { id: "board_recert", name: "Board Recertification" },
    { id: "hospital", name: "Hospital Requirement" },
    { id: "personal", name: "Personal Goal" }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [reqsRes, typesRes] = await Promise.all([
        api.get("/requirements?active_only=false"),
        api.get("/cme-types")
      ]);
      setRequirements(reqsRes.data);
      setCmeTypes(typesRes.data);
    } catch (error) {
      toast.error("Failed to load requirements");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await api.post("/requirements", {
        ...formData,
        credits_required: parseFloat(formData.credits_required)
      });
      toast.success("Requirement added successfully!");
      setShowAddDialog(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error("Failed to add requirement");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    try {
      await api.put(`/requirements/${selectedReq.requirement_id}`, {
        name: formData.name,
        credits_required: parseFloat(formData.credits_required),
        due_date: formData.due_date,
        notes: formData.notes,
        is_active: formData.is_active
      });
      toast.success("Requirement updated!");
      setShowEditDialog(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error("Failed to update requirement");
    }
  };

  const handleDelete = async (reqId) => {
    if (!window.confirm("Are you sure you want to delete this requirement?")) return;

    try {
      await api.delete(`/requirements/${reqId}`);
      toast.success("Requirement deleted");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete requirement");
    }
  };

  const openEditDialog = (req) => {
    setSelectedReq(req);
    setFormData({
      name: req.name,
      requirement_type: req.requirement_type,
      credit_type: req.credit_type || "",
      credits_required: req.credits_required.toString(),
      due_date: req.due_date,
      notes: req.notes || "",
      is_active: req.is_active
    });
    setShowEditDialog(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      requirement_type: "",
      credit_type: "",
      credits_required: "",
      due_date: "",
      notes: ""
    });
    setSelectedReq(null);
  };

  const getCreditTypeName = (typeId) => {
    const type = cmeTypes.find(t => t.id === typeId);
    return type?.name || "Any Type";
  };

  const getRequirementTypeName = (typeId) => {
    const type = requirementTypes.find(t => t.id === typeId);
    return type?.name || typeId;
  };

  const getDaysUntilDue = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getStatusInfo = (req) => {
    const progress = req.credits_required > 0
      ? (req.credits_earned / req.credits_required) * 100
      : 0;
    const daysLeft = getDaysUntilDue(req.due_date);

    if (progress >= 100) {
      return { status: "completed", color: "emerald", icon: CheckCircle };
    } else if (daysLeft <= 30) {
      return { status: "urgent", color: "amber", icon: AlertTriangle };
    } else {
      return { status: "active", color: "indigo", icon: Target };
    }
  };

  const getRequirementTypeColor = (type) => {
    const colors = {
      license_renewal: "bg-purple-50 text-purple-700",
      board_recert: "bg-blue-50 text-blue-700",
      hospital: "bg-teal-50 text-teal-700",
      personal: "bg-slate-100 text-slate-700"
    };
    return colors[type] || "bg-slate-100 text-slate-700";
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

  const activeRequirements = requirements.filter(r => r.is_active);
  const completedRequirements = requirements.filter(r => !r.is_active || (r.credits_earned >= r.credits_required));

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              Requirements & Goals
            </h1>
            <p className="mt-1 text-slate-500">
              Track license renewal, recertification, and personal CME goals
            </p>
          </div>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="bg-indigo-600 hover:bg-indigo-700"
            data-testid="add-requirement-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Requirement
          </Button>
        </div>

        {/* Active Requirements */}
        <div className="space-y-4">
          <h2 className="font-heading text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-600" />
            Active Requirements
          </h2>

          {activeRequirements.length === 0 ? (
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="py-12 text-center">
                <Target className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 mb-1">No active requirements</p>
                <p className="text-sm text-slate-400 mb-4">Add a requirement to start tracking your progress</p>
                <Button
                  onClick={() => setShowAddDialog(true)}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Requirement
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {activeRequirements.map((req) => {
                const progress = req.credits_required > 0
                  ? Math.min((req.credits_earned / req.credits_required) * 100, 100)
                  : 0;
                const statusInfo = getStatusInfo(req);
                const daysLeft = getDaysUntilDue(req.due_date);
                const StatusIcon = statusInfo.icon;

                return (
                  <Card key={req.requirement_id} className="border-slate-200 shadow-sm card-hover">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-${statusInfo.color}-100`}>
                            <StatusIcon className={`w-5 h-5 text-${statusInfo.color}-600`} />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-heading font-semibold text-slate-900 truncate">
                              {req.name}
                            </h3>
                            <div className="flex flex-wrap gap-2 mt-1">
                              <Badge className={getRequirementTypeColor(req.requirement_type)}>
                                {getRequirementTypeName(req.requirement_type)}
                              </Badge>
                              {req.credit_type && (
                                <Badge variant="outline" className="text-slate-600">
                                  {getCreditTypeName(req.credit_type)}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(req)}
                            data-testid={`edit-req-${req.requirement_id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(req.requirement_id)}
                            className="text-red-600 hover:text-red-700"
                            data-testid={`delete-req-${req.requirement_id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between text-sm mb-1.5">
                            <span className="text-slate-600">Progress</span>
                            <span className="font-medium text-slate-900">
                              {req.credits_earned} / {req.credits_required} credits
                            </span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>

                        <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-100">
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <Calendar className="w-4 h-4" />
                            <span>Due: {req.due_date}</span>
                          </div>
                          <div className={`flex items-center gap-1.5 ${
                            daysLeft <= 30 ? "text-amber-600" : "text-slate-500"
                          }`}>
                            <Clock className="w-4 h-4" />
                            <span>
                              {daysLeft > 0 ? `${daysLeft} days left` : "Due now"}
                            </span>
                          </div>
                        </div>

                        {req.notes && (
                          <p className="text-sm text-slate-500 italic pt-2 border-t border-slate-100">
                            {req.notes}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Completed Requirements */}
        {completedRequirements.filter(r => r.credits_earned >= r.credits_required).length > 0 && (
          <div className="space-y-4">
            <h2 className="font-heading text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-emerald-500" />
              Completed
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {completedRequirements
                .filter(r => r.credits_earned >= r.credits_required)
                .map((req) => (
                  <Card key={req.requirement_id} className="border-slate-200 shadow-sm bg-emerald-50/50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 truncate">{req.name}</p>
                          <p className="text-sm text-slate-500">
                            {req.credits_earned} / {req.credits_required} credits
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        )}

        {/* Add Requirement Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="font-heading">Add Requirement</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., State License Renewal 2025"
                  required
                  data-testid="req-name-input"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="requirement_type">Type *</Label>
                  <Select
                    value={formData.requirement_type}
                    onValueChange={(value) => setFormData({ ...formData, requirement_type: value })}
                    required
                  >
                    <SelectTrigger data-testid="req-type-select">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {requirementTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="credit_type">Credit Type</Label>
                  <Select
                    value={formData.credit_type || "any"}
                    onValueChange={(value) => setFormData({ ...formData, credit_type: value === "any" ? "" : value })}
                  >
                    <SelectTrigger data-testid="req-credit-type-select">
                      <SelectValue placeholder="Any type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any Type</SelectItem>
                      {cmeTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="credits_required">Credits Required *</Label>
                  <Input
                    id="credits_required"
                    type="number"
                    step="0.5"
                    min="0"
                    value={formData.credits_required}
                    onChange={(e) => setFormData({ ...formData, credits_required: e.target.value })}
                    placeholder="e.g., 50"
                    required
                    data-testid="req-credits-input"
                  />
                </div>
                <div>
                  <Label htmlFor="due_date">Due Date *</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    required
                    data-testid="req-due-date-input"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes or requirements..."
                  rows={2}
                  data-testid="req-notes-input"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setShowAddDialog(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" data-testid="save-req-btn">
                  Save Requirement
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Requirement Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="font-heading">Edit Requirement</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <Label htmlFor="edit_name">Name *</Label>
                <Input
                  id="edit_name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  data-testid="edit-req-name-input"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_credits_required">Credits Required *</Label>
                  <Input
                    id="edit_credits_required"
                    type="number"
                    step="0.5"
                    min="0"
                    value={formData.credits_required}
                    onChange={(e) => setFormData({ ...formData, credits_required: e.target.value })}
                    required
                    data-testid="edit-req-credits-input"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_due_date">Due Date *</Label>
                  <Input
                    id="edit_due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    required
                    data-testid="edit-req-due-date-input"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit_notes">Notes</Label>
                <Textarea
                  id="edit_notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  data-testid="edit-req-notes-input"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setShowEditDialog(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" data-testid="update-req-btn">
                  Update Requirement
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Requirements;
