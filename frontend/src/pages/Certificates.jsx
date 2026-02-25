import { useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { api } from "../App";
import Layout from "../components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
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
  Clock
} from "lucide-react";
import { toast } from "sonner";

const Certificates = () => {
  const [certificates, setCertificates] = useState([]);
  const [cmeTypes, setCmeTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedCert, setSelectedCert] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    provider: "",
    credits: "",
    credit_type: "",
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
      } else {
        toast.warning("Certificate uploaded but OCR failed. Please edit manually.");
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
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

  const handleUpdate = async (certId, updates) => {
    try {
      await api.put(`/certificates/${certId}`, updates);
      toast.success("Certificate updated");
      fetchData();
      setShowViewDialog(false);
    } catch (error) {
      toast.error("Failed to update certificate");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      provider: "",
      credits: "",
      credit_type: "",
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
        return <Badge className="bg-red-50 text-red-700"><AlertCircle className="w-3 h-3 mr-1" />Review</Badge>;
      default:
        return null;
    }
  };

  const filteredCerts = certificates.filter(cert => {
    const matchesSearch = cert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          cert.provider.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || cert.credit_type === filterType;
    return matchesSearch && matchesType;
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
          <Button
            onClick={() => setShowAddDialog(true)}
            className="bg-indigo-600 hover:bg-indigo-700"
            data-testid="add-certificate-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Certificate
          </Button>
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
                      <TableHead className="data-table">Type</TableHead>
                      <TableHead className="data-table">Date</TableHead>
                      <TableHead className="data-table">Status</TableHead>
                      <TableHead className="data-table text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCerts.map((cert) => (
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
                        <TableCell className="text-slate-600">
                          {getCreditTypeName(cert.credit_type)}
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
                              onClick={() => handleDelete(cert.certificate_id)}
                              className="text-red-600 hover:text-red-700"
                              data-testid={`delete-cert-${cert.certificate_id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Certificate Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="sm:max-w-[500px]">
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
                  <Label htmlFor="credit_type">Credit Type *</Label>
                  <Select
                    value={formData.credit_type}
                    onValueChange={(value) => setFormData({ ...formData, credit_type: value })}
                    required
                  >
                    <SelectTrigger data-testid="cert-type-select">
                      <SelectValue placeholder="Select credit type" />
                    </SelectTrigger>
                    <SelectContent>
                      {cmeTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    <Label className="text-slate-500 text-xs uppercase tracking-wider">Type</Label>
                    <p className="font-medium text-slate-900">{getCreditTypeName(selectedCert.credit_type)}</p>
                  </div>
                  <div>
                    <Label className="text-slate-500 text-xs uppercase tracking-wider">Completion Date</Label>
                    <p className="font-medium text-slate-900">{selectedCert.completion_date}</p>
                  </div>
                  <div>
                    <Label className="text-slate-500 text-xs uppercase tracking-wider">Certificate #</Label>
                    <p className="font-medium text-slate-900">{selectedCert.certificate_number || "N/A"}</p>
                  </div>
                </div>
                {selectedCert.ocr_status === "completed" && selectedCert.ocr_data && (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                    <p className="text-sm text-emerald-700 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Information extracted automatically via OCR
                    </p>
                  </div>
                )}
                {selectedCert.ocr_status === "failed" && (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <p className="text-sm text-amber-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      OCR failed. Please verify the information manually.
                    </p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowViewDialog(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Certificates;
