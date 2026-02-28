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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
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
  CalendarDays,
  Plus,
  Trash2,
  Edit,
  MapPin,
  Clock,
  ExternalLink,
  DollarSign,
  CheckCircle,
  Key,
  Users,
  Calendar
} from "lucide-react";
import { toast } from "sonner";

const Events = () => {
  const [events, setEvents] = useState([]);
  const [cmeTypes, setCmeTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showSignInDialog, setShowSignInDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [passcode, setPasscode] = useState("");
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    provider: "",
    location: "",
    event_url: "",
    start_date: "",
    end_date: "",
    start_time: "",
    end_time: "",
    credits_available: "",
    credit_types: [],
    registration_url: "",
    cost: "",
    notes: ""
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      const query = activeTab === "upcoming" ? "?upcoming=true" : activeTab === "past" ? "?past=true" : "";
      const [eventsRes, cmeRes] = await Promise.all([
        api.get(`/events${query}`),
        api.get("/cme-types")
      ]);
      setEvents(eventsRes.data);
      setCmeTypes(cmeRes.data);
    } catch (error) {
      toast.error("Failed to load events");
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
        credits_available: formData.credits_available ? parseFloat(formData.credits_available) : null,
        cost: formData.cost ? parseFloat(formData.cost) : null
      };
      
      await api.post("/events", data);
      toast.success("Event added to calendar!");
      setShowAddDialog(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error("Failed to add event");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    try {
      const data = {
        title: formData.title,
        description: formData.description,
        provider: formData.provider,
        location: formData.location,
        event_url: formData.event_url,
        start_date: formData.start_date,
        end_date: formData.end_date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        credits_available: formData.credits_available ? parseFloat(formData.credits_available) : null,
        credit_types: formData.credit_types,
        registration_url: formData.registration_url,
        cost: formData.cost ? parseFloat(formData.cost) : null,
        notes: formData.notes
      };
      
      await api.put(`/events/${selectedEvent.event_id}`, data);
      toast.success("Event updated!");
      setShowEditDialog(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error("Failed to update event");
    }
  };

  const handleDelete = async (eventId) => {
    if (!confirm("Delete this event?")) return;
    
    try {
      await api.delete(`/events/${eventId}`);
      toast.success("Event deleted");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete event");
    }
  };

  const handleToggleRegistration = async (eventId) => {
    try {
      const res = await api.post(`/events/${eventId}/register`);
      toast.success(res.data.is_registered ? "Registered for event!" : "Registration cancelled");
      fetchData();
    } catch (error) {
      toast.error("Failed to update registration");
    }
  };

  const handleMarkAttended = async (eventId, eventPasscode) => {
    try {
      await api.post(`/events/${eventId}/attend`, { passcode: eventPasscode });
      toast.success("Marked as attended!");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to mark as attended");
    }
  };

  const handlePasscodeSignIn = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/events/sign-in", { passcode });
      toast.success(res.data.message);
      setShowSignInDialog(false);
      setPasscode("");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Invalid passcode");
    }
  };

  const openEditDialog = (event) => {
    setSelectedEvent(event);
    setFormData({
      title: event.title,
      description: event.description || "",
      provider: event.provider,
      location: event.location || "",
      event_url: event.event_url || "",
      start_date: event.start_date,
      end_date: event.end_date || "",
      start_time: event.start_time || "",
      end_time: event.end_time || "",
      credits_available: event.credits_available?.toString() || "",
      credit_types: event.credit_types || [],
      registration_url: event.registration_url || "",
      cost: event.cost?.toString() || "",
      notes: event.notes || ""
    });
    setShowEditDialog(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      provider: "",
      location: "",
      event_url: "",
      start_date: "",
      end_date: "",
      start_time: "",
      end_time: "",
      credits_available: "",
      credit_types: [],
      registration_url: "",
      cost: "",
      notes: ""
    });
    setSelectedEvent(null);
  };

  const getCreditTypeName = (typeId) => {
    const type = cmeTypes.find(t => t.id === typeId);
    return type?.name || typeId;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  const upcomingEvents = events.filter(e => new Date(e.start_date) >= new Date(new Date().toDateString()));
  const pastEvents = events.filter(e => new Date(e.start_date) < new Date(new Date().toDateString()));

  const EventCard = ({ event }) => (
    <Card key={event.event_id} className="overflow-hidden" data-testid={`event-card-${event.event_id}`}>
      <div className={`h-1 ${event.is_attended ? 'bg-emerald-500' : event.is_registered ? 'bg-indigo-500' : 'bg-slate-200'}`} />
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900">{event.title}</h3>
            <p className="text-sm text-slate-600">{event.provider}</p>
          </div>
          <div className="flex gap-1">
            {event.is_attended && (
              <Badge className="bg-emerald-50 text-emerald-700">
                <CheckCircle className="w-3 h-3 mr-1" />
                Attended
              </Badge>
            )}
            {event.is_registered && !event.is_attended && (
              <Badge className="bg-indigo-50 text-indigo-700">Registered</Badge>
            )}
          </div>
        </div>

        <div className="space-y-2 text-sm text-slate-600 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(event.start_date)}</span>
            {event.end_date && event.end_date !== event.start_date && (
              <span>- {formatDate(event.end_date)}</span>
            )}
            {event.start_time && (
              <span className="text-slate-400">| {event.start_time}{event.end_time && ` - ${event.end_time}`}</span>
            )}
          </div>
          
          {event.location && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{event.location}</span>
            </div>
          )}
          
          {event.credits_available && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{event.credits_available} credits available</span>
            </div>
          )}
          
          {event.cost > 0 && (
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              <span>${event.cost}</span>
            </div>
          )}
        </div>

        {event.credit_types?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {event.credit_types.map((type, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {getCreditTypeName(type)}
              </Badge>
            ))}
          </div>
        )}

        {event.passcode && (
          <div className="mb-3 px-3 py-2 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-xs text-amber-700 flex items-center gap-1">
              <Key className="w-3 h-3" />
              Event Passcode: <span className="font-mono font-bold">{event.passcode}</span>
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {event.event_url && (
            <Button variant="outline" size="sm" onClick={() => window.open(event.event_url, '_blank')}>
              <ExternalLink className="w-3 h-3 mr-1" />
              Details
            </Button>
          )}
          {event.registration_url && (
            <Button variant="outline" size="sm" onClick={() => window.open(event.registration_url, '_blank')}>
              <Users className="w-3 h-3 mr-1" />
              Register
            </Button>
          )}
          {!event.is_attended && (
            <Button
              variant={event.is_registered ? "secondary" : "outline"}
              size="sm"
              onClick={() => handleToggleRegistration(event.event_id)}
            >
              {event.is_registered ? "Cancel Registration" : "Mark Registered"}
            </Button>
          )}
          {!event.is_attended && (
            <Button
              variant="default"
              size="sm"
              onClick={() => handleMarkAttended(event.event_id)}
            >
              <CheckCircle className="w-3 h-3 mr-1" />
              Mark Attended
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={() => openEditDialog(event)}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(event.event_id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">CME Events Calendar</h1>
            <p className="text-slate-600">Track upcoming conferences, courses, and educational events</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowSignInDialog(true)} data-testid="passcode-signin-btn">
              <Key className="w-4 h-4 mr-2" />
              Enter Passcode
            </Button>
            <Button onClick={() => setShowAddDialog(true)} data-testid="add-event-btn">
              <Plus className="w-4 h-4 mr-2" />
              Add Event
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
            <TabsTrigger value="all">All Events</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-4">
            {loading ? (
              <div className="text-center py-8 text-slate-500">Loading...</div>
            ) : upcomingEvents.length === 0 ? (
              <Card className="p-8 text-center">
                <CalendarDays className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No upcoming events</h3>
                <p className="text-slate-500 mb-4">Add CME events to your calendar to track your schedule</p>
                <Button onClick={() => setShowAddDialog(true)} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Event
                </Button>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {upcomingEvents.map((event) => (
                  <EventCard key={event.event_id} event={event} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past" className="mt-4">
            {pastEvents.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-slate-500">No past events</p>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {pastEvents.map((event) => (
                  <EventCard key={event.event_id} event={event} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="all" className="mt-4">
            {events.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-slate-500">No events yet</p>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {events.map((event) => (
                  <EventCard key={event.event_id} event={event} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Passcode Sign-In Dialog */}
        <Dialog open={showSignInDialog} onOpenChange={setShowSignInDialog}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Event Sign-In</DialogTitle>
            </DialogHeader>
            <form onSubmit={handlePasscodeSignIn} className="space-y-4">
              <div>
                <Label htmlFor="passcode">Enter 6-Digit Passcode</Label>
                <Input
                  id="passcode"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="text-center text-2xl tracking-widest font-mono"
                  maxLength={6}
                  data-testid="passcode-input"
                />
                <p className="text-xs text-slate-500 mt-1">Enter the passcode provided at the event</p>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowSignInDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={passcode.length !== 6} data-testid="submit-passcode">
                  Sign In
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Add Event Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add CME Event</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Annual Cardiology Conference"
                  required
                  data-testid="event-title-input"
                />
              </div>

              <div>
                <Label htmlFor="provider">Provider/Organization *</Label>
                <Input
                  id="provider"
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  placeholder="e.g., American College of Cardiology"
                  required
                  data-testid="event-provider-input"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Event details..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Start Date *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                    data-testid="event-start-date"
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_time">Start Time</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="end_time">End Time</Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="City, State or 'Virtual'"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="credits_available">Credits Available</Label>
                  <Input
                    id="credits_available"
                    type="number"
                    step="0.25"
                    min="0"
                    value={formData.credits_available}
                    onChange={(e) => setFormData({ ...formData, credits_available: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="cost">Cost ($)</Label>
                  <Input
                    id="cost"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <Label>Credit Types Available</Label>
                <div className="grid grid-cols-2 gap-2 max-h-[120px] overflow-y-auto p-2 border rounded-lg mt-1">
                  {cmeTypes.map((type) => (
                    <div key={type.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`event-type-${type.id}`}
                        checked={formData.credit_types.includes(type.id)}
                        onCheckedChange={() => handleCreditTypeToggle(type.id)}
                      />
                      <label htmlFor={`event-type-${type.id}`} className="text-sm cursor-pointer">
                        {type.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="event_url">Event Website</Label>
                <Input
                  id="event_url"
                  type="url"
                  value={formData.event_url}
                  onChange={(e) => setFormData({ ...formData, event_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div>
                <Label htmlFor="registration_url">Registration URL</Label>
                <Input
                  id="registration_url"
                  type="url"
                  value={formData.registration_url}
                  onChange={(e) => setFormData({ ...formData, registration_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" data-testid="submit-event">Add Event</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Event Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Event</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <Label htmlFor="edit_title">Event Title</Label>
                <Input
                  id="edit_title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="edit_provider">Provider</Label>
                <Input
                  id="edit_provider"
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Location</Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Credits Available</Label>
                  <Input
                    type="number"
                    step="0.25"
                    value={formData.credits_available}
                    onChange={(e) => setFormData({ ...formData, credits_available: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Cost ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Credit Types</Label>
                <div className="grid grid-cols-2 gap-2 max-h-[120px] overflow-y-auto p-2 border rounded-lg mt-1">
                  {cmeTypes.map((type) => (
                    <div key={type.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-event-type-${type.id}`}
                        checked={formData.credit_types.includes(type.id)}
                        onCheckedChange={() => handleCreditTypeToggle(type.id)}
                      />
                      <label htmlFor={`edit-event-type-${type.id}`} className="text-sm cursor-pointer">
                        {type.name}
                      </label>
                    </div>
                  ))}
                </div>
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

export default Events;
