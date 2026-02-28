import { useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { api } from "../App";
import Layout from "../components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Checkbox } from "../components/ui/checkbox";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Award,
  UploadCloud,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit,
  Eye,
  Loader2,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  Save,
  X,
  Calendar,
  Download,
  Upload as UploadIcon
} from "lucide-react";
import { toast } from "sonner";

const Certificates = () => {
  const [certificates, setCertificates] = useState([]);
  const [cmeTypes, setCmeTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterYear, setFilterYear] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showCustomTypeDialog, setShowCustomTypeDialog] = useState(false);
  const [selectedCert, setSelectedCert] = useState(null);
  const [importData, setImportData] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [newCustomType, setNewCustomType] = useState({ name: "", description: "" });
  
  // Generate years from current year back to 1990
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1989 }, (_, i) => currentYear - i);
  
  const [formData, setFormData] = useState({
    title: "",
    provider: "",
    credits: "",
    credit_types: [],
    subject: "",
    completion_date: "",
    expiration_date: "",
    certificate_number: ""
  });
  const [editData, setEditData] = useState({
    title: "",
    provider: "",
    credits: "",
    credit_types: [],
    subject: "",
    completion_date: "",
    expiration_date: "",
    certificate_number: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [certsRes, typesRes] = await Promise.all([
        api.get("/certificates"),
        api.get("/cme-types")
      ]);
      setCertificates(certsRes.data);
      setCmeTypes(typesRes.data);
    } catch (error) {
      toast.error("Failed to load certificates");
    } finally {
      setLoading(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    setUploading(true);
    const file = acceptedFiles[0];
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.post("/certificates/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      if (response.data.ocr_status === "completed") {
        toast.success("Certificate uploaded and processed!");
        setSelectedCert(response.data);
        setShowViewDialog(true);
      } else if (response.data.ocr_status === "processing") {
        toast.info("Certificate uploaded. Processing with OCR...");
        setSelectedCert(response.data);
        openEditDialog(response.data);
      } else {
        toast.warning("Certificate uploaded but OCR failed. Please enter details manually.");
        setSelectedCert(response.data);
        openEditDialog(response.data);
      }
      
      fetchData();
    } catch (error) {
      toast.error("Failed to upload certificate");
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
      "application/pdf": [".pdf"]
    },
    maxFiles: 1,
    disabled: uploading
  });

  const handleCreditTypeToggle = (typeId, isEdit = false) => {
    if (isEdit) {
      setEditData(prev => ({
        ...prev,
        credit_types: prev.credit_types.includes(typeId)
          ? prev.credit_types.filter(t => t !== typeId)
          : [...prev.credit_types, typeId]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        credit_types: prev.credit_types.includes(typeId)
          ? prev.credit_types.filter(t => t !== typeId)
          : [...prev.credit_types, typeId]
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.credit_types.length === 0) {
      toast.error("Please select at least one credit type");
      return;
    }
    
    try {
      await api.post("/certificates", {
        ...formData,
        credits: parseFloat(formData.credits)
      });
      toast.success("Certificate added successfully!");
      setShowAddDialog(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error("Failed to add certificate");
    }
  };

  const handleDelete = async (certId) => {
    if (!window.confirm("Are you sure you want to delete this certificate?")) return;

    try {
      await api.delete(`/certificates/${certId}`);
      toast.success("Certificate deleted");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete certificate");
    }
  };

  const openEditDialog = (cert) => {
    setSelectedCert(cert);
    const creditTypes = cert.credit_types || (cert.credit_type ? [cert.credit_type] : []);
    setEditData({
      title: cert.title || "",
      provider: cert.provider || "",
      credits: cert.credits?.toString() || "",
      credit_types: creditTypes,
      subject: cert.subject || "",
      completion_date: cert.completion_date || "",
      expiration_date: cert.expiration_date || "",
      certificate_number: cert.certificate_number || ""
    });
    setShowViewDialog(false);
    setShowEditDialog(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    if (editData.credit_types.length === 0) {
      toast.error("Please select at least one credit type");
      return;
    }
    
    setSaving(true);
    
    try {
      const updates = {
        ...editData,
        credits: parseFloat(editData.credits) || 0
      };
      
      await api.put(`/certificates/${selectedCert.certificate_id}`, updates);
      toast.success("Certificate updated successfully!");
      setShowEditDialog(false);
      fetchData();
    } catch (error) {
      toast.error("Failed to update certificate");
      console.error("Update error:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleBulkImport = async () => {
    if (!importData.trim()) {
      toast.error("Please paste CSV data");
      return;
    }

    setImportLoading(true);
    try {
      // Parse CSV
      const lines = importData.trim().split("\n");
      const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
      
      const certificates = lines.slice(1).map(line => {
        const values = line.split(",").map(v => v.trim());
        const cert = {};
        headers.forEach((header, idx) => {
          if (header === "title") cert.title = values[idx];
          else if (header === "provider") cert.provider = values[idx];
          else if (header === "credits") cert.credits = values[idx];
          else if (header === "credit_type" || header === "credit_types") cert.credit_types = values[idx];
          else if (header === "completion_date" || header === "date") cert.completion_date = values[idx];
          else if (header === "subject") cert.subject = values[idx];
          else if (header === "certificate_number" || header === "certificate_#") cert.certificate_number = values[idx];
        });
        return cert;
      }).filter(c => c.title);

      const response = await api.post("/certificates/bulk-import", { certificates });
      
      toast.success(`Imported ${response.data.imported_count} certificates`);
      if (response.data.error_count > 0) {
        toast.warning(`${response.data.error_count} rows had errors`);
      }
      
      setShowImportDialog(false);
      setImportData("");
      fetchData();
    } catch (error) {
      toast.error("Failed to import certificates");
      console.error("Import error:", error);
    } finally {
      setImportLoading(false);
    }
  };

  const handleCreateCustomType = async () => {
    if (!newCustomType.name.trim()) {
      toast.error("Please enter a name");
      return;
    }

    try {
      await api.post("/cme-types/custom", newCustomType);
      toast.success("Custom credit type created!");
      setShowCustomTypeDialog(false);
      setNewCustomType({ name: "", description: "" });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to create custom type");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      provider: "",
      credits: "",
      credit_types: [],
      subject: "",
      completion_date: "",
      expiration_date: "",
      certificate_number: ""
    });
  };

  const getCreditTypeName = (typeId) => {
    const type = cmeTypes.find(t => t.id === typeId);
    return type?.name || typeId;
  };

  const getOcrStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-emerald-50 text-emerald-700"><CheckCircle className="w-3 h-3 mr-1" />Verified</Badge>;
      case "processing":
        return <Badge className="bg-amber-50 text-amber-700"><Clock className="w-3 h-3 mr-1" />Processing</Badge>;
      case "failed":
        return <Badge className="bg-red-50 text-red-700"><AlertCircle className="w-3 h-3 mr-1" />Needs Review</Badge>;
      default:
        return null;
    }
  };

  const filteredCerts = certificates.filter(cert => {
    const matchesSearch = cert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          cert.provider.toLowerCase().includes(searchQuery.toLowerCase());
    const certTypes = cert.credit_types || (cert.credit_type ? [cert.credit_type] : []);
    const matchesType = filterType === "all" || certTypes.includes(filterType);
    const matchesYear = filterYear === "all" || (cert.completion_date && cert.completion_date.startsWith(filterYear));
    return matchesSearch && matchesType && matchesYear;
  });

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              Certificates
            </h1>
            <p className="mt-1 text-slate-500">
              Manage your CME certificates and credits
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowImportDialog(true)}
              variant="outline"
              className="border-slate-200"
              data-testid="import-csv-btn"
            >
              <UploadIcon className="w-4 h-4 mr-2" />
              Import CSV
            </Button>
            <Button
              onClick={() => setShowAddDialog(true)}
              className="bg-indigo-600 hover:bg-indigo-700"
              data-testid="add-certificate-btn"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Certificate
            </Button>
          </div>
        </div>

        {/* Upload Zone */}
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div
              {...getRootProps()}
              className={`upload-zone p-8 text-center cursor-pointer ${
                isDragActive ? "drag-active" : ""
              } ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
              data-testid="upload-dropzone"
            >
              <input {...getInputProps()} />
              {uploading ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-3" />
                  <p className="text-slate-600 font-medium">Processing certificate...</p>
                  <p className="text-sm text-slate-500 mt-1">Extracting information with OCR</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <UploadCloud className="w-12 h-12 text-slate-400 mb-3" />
                  <p className="text-slate-600 font-medium">
                    {isDragActive ? "Drop your certificate here" : "Drag & drop a certificate"}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    or click to browse • Supports PNG, JPG, PDF
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    You can edit details manually if OCR doesn't extract them correctly
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search certificates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="search-certificates"
            />
          </div>
          <Select value={filterYear} onValueChange={setFilterYear}>
            <SelectTrigger className="w-full sm:w-[140px]" data-testid="filter-year">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-[200px]" data-testid="filter-type">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {cmeTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Certificates Table */}
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-0">
            {filteredCerts.length === 0 ? (
              <div className="text-center py-12">
                <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 mb-1">No certificates found</p>
                <p className="text-sm text-slate-400">Upload or add a certificate to get started</p>
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
                      <TableHead className="data-table">Status</TableHead>
                      <TableHead className="data-table text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCerts.map((cert) => {
                      const creditTypes = cert.credit_types || (cert.credit_type ? [cert.credit_type] : []);
                      return (
                        <TableRow key={cert.certificate_id}>
                          <TableCell className="font-medium max-w-[200px] truncate">
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
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {getCreditTypeName(type)}
                                </Badge>
                              ))}
                              {creditTypes.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{creditTypes.length - 2}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {cert.completion_date}
                          </TableCell>
                          <TableCell>
                            {cert.eeds_imported && (
                              <Badge className="bg-sky-50 text-sky-700 mr-1">EEDS</Badge>
                            )}
                            {getOcrStatusBadge(cert.ocr_status)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => { setSelectedCert(cert); setShowViewDialog(true); }}
                                data-testid={`view-cert-${cert.certificate_id}`}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(cert)}
                                data-testid={`edit-cert-${cert.certificate_id}`}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(cert.certificate_id)}
                                className="text-red-600 hover:text-red-700"
                                data-testid={`delete-cert-${cert.certificate_id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
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

        {/* Add Certificate Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading">Add Certificate</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Annual CME Conference 2024"
                    required
                    data-testid="cert-title-input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="provider">Provider *</Label>
                    <Input
                      id="provider"
                      value={formData.provider}
                      onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                      placeholder="e.g., ACCME"
                      required
                      data-testid="cert-provider-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="credits">Credits *</Label>
                    <Input
                      id="credits"
                      type="number"
                      step="0.5"
                      min="0"
                      value={formData.credits}
                      onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                      placeholder="e.g., 1.5"
                      required
                      data-testid="cert-credits-input"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Credit Types * (select all that apply)</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCustomTypeDialog(true)}
                      className="text-indigo-600 h-auto p-0"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Custom
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto p-2 border rounded-lg">
                    {cmeTypes.map((type) => (
                      <div key={type.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`type-${type.id}`}
                          checked={formData.credit_types.includes(type.id)}
                          onCheckedChange={() => handleCreditTypeToggle(type.id)}
                        />
                        <label
                          htmlFor={`type-${type.id}`}
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
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g., Cardiology"
                    data-testid="cert-subject-input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="completion_date">Completion Date *</Label>
                    <Input
                      id="completion_date"
                      type="date"
                      value={formData.completion_date}
                      onChange={(e) => setFormData({ ...formData, completion_date: e.target.value })}
                      required
                      data-testid="cert-date-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="certificate_number">Certificate #</Label>
                    <Input
                      id="certificate_number"
                      value={formData.certificate_number}
                      onChange={(e) => setFormData({ ...formData, certificate_number: e.target.value })}
                      placeholder="Optional"
                      data-testid="cert-number-input"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" data-testid="save-cert-btn">
                  Save Certificate
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Certificate Dialog */}
        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="font-heading">Certificate Details</DialogTitle>
            </DialogHeader>
            {selectedCert && (
              <div className="space-y-4">
                {selectedCert.image_url && (
                  <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                    <img
                      src={selectedCert.image_url}
                      alt="Certificate"
                      className="w-full h-auto max-h-[300px] object-contain"
                    />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-500 text-xs uppercase tracking-wider">Title</Label>
                    <p className="font-medium text-slate-900">{selectedCert.title}</p>
                  </div>
                  <div>
                    <Label className="text-slate-500 text-xs uppercase tracking-wider">Provider</Label>
                    <p className="font-medium text-slate-900">{selectedCert.provider}</p>
                  </div>
                  <div>
                    <Label className="text-slate-500 text-xs uppercase tracking-wider">Credits</Label>
                    <p className="font-medium text-slate-900">{selectedCert.credits}</p>
                  </div>
                  <div>
                    <Label className="text-slate-500 text-xs uppercase tracking-wider">Completion Date</Label>
                    <p className="font-medium text-slate-900">{selectedCert.completion_date}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-slate-500 text-xs uppercase tracking-wider">Credit Types</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {(selectedCert.credit_types || (selectedCert.credit_type ? [selectedCert.credit_type] : [])).map((type, idx) => (
                      <Badge key={idx} variant="secondary">{getCreditTypeName(type)}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowViewDialog(false)}>
                Close
              </Button>
              <Button 
                onClick={() => openEditDialog(selectedCert)} 
                className="bg-indigo-600 hover:bg-indigo-700"
                data-testid="edit-from-view-btn"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Details
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Certificate Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading flex items-center gap-2">
                <Edit className="w-5 h-5 text-indigo-600" />
                Edit Certificate
              </DialogTitle>
            </DialogHeader>
            {selectedCert && (
              <form onSubmit={handleEditSubmit} className="space-y-4">
                {selectedCert.image_url && (
                  <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                    <img
                      src={selectedCert.image_url}
                      alt="Certificate"
                      className="w-full h-auto max-h-[200px] object-contain"
                    />
                  </div>
                )}

                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="edit_title">Title *</Label>
                    <Input
                      id="edit_title"
                      value={editData.title}
                      onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                      required
                      data-testid="edit-cert-title-input"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit_provider">Provider *</Label>
                      <Input
                        id="edit_provider"
                        value={editData.provider}
                        onChange={(e) => setEditData({ ...editData, provider: e.target.value })}
                        required
                        data-testid="edit-cert-provider-input"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_credits">Credits *</Label>
                      <Input
                        id="edit_credits"
                        type="number"
                        step="0.5"
                        min="0"
                        value={editData.credits}
                        onChange={(e) => setEditData({ ...editData, credits: e.target.value })}
                        required
                        data-testid="edit-cert-credits-input"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Credit Types * (select all that apply)</Label>
                    <div className="grid grid-cols-2 gap-2 max-h-[150px] overflow-y-auto p-2 border rounded-lg mt-1">
                      {cmeTypes.map((type) => (
                        <div key={type.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`edit-type-${type.id}`}
                            checked={editData.credit_types.includes(type.id)}
                            onCheckedChange={() => handleCreditTypeToggle(type.id, true)}
                          />
                          <label htmlFor={`edit-type-${type.id}`} className="text-sm cursor-pointer">
                            {type.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit_completion_date">Completion Date *</Label>
                      <Input
                        id="edit_completion_date"
                        type="date"
                        value={editData.completion_date}
                        onChange={(e) => setEditData({ ...editData, completion_date: e.target.value })}
                        required
                        data-testid="edit-cert-date-input"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_certificate_number">Certificate #</Label>
                      <Input
                        id="edit_certificate_number"
                        value={editData.certificate_number}
                        onChange={(e) => setEditData({ ...editData, certificate_number: e.target.value })}
                        data-testid="edit-cert-number-input"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-indigo-600 hover:bg-indigo-700" 
                    disabled={saving}
                    data-testid="save-edit-cert-btn"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Import CSV Dialog */}
        <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="font-heading">Import Certificates from CSV</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-sm text-slate-600 mb-2">
                  <strong>CSV Format:</strong> Include headers in the first row
                </p>
                <code className="text-xs bg-slate-100 p-2 rounded block overflow-x-auto">
                  title,provider,credits,credit_types,completion_date,subject,certificate_number
                </code>
                <p className="text-xs text-slate-500 mt-2">
                  For multiple credit types, separate with semicolons: "ama_cat1;moc"
                </p>
              </div>
              <div>
                <Label htmlFor="csv_data">Paste CSV Data</Label>
                <Textarea
                  id="csv_data"
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  placeholder="title,provider,credits,credit_types,completion_date&#10;Annual Conference,ACCME,10,ama_cat1,2024-03-15"
                  rows={8}
                  className="font-mono text-sm"
                  data-testid="csv-import-textarea"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleBulkImport}
                disabled={importLoading}
                className="bg-indigo-600 hover:bg-indigo-700"
                data-testid="import-csv-submit-btn"
              >
                {importLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <UploadIcon className="w-4 h-4 mr-2" />
                    Import
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Custom Credit Type Dialog */}
        <Dialog open={showCustomTypeDialog} onOpenChange={setShowCustomTypeDialog}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="font-heading">Create Custom Credit Type</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="custom_type_name">Name *</Label>
                <Input
                  id="custom_type_name"
                  value={newCustomType.name}
                  onChange={(e) => setNewCustomType({ ...newCustomType, name: e.target.value })}
                  placeholder="e.g., Hospital Quality Improvement"
                  data-testid="custom-type-name-input"
                />
              </div>
              <div>
                <Label htmlFor="custom_type_desc">Description</Label>
                <Input
                  id="custom_type_desc"
                  value={newCustomType.description}
                  onChange={(e) => setNewCustomType({ ...newCustomType, description: e.target.value })}
                  placeholder="Optional description"
                  data-testid="custom-type-desc-input"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCustomTypeDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateCustomType}
                className="bg-indigo-600 hover:bg-indigo-700"
                data-testid="create-custom-type-btn"
              >
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Certificates;
