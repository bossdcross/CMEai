import { useState, useEffect } from "react";
import { api } from "../App";
import Layout from "../components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import { Switch } from "../components/ui/switch";
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
  ClipboardCheck,
  Plus,
  Trash2,
  Star,
  ThumbsUp,
  ThumbsDown,
  CheckCircle,
  XCircle,
  MessageSquare
} from "lucide-react";
import { toast } from "sonner";

const Evaluations = () => {
  const [evaluations, setEvaluations] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  
  const [formData, setFormData] = useState({
    certificate_id: "",
    event_id: "",
    title: "",
    overall_rating: 0,
    content_quality: 0,
    speaker_effectiveness: 0,
    relevance_to_practice: 0,
    would_recommend: null,
    learning_objectives_met: null,
    comments: "",
    improvement_suggestions: "",
    practice_change_planned: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [evalsRes, certsRes, eventsRes] = await Promise.all([
        api.get("/evaluations"),
        api.get("/certificates"),
        api.get("/events")
      ]);
      setEvaluations(evalsRes.data);
      setCertificates(certsRes.data);
      setEvents(eventsRes.data);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.overall_rating === 0) {
      toast.error("Please provide an overall rating");
      return;
    }
    
    try {
      const data = {
        ...formData,
        certificate_id: formData.certificate_id || null,
        event_id: formData.event_id || null,
        content_quality: formData.content_quality || null,
        speaker_effectiveness: formData.speaker_effectiveness || null,
        relevance_to_practice: formData.relevance_to_practice || null
      };
      
      await api.post("/evaluations", data);
      toast.success("Evaluation submitted!");
      setShowAddDialog(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error("Failed to submit evaluation");
    }
  };

  const handleDelete = async (evaluationId) => {
    if (!confirm("Delete this evaluation?")) return;
    
    try {
      await api.delete(`/evaluations/${evaluationId}`);
      toast.success("Evaluation deleted");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete evaluation");
    }
  };

  const resetForm = () => {
    setFormData({
      certificate_id: "",
      event_id: "",
      title: "",
      overall_rating: 0,
      content_quality: 0,
      speaker_effectiveness: 0,
      relevance_to_practice: 0,
      would_recommend: null,
      learning_objectives_met: null,
      comments: "",
      improvement_suggestions: "",
      practice_change_planned: ""
    });
  };

  const StarRating = ({ value, onChange, label }) => (
    <div className="space-y-1">
      <Label className="text-sm">{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`p-1 rounded transition-colors ${
              star <= value 
                ? "text-amber-500" 
                : "text-slate-300 hover:text-slate-400"
            }`}
          >
            <Star className={`w-6 h-6 ${star <= value ? "fill-current" : ""}`} />
          </button>
        ))}
      </div>
    </div>
  );

  const getRatingLabel = (rating) => {
    if (rating >= 5) return "Excellent";
    if (rating >= 4) return "Good";
    if (rating >= 3) return "Average";
    if (rating >= 2) return "Below Average";
    if (rating >= 1) return "Poor";
    return "Not Rated";
  };

  const getRatingColor = (rating) => {
    if (rating >= 4) return "text-emerald-600";
    if (rating >= 3) return "text-amber-600";
    return "text-red-600";
  };

  const averageRating = evaluations.length > 0
    ? (evaluations.reduce((sum, e) => sum + e.overall_rating, 0) / evaluations.length).toFixed(1)
    : "N/A";

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">CME Evaluations</h1>
            <p className="text-slate-600">Record feedback on CME activities and track practice changes</p>
          </div>
          <Button onClick={() => setShowAddDialog(true)} data-testid="add-evaluation-btn">
            <Plus className="w-4 h-4 mr-2" />
            New Evaluation
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <ClipboardCheck className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Total Evaluations</p>
                <p className="text-xl font-bold">{evaluations.length}</p>
              </div>
            </div>
          </Card>
          <Card className="px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Star className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Average Rating</p>
                <p className="text-xl font-bold">{averageRating}</p>
              </div>
            </div>
          </Card>
          <Card className="px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <ThumbsUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Would Recommend</p>
                <p className="text-xl font-bold">
                  {evaluations.filter(e => e.would_recommend === true).length} / {evaluations.length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Evaluations List */}
        {loading ? (
          <div className="text-center py-8 text-slate-500">Loading...</div>
        ) : evaluations.length === 0 ? (
          <Card className="p-8 text-center">
            <ClipboardCheck className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No evaluations yet</h3>
            <p className="text-slate-500 mb-4">Submit feedback on your CME activities</p>
            <Button onClick={() => setShowAddDialog(true)} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Evaluation
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {evaluations.map((evaluation) => (
              <Card key={evaluation.evaluation_id} data-testid={`evaluation-${evaluation.evaluation_id}`}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{evaluation.title}</h3>
                      <p className="text-sm text-slate-500">
                        {new Date(evaluation.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= evaluation.overall_rating 
                                  ? "text-amber-500 fill-current" 
                                  : "text-slate-200"
                              }`}
                            />
                          ))}
                        </div>
                        <p className={`text-xs font-medium ${getRatingColor(evaluation.overall_rating)}`}>
                          {getRatingLabel(evaluation.overall_rating)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(evaluation.evaluation_id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {evaluation.content_quality && (
                      <div>
                        <p className="text-xs text-slate-500">Content Quality</p>
                        <p className="font-medium">{evaluation.content_quality}/5</p>
                      </div>
                    )}
                    {evaluation.speaker_effectiveness && (
                      <div>
                        <p className="text-xs text-slate-500">Speaker</p>
                        <p className="font-medium">{evaluation.speaker_effectiveness}/5</p>
                      </div>
                    )}
                    {evaluation.relevance_to_practice && (
                      <div>
                        <p className="text-xs text-slate-500">Relevance</p>
                        <p className="font-medium">{evaluation.relevance_to_practice}/5</p>
                      </div>
                    )}
                    {evaluation.would_recommend !== null && (
                      <div>
                        <p className="text-xs text-slate-500">Recommend?</p>
                        <p className="flex items-center gap-1">
                          {evaluation.would_recommend ? (
                            <><CheckCircle className="w-4 h-4 text-emerald-600" /> Yes</>
                          ) : (
                            <><XCircle className="w-4 h-4 text-red-600" /> No</>
                          )}
                        </p>
                      </div>
                    )}
                  </div>

                  {evaluation.comments && (
                    <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-500 mb-1">Comments</p>
                      <p className="text-sm">{evaluation.comments}</p>
                    </div>
                  )}

                  {evaluation.practice_change_planned && (
                    <div className="mt-3 p-3 bg-emerald-50 rounded-lg">
                      <p className="text-xs text-emerald-600 mb-1">Practice Change Planned</p>
                      <p className="text-sm">{evaluation.practice_change_planned}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add Evaluation Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>New CME Evaluation</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Link to Certificate (optional)</Label>
                <Select
                  value={formData.certificate_id}
                  onValueChange={(value) => setFormData({ ...formData, certificate_id: value === "none" ? "" : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a certificate..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {certificates.map((cert) => (
                      <SelectItem key={cert.certificate_id} value={cert.certificate_id}>
                        {cert.title} ({cert.completion_date})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Link to Event (optional)</Label>
                <Select
                  value={formData.event_id || "none"}
                  onValueChange={(value) => setFormData({ ...formData, event_id: value === "none" ? "" : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an event..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {events.map((event) => (
                      <SelectItem key={event.event_id} value={event.event_id}>
                        {event.title} ({event.start_date})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="title">Activity Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Name of the CME activity"
                  required
                  data-testid="eval-title-input"
                />
              </div>

              <StarRating
                label="Overall Rating *"
                value={formData.overall_rating}
                onChange={(value) => setFormData({ ...formData, overall_rating: value })}
              />

              <div className="grid grid-cols-3 gap-4">
                <StarRating
                  label="Content Quality"
                  value={formData.content_quality}
                  onChange={(value) => setFormData({ ...formData, content_quality: value })}
                />
                <StarRating
                  label="Speaker"
                  value={formData.speaker_effectiveness}
                  onChange={(value) => setFormData({ ...formData, speaker_effectiveness: value })}
                />
                <StarRating
                  label="Relevance"
                  value={formData.relevance_to_practice}
                  onChange={(value) => setFormData({ ...formData, relevance_to_practice: value })}
                />
              </div>

              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <Label>Would Recommend?</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={formData.would_recommend === true ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFormData({ ...formData, would_recommend: true })}
                    >
                      <ThumbsUp className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant={formData.would_recommend === false ? "destructive" : "outline"}
                      size="sm"
                      onClick={() => setFormData({ ...formData, would_recommend: false })}
                    >
                      <ThumbsDown className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Label>Objectives Met?</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={formData.learning_objectives_met === true ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFormData({ ...formData, learning_objectives_met: true })}
                    >
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant={formData.learning_objectives_met === false ? "destructive" : "outline"}
                      size="sm"
                      onClick={() => setFormData({ ...formData, learning_objectives_met: false })}
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="comments">Comments</Label>
                <Textarea
                  id="comments"
                  value={formData.comments}
                  onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                  placeholder="What did you think of this activity?"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="improvement_suggestions">Suggestions for Improvement</Label>
                <Textarea
                  id="improvement_suggestions"
                  value={formData.improvement_suggestions}
                  onChange={(e) => setFormData({ ...formData, improvement_suggestions: e.target.value })}
                  placeholder="How could this activity be improved?"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="practice_change">Practice Change Planned</Label>
                <Textarea
                  id="practice_change"
                  value={formData.practice_change_planned}
                  onChange={(e) => setFormData({ ...formData, practice_change_planned: e.target.value })}
                  placeholder="What will you do differently in your practice as a result of this activity?"
                  rows={2}
                  data-testid="practice-change-input"
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" data-testid="submit-evaluation">Submit Evaluation</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Evaluations;
