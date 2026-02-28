import { useState, useEffect } from "react";
import { api } from "../App";
import Layout from "../components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  BookOpen,
  Plus,
  Trash2,
  Edit,
  Calendar,
  Clock,
  GraduationCap,
  Link,
  FileText
} from "lucide-react";
import { toast } from "sonner";

const SelfReported = () => {
  const [credits, setCredits] = useState([]);
  const [activityTypes, setActivityTypes] = useState([]);
  const [cmeTypes, setCmeTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedCredit, setSelectedCredit] = useState(null);
  const [yearFilter, setYearFilter] = useState("all");
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2019 }, (_, i) => currentYear - i);
  
  const [formData, setFormData] = useState({
    activity_type: "",
    title: "",
    description: "",
    credits: "",
    credit_types: [],
    completion_date: "",
    hours_spent: "",
    reference_url: ""
  });

  useEffect(() => {
    fetchData();
  }, [yearFilter]);

  const fetchData = async () => {
    try {
      const [creditsRes, typesRes, cmeRes] = await Promise.all([
        api.get(`/self-reported${yearFilter !== "all" ? `?year=${yearFilter}` : ""}`),
        api.get("/self-reported-types"),
        api.get("/cme-types")
      ]);
      setCredits(creditsRes.data);
      setActivityTypes(typesRes.data);
      setCmeTypes(cmeRes.data);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreditTypeToggle = (typeId) => {
    setFormData(prev => ({
      ...prev,
      credit_types: prev.credit_types.includes(typeId)
        ? prev.credit_types.filter(t => t !== typeId)
        : [...prev.credit_types, typeId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const data = {
        ...formData,
        credits: parseFloat(formData.credits),
        hours_spent: formData.hours_spent ? parseFloat(formData.hours_spent) : null
      };
      
      await api.post("/self-reported", data);
      toast.success("Self-reported credit added!");
      setShowAddDialog(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error("Failed to add credit");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    try {
      const data = {
        activity_type: formData.activity_type,
        title: formData.title,
        description: formData.description,
        credits: parseFloat(formData.credits),
        credit_types: formData.credit_types,
        completion_date: formData.completion_date,
        hours_spent: formData.hours_spent ? parseFloat(formData.hours_spent) : null,
        reference_url: formData.reference_url
      };
      
      await api.put(`/self-reported/${selectedCredit.credit_id}`, data);
      toast.success("Credit updated!");
      setShowEditDialog(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error("Failed to update credit");
    }
  };

  const handleDelete = async (creditId) => {
    if (!confirm("Delete this self-reported credit?")) return;
    
    try {
      await api.delete(`/self-reported/${creditId}`);
      toast.success("Credit deleted");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete credit");
    }
  };

  const openEditDialog = (credit) => {
    setSelectedCredit(credit);
    setFormData({
      activity_type: credit.activity_type,
      title: credit.title,
      description: credit.description || "",
      credits: credit.credits.toString(),
      credit_types: credit.credit_types || [],
      completion_date: credit.completion_date,
      hours_spent: credit.hours_spent?.toString() || "",
      reference_url: credit.reference_url || ""
    });
    setShowEditDialog(true);
  };

  const resetForm = () => {
    setFormData({
      activity_type: "",
      title: "",
      description: "",
      credits: "",
      credit_types: [],
      completion_date: "",
      hours_spent: "",
      reference_url: ""
    });
    setSelectedCredit(null);
  };

  const getActivityTypeName = (typeId) => {
    const type = activityTypes.find(t => t.id === typeId);
    return type?.name || typeId;
  };

  const getCreditTypeName = (typeId) => {
    const type = cmeTypes.find(t => t.id === typeId);
    return type?.name || typeId;
  };

  const totalCredits = credits.reduce((sum, c) => sum + c.credits, 0);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Self-Reported Credits</h1>
            <p className="text-slate-600">Track journal clubs, self-study, presentations, and other learning activities</p>
          </div>
          <Button onClick={() => setShowAddDialog(true)} data-testid="add-self-reported-btn">
            <Plus className="w-4 h-4 mr-2" />
            Log Activity
          </Button>
        </div>

        {/* Stats & Filter */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-4">
            <Card className="px-4 py-2">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-600" />
                <div>
                  <p className="text-xs text-slate-500">Total Credits</p>
                  <p className="text-lg font-bold text-slate-900">{totalCredits.toFixed(1)}</p>
                </div>
              </div>
            </Card>
            <Card className="px-4 py-2">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="text-xs text-slate-500">Activities</p>
                  <p className="text-lg font-bold text-slate-900">{credits.length}</p>
                </div>
              </div>
            </Card>
          </div>
          
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="w-[140px]" data-testid="year-filter">
              <SelectValue placeholder="Filter by year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Credits Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-slate-500">Loading...</div>
            ) : credits.length === 0 ? (
              <div className="p-8 text-center">
                <BookOpen className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No self-reported credits yet</h3>
                <p className="text-slate-500 mb-4">Log your journal clubs, self-study, and other learning activities</p>
                <Button onClick={() => setShowAddDialog(true)} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Log Your First Activity
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Activity</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Credit Types</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {credits.map((credit) => (
                    <TableRow key={credit.credit_id} data-testid={`credit-row-${credit.credit_id}`}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{credit.title}</p>
                          {credit.description && (
                            <p className="text-xs text-slate-500 truncate max-w-[200px]">{credit.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{getActivityTypeName(credit.activity_type)}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{credit.credits}</span>
                        {credit.hours_spent && (
                          <span className="text-xs text-slate-500 ml-1">({credit.hours_spent}h)</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {credit.credit_types?.map((type, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {getCreditTypeName(type)}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{credit.completion_date}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {credit.reference_url && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => window.open(credit.reference_url, '_blank')}
                              title="View reference"
                            >
                              <Link className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(credit)}
                            data-testid={`edit-credit-${credit.credit_id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(credit.credit_id)}
                            className="text-red-600 hover:text-red-700"
                            data-testid={`delete-credit-${credit.credit_id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Add Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Log Self-Reported Activity</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="activity_type">Activity Type *</Label>
                <Select
                  value={formData.activity_type}
                  onValueChange={(value) => setFormData({ ...formData, activity_type: value })}
                >
                  <SelectTrigger data-testid="activity-type-select">
                    <SelectValue placeholder="Select activity type" />
                  </SelectTrigger>
                  <SelectContent>
                    {activityTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.activity_type && (
                  <p className="text-xs text-slate-500 mt-1">
                    {activityTypes.find(t => t.id === formData.activity_type)?.description}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="title">Activity Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., NEJM Journal Club - Heart Failure"
                  required
                  data-testid="activity-title-input"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the activity..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="credits">Credits Claimed *</Label>
                  <Input
                    id="credits"
                    type="number"
                    step="0.25"
                    min="0"
                    value={formData.credits}
                    onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                    required
                    data-testid="credits-input"
                  />
                </div>
                <div>
                  <Label htmlFor="hours_spent">Hours Spent</Label>
                  <Input
                    id="hours_spent"
                    type="number"
                    step="0.5"
                    min="0"
                    value={formData.hours_spent}
                    onChange={(e) => setFormData({ ...formData, hours_spent: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="completion_date">Completion Date *</Label>
                <Input
                  id="completion_date"
                  type="date"
                  value={formData.completion_date}
                  onChange={(e) => setFormData({ ...formData, completion_date: e.target.value })}
                  required
                  data-testid="completion-date-input"
                />
              </div>

              <div>
                <Label>Credit Types</Label>
                <p className="text-xs text-slate-500 mb-2">Select applicable credit types</p>
                <div className="grid grid-cols-2 gap-2 max-h-[150px] overflow-y-auto p-2 border rounded-lg">
                  {cmeTypes.map((type) => (
                    <div key={type.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`self-type-${type.id}`}
                        checked={formData.credit_types.includes(type.id)}
                        onCheckedChange={() => handleCreditTypeToggle(type.id)}
                      />
                      <label htmlFor={`self-type-${type.id}`} className="text-sm cursor-pointer">
                        {type.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="reference_url">Reference URL</Label>
                <Input
                  id="reference_url"
                  type="url"
                  value={formData.reference_url}
                  onChange={(e) => setFormData({ ...formData, reference_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" data-testid="submit-self-reported">Log Activity</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Self-Reported Activity</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <Label>Activity Type</Label>
                <Select
                  value={formData.activity_type}
                  onValueChange={(value) => setFormData({ ...formData, activity_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {activityTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit_title">Activity Title</Label>
                <Input
                  id="edit_title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="edit_description">Description</Label>
                <Textarea
                  id="edit_description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_credits">Credits</Label>
                  <Input
                    id="edit_credits"
                    type="number"
                    step="0.25"
                    min="0"
                    value={formData.credits}
                    onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit_hours">Hours Spent</Label>
                  <Input
                    id="edit_hours"
                    type="number"
                    step="0.5"
                    min="0"
                    value={formData.hours_spent}
                    onChange={(e) => setFormData({ ...formData, hours_spent: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit_date">Completion Date</Label>
                <Input
                  id="edit_date"
                  type="date"
                  value={formData.completion_date}
                  onChange={(e) => setFormData({ ...formData, completion_date: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label>Credit Types</Label>
                <div className="grid grid-cols-2 gap-2 max-h-[150px] overflow-y-auto p-2 border rounded-lg mt-1">
                  {cmeTypes.map((type) => (
                    <div key={type.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-self-type-${type.id}`}
                        checked={formData.credit_types.includes(type.id)}
                        onCheckedChange={() => handleCreditTypeToggle(type.id)}
                      />
                      <label htmlFor={`edit-self-type-${type.id}`} className="text-sm cursor-pointer">
                        {type.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="edit_url">Reference URL</Label>
                <Input
                  id="edit_url"
                  type="url"
                  value={formData.reference_url}
                  onChange={(e) => setFormData({ ...formData, reference_url: e.target.value })}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default SelfReported;
