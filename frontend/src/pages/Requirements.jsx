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
import { Checkbox } from "../components/ui/checkbox";
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
  Trophy,
  Building2,
  BookOpen,
  X,
  Filter
} from "lucide-react";
import { toast } from "sonner";

const Requirements = () => {
  const [requirements, setRequirements] = useState([]);
  const [cmeTypes, setCmeTypes] = useState([]);
  const [filterOptions, setFilterOptions] = useState({ providers: [], subjects: [] });
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedReq, setSelectedReq] = useState(null);
  
  // Generate years for selection
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1989 }, (_, i) => currentYear - i);
  const futureYears = Array.from({ length: 10 }, (_, i) => currentYear + i);
  const allYears = [...new Set([...futureYears, ...years])].sort((a, b) => b - a);
  
  const [formData, setFormData] = useState({
    name: "",
    requirement_type: "",
    credit_types: [],
    providers: [],
    subjects: [],
    credits_required: "",
    start_year: "",
    end_year: "",
    due_date: "",
    notes: ""
  });
  
  // For adding new providers/subjects
  const [newProvider, setNewProvider] = useState("");
  const [newSubject, setNewSubject] = useState("");

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
      const [reqsRes, typesRes, filtersRes] = await Promise.all([
        api.get("/requirements?active_only=false"),
        api.get("/cme-types"),
        api.get("/certificates/filters/options")
      ]);
      setRequirements(reqsRes.data);
      setCmeTypes(typesRes.data);
      setFilterOptions(filtersRes.data);
    } catch (error) {
      toast.error("Failed to load requirements");
    } finally {
      setLoading(false);
    }
  };

  const handleCreditTypeToggle = (typeId, isEdit = false) => {
    setFormData(prev => ({
      ...prev,
      credit_types: prev.credit_types.includes(typeId)
        ? prev.credit_types.filter(t => t !== typeId)
        : [...prev.credit_types, typeId]
    }));
  };
  
  const addProvider = (provider) => {
    if (provider && !formData.providers.includes(provider)) {
      setFormData(prev => ({ ...prev, providers: [...prev.providers, provider] }));
    }
    setNewProvider("");
  };
  
  const removeProvider = (provider) => {
    setFormData(prev => ({
      ...prev,
      providers: prev.providers.filter(p => p !== provider)
    }));
  };
  
  const addSubject = (subject) => {
    if (subject && !formData.subjects.includes(subject)) {
      setFormData(prev => ({ ...prev, subjects: [...prev.subjects, subject] }));
    }
    setNewSubject("");
  };
  
  const removeSubject = (subject) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.filter(s => s !== subject)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const data = {
        ...formData,
        credits_required: parseFloat(formData.credits_required),
        start_year: formData.start_year && formData.start_year !== "any" ? parseInt(formData.start_year) : null,
        end_year: formData.end_year && formData.end_year !== "any" ? parseInt(formData.end_year) : null,
        providers: formData.providers,
        subjects: formData.subjects
      };
      
      await api.post("/requirements", data);
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
      const data = {
        name: formData.name,
        credit_types: formData.credit_types,
        providers: formData.providers,
        subjects: formData.subjects,
        credits_required: parseFloat(formData.credits_required),
        start_year: formData.start_year && formData.start_year !== "any" ? parseInt(formData.start_year) : null,
        end_year: formData.end_year && formData.end_year !== "any" ? parseInt(formData.end_year) : null,
        due_date: formData.due_date,
        notes: formData.notes,
        is_active: formData.is_active
      };
      
      await api.put(`/requirements/${selectedReq.requirement_id}`, data);
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
    const creditTypes = req.credit_types || (req.credit_type ? [req.credit_type] : []);
    setFormData({
      name: req.name,
      requirement_type: req.requirement_type,
      credit_types: creditTypes,
      providers: req.providers || [],
      subjects: req.subjects || [],
      credits_required: req.credits_required.toString(),
      start_year: req.start_year?.toString() || "any",
      end_year: req.end_year?.toString() || "any",
      due_date: req.due_date,
      notes: req.notes || "",
      is_active: req.is_active
    });
    setNewProvider("");
    setNewSubject("");
    setShowEditDialog(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      requirement_type: "",
      credit_types: [],
      providers: [],
      subjects: [],
      credits_required: "",
      start_year: "",
      end_year: "",
      due_date: "",
      notes: ""
    });
    setNewProvider("");
    setNewSubject("");
    setSelectedReq(null);
  };

  const getCreditTypeName = (typeId) => {
    const type = cmeTypes.find(t => t.id === typeId);
    return type?.name || typeId;
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

  const formatYearRange = (req) => {
    if (req.start_year && req.end_year) {
      return `${req.start_year} - ${req.end_year}`;
    } else if (req.start_year) {
      return `${req.start_year}+`;
    } else if (req.end_year) {
      return `Up to ${req.end_year}`;
    }
    return "All Years";
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
                const creditTypes = req.credit_types || (req.credit_type ? [req.credit_type] : []);

                return (
                  <Card key={req.requirement_id} className="border-slate-200 shadow-sm card-hover">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                            statusInfo.color === "emerald" ? "bg-emerald-100" :
                            statusInfo.color === "amber" ? "bg-amber-100" : "bg-indigo-100"
                          }`}>
                            <StatusIcon className={`w-5 h-5 ${
                              statusInfo.color === "emerald" ? "text-emerald-600" :
                              statusInfo.color === "amber" ? "text-amber-600" : "text-indigo-600"
                            }`} />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-heading font-semibold text-slate-900 truncate">
                              {req.name}
                            </h3>
                            <div className="flex flex-wrap gap-2 mt-1">
                              <Badge className={getRequirementTypeColor(req.requirement_type)}>
                                {getRequirementTypeName(req.requirement_type)}
                              </Badge>
                              {(req.start_year || req.end_year) && (
                                <Badge variant="outline" className="text-slate-600">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  {formatYearRange(req)}
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

                      {/* Credit Types */}
                      {creditTypes.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs text-slate-500 mb-1">Accepted Credit Types:</p>
                          <div className="flex flex-wrap gap-1">
                            {creditTypes.map((type, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {getCreditTypeName(type)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

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
          <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
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
              </div>
              
              {/* Year Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_year">Start Year</Label>
                  <Select
                    value={formData.start_year}
                    onValueChange={(value) => setFormData({ ...formData, start_year: value })}
                  >
                    <SelectTrigger data-testid="req-start-year-select">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      {allYears.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500 mt-1">Certificates from this year onwards</p>
                </div>
                <div>
                  <Label htmlFor="end_year">End Year</Label>
                  <Select
                    value={formData.end_year}
                    onValueChange={(value) => setFormData({ ...formData, end_year: value })}
                  >
                    <SelectTrigger data-testid="req-end-year-select">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      {allYears.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500 mt-1">Certificates up to this year</p>
                </div>
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
              
              <div>
                <Label>Credit Types (leave empty for any type)</Label>
                <p className="text-xs text-slate-500 mb-2">Select specific credit types that can satisfy this requirement</p>
                <div className="grid grid-cols-2 gap-2 max-h-[150px] overflow-y-auto p-2 border rounded-lg">
                  {cmeTypes.map((type) => (
                    <div key={type.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`req-type-${type.id}`}
                        checked={formData.credit_types.includes(type.id)}
                        onCheckedChange={() => handleCreditTypeToggle(type.id)}
                      />
                      <label
                        htmlFor={`req-type-${type.id}`}
                        className="text-sm cursor-pointer flex items-center gap-1"
                      >
                        {type.name}
                        {type.is_custom && <Badge variant="outline" className="text-xs px-1">Custom</Badge>}
                      </label>
                    </div>
                  ))}
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
          <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
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
              
              {/* Year Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_start_year">Start Year</Label>
                  <Select
                    value={formData.start_year}
                    onValueChange={(value) => setFormData({ ...formData, start_year: value })}
                  >
                    <SelectTrigger data-testid="edit-req-start-year-select">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      {allYears.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit_end_year">End Year</Label>
                  <Select
                    value={formData.end_year}
                    onValueChange={(value) => setFormData({ ...formData, end_year: value })}
                  >
                    <SelectTrigger data-testid="edit-req-end-year-select">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      {allYears.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label>Credit Types</Label>
                <div className="grid grid-cols-2 gap-2 max-h-[150px] overflow-y-auto p-2 border rounded-lg mt-1">
                  {cmeTypes.map((type) => (
                    <div key={type.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-req-type-${type.id}`}
                        checked={formData.credit_types.includes(type.id)}
                        onCheckedChange={() => handleCreditTypeToggle(type.id, true)}
                      />
                      <label htmlFor={`edit-req-type-${type.id}`} className="text-sm cursor-pointer">
                        {type.name}
                      </label>
                    </div>
                  ))}
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
