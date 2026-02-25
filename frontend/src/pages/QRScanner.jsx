import { useState, useEffect, useRef } from "react";
import { api } from "../App";
import Layout from "../components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
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
  ScanLine,
  Camera,
  X,
  CheckCircle,
  AlertCircle,
  QrCode,
  Keyboard
} from "lucide-react";
import { toast } from "sonner";
import { Html5QrcodeScanner } from "html5-qrcode";

const QRScanner = () => {
  const [scanning, setScanning] = useState(false);
  const [showManualDialog, setShowManualDialog] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [cmeTypes, setCmeTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const scannerRef = useRef(null);
  const scannerInstanceRef = useRef(null);

  const [formData, setFormData] = useState({
    title: "",
    provider: "EEDS",
    credits: "",
    credit_type: "",
    completion_date: "",
    certificate_number: "",
    subject: ""
  });

  useEffect(() => {
    fetchCmeTypes();
    return () => {
      if (scannerInstanceRef.current) {
        try {
          scannerInstanceRef.current.clear();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, []);

  const fetchCmeTypes = async () => {
    try {
      const response = await api.get("/cme-types");
      setCmeTypes(response.data);
    } catch (error) {
      console.error("Failed to fetch CME types:", error);
    }
  };

  const startScanner = () => {
    setScanning(true);
    
    setTimeout(() => {
      if (scannerRef.current && !scannerInstanceRef.current) {
        scannerInstanceRef.current = new Html5QrcodeScanner(
          "qr-scanner",
          { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            rememberLastUsedCamera: true,
            aspectRatio: 1
          },
          false
        );
        
        scannerInstanceRef.current.render(handleScanSuccess, handleScanError);
      }
    }, 100);
  };

  const stopScanner = () => {
    if (scannerInstanceRef.current) {
      try {
        scannerInstanceRef.current.clear();
        scannerInstanceRef.current = null;
      } catch (e) {
        console.error("Error stopping scanner:", e);
      }
    }
    setScanning(false);
  };

  const handleScanSuccess = (decodedText, decodedResult) => {
    stopScanner();
    
    // Parse EEDS QR code data
    // EEDS QR codes typically contain JSON or URL-encoded certificate data
    let parsedData = {};
    
    try {
      // Try parsing as JSON first
      if (decodedText.startsWith("{")) {
        parsedData = JSON.parse(decodedText);
      } else if (decodedText.includes("=")) {
        // URL-encoded data
        const params = new URLSearchParams(decodedText);
        parsedData = Object.fromEntries(params.entries());
      } else {
        // Plain text - use as certificate number
        parsedData = { certificate_number: decodedText };
      }
    } catch (e) {
      parsedData = { certificate_number: decodedText };
    }

    setScanResult(parsedData);
    setFormData({
      title: parsedData.title || parsedData.activity || "",
      provider: parsedData.provider || parsedData.organization || "EEDS",
      credits: parsedData.credits || parsedData.credit_hours || "",
      credit_type: parsedData.credit_type || "",
      completion_date: parsedData.date || parsedData.completion_date || new Date().toISOString().split("T")[0],
      certificate_number: parsedData.certificate_number || parsedData.id || "",
      subject: parsedData.subject || parsedData.topic || ""
    });
    setShowResultDialog(true);
  };

  const handleScanError = (errorMessage) => {
    // Ignore continuous scanning errors
    if (!errorMessage.includes("No QR code found")) {
      console.log("Scan error:", errorMessage);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post("/certificates/eeds-import", {
        ...formData,
        credits: parseFloat(formData.credits),
        qr_data: scanResult
      });
      toast.success("EEDS certificate imported successfully!");
      setShowResultDialog(false);
      setShowManualDialog(false);
      resetForm();
    } catch (error) {
      toast.error("Failed to import certificate");
      console.error("Import error:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      provider: "EEDS",
      credits: "",
      credit_type: "",
      completion_date: "",
      certificate_number: "",
      subject: ""
    });
    setScanResult(null);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              EEDS QR Scanner
            </h1>
            <p className="mt-1 text-slate-500">
              Scan EEDS QR codes to import CME certificates
            </p>
          </div>
          <Button
            onClick={() => setShowManualDialog(true)}
            variant="outline"
            className="border-slate-200"
            data-testid="manual-entry-btn"
          >
            <Keyboard className="w-4 h-4 mr-2" />
            Manual Entry
          </Button>
        </div>

        {/* Scanner Card */}
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            {!scanning ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-6">
                  <QrCode className="w-12 h-12 text-indigo-600" />
                </div>
                <h3 className="font-heading text-xl font-semibold text-slate-900 mb-2">
                  Ready to Scan
                </h3>
                <p className="text-slate-500 mb-6 max-w-md mx-auto">
                  Point your camera at an EEDS QR code to automatically import the CME certificate information.
                </p>
                <Button
                  onClick={startScanner}
                  size="lg"
                  className="bg-indigo-600 hover:bg-indigo-700"
                  data-testid="start-scanner-btn"
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Start Scanner
                </Button>
              </div>
            ) : (
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading font-semibold text-slate-900">
                    Scanning...
                  </h3>
                  <Button
                    onClick={stopScanner}
                    variant="outline"
                    size="sm"
                    className="border-slate-200"
                    data-testid="stop-scanner-btn"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
                <div 
                  id="qr-scanner" 
                  ref={scannerRef}
                  className="rounded-lg overflow-hidden"
                ></div>
                <p className="text-center text-sm text-slate-500 mt-4">
                  Position the QR code within the frame
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-lg font-semibold text-slate-900">
              How to use EEDS QR codes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                  <span className="font-heading font-bold text-indigo-600">1</span>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Find QR Code</p>
                  <p className="text-sm text-slate-500">
                    Locate the QR code on your EEDS certificate or activity page
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                  <span className="font-heading font-bold text-indigo-600">2</span>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Scan</p>
                  <p className="text-sm text-slate-500">
                    Use the scanner above to capture the QR code
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                  <span className="font-heading font-bold text-indigo-600">3</span>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Verify & Save</p>
                  <p className="text-sm text-slate-500">
                    Review the extracted information and save
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Result Dialog */}
        <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="font-heading flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                QR Code Scanned
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <p className="text-sm text-emerald-700">
                  Certificate data extracted. Please verify the information below.
                </p>
              </div>
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    data-testid="eeds-title-input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="provider">Provider *</Label>
                    <Input
                      id="provider"
                      value={formData.provider}
                      onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                      required
                      data-testid="eeds-provider-input"
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
                      required
                      data-testid="eeds-credits-input"
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
                    <SelectTrigger data-testid="eeds-type-select">
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="completion_date">Completion Date *</Label>
                    <Input
                      id="completion_date"
                      type="date"
                      value={formData.completion_date}
                      onChange={(e) => setFormData({ ...formData, completion_date: e.target.value })}
                      required
                      data-testid="eeds-date-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="certificate_number">Certificate #</Label>
                    <Input
                      id="certificate_number"
                      value={formData.certificate_number}
                      onChange={(e) => setFormData({ ...formData, certificate_number: e.target.value })}
                      data-testid="eeds-number-input"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setShowResultDialog(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-indigo-600 hover:bg-indigo-700" 
                  disabled={loading}
                  data-testid="save-eeds-cert-btn"
                >
                  {loading ? "Saving..." : "Import Certificate"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Manual Entry Dialog */}
        <Dialog open={showManualDialog} onOpenChange={setShowManualDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="font-heading">Manual EEDS Entry</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="manual_title">Title *</Label>
                  <Input
                    id="manual_title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter activity title"
                    required
                    data-testid="manual-title-input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="manual_provider">Provider *</Label>
                    <Input
                      id="manual_provider"
                      value={formData.provider}
                      onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                      required
                      data-testid="manual-provider-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="manual_credits">Credits *</Label>
                    <Input
                      id="manual_credits"
                      type="number"
                      step="0.5"
                      min="0"
                      value={formData.credits}
                      onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                      placeholder="e.g., 1.5"
                      required
                      data-testid="manual-credits-input"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="manual_credit_type">Credit Type *</Label>
                  <Select
                    value={formData.credit_type}
                    onValueChange={(value) => setFormData({ ...formData, credit_type: value })}
                    required
                  >
                    <SelectTrigger data-testid="manual-type-select">
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="manual_completion_date">Completion Date *</Label>
                    <Input
                      id="manual_completion_date"
                      type="date"
                      value={formData.completion_date}
                      onChange={(e) => setFormData({ ...formData, completion_date: e.target.value })}
                      required
                      data-testid="manual-date-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="manual_certificate_number">Certificate #</Label>
                    <Input
                      id="manual_certificate_number"
                      value={formData.certificate_number}
                      onChange={(e) => setFormData({ ...formData, certificate_number: e.target.value })}
                      placeholder="Optional"
                      data-testid="manual-number-input"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setShowManualDialog(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-indigo-600 hover:bg-indigo-700" 
                  disabled={loading}
                  data-testid="save-manual-cert-btn"
                >
                  {loading ? "Saving..." : "Save Certificate"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default QRScanner;
