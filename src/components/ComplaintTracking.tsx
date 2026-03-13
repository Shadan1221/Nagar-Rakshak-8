import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Search, Clock, CheckCircle, User, MapPin, Phone, Copy, Megaphone, Landmark } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useLanguage } from "@/contexts/LanguageContext"

interface ComplaintTrackingProps {
  onBack: () => void
  initialComplaintId?: string
}

const ComplaintTracking = ({ onBack, initialComplaintId }: ComplaintTrackingProps) => {
  const { t } = useLanguage()
  const [searchId, setSearchId] = useState("")
  const [complaint, setComplaint] = useState<any>(null)
  const [statusUpdates, setStatusUpdates] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (initialComplaintId) {
      setSearchId(initialComplaintId.toUpperCase())
    }
  }, [initialComplaintId])

  useEffect(() => {
    if (complaint) {
      // Set up real-time subscription for this complaint
      const channel = supabase
        .channel(`complaint-${complaint.id}`)
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'complaint_status_updates', filter: `complaint_id=eq.${complaint.id}` },
          () => {
            handleSearch() // Refresh complaint data
          }
        )
        .on('postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'complaints', filter: `id=eq.${complaint.id}` },
          () => {
            handleSearch() // Refresh complaint data
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [complaint?.id])

  const handleSearch = async () => {
    if (!searchId.trim()) {
      toast({
        title: "Please enter a complaint ID",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    
    try {
      // Search for complaint by complaint_code
      const { data: complaintData, error: complaintError } = await supabase
        .from('complaints')
        .select('*')
        .eq('complaint_code', searchId.toUpperCase())
        .single()

      if (complaintError || !complaintData) {
        toast({
          title: "Complaint Not Found",
          description: "Please check the complaint ID and try again",
          variant: "destructive"
        })
        setLoading(false)
        return
      }

      // Fetch status updates
      const { data: updatesData, error: updatesError } = await supabase
        .from('complaint_status_updates')
        .select('*')
        .eq('complaint_id', complaintData.id)
        .order('created_at', { ascending: true })

      if (updatesError) throw updatesError

      setComplaint(complaintData)
      setStatusUpdates(updatesData || [])
      setLoading(false)
      
      toast({
        title: "Complaint Found",
        description: `Status: ${complaintData.status}`,
        variant: "default"
      })
    } catch (error) {
      console.error('Error fetching complaint:', error)
      toast({
        title: "Error",
        description: "Failed to fetch complaint details",
        variant: "destructive"
      })
      setLoading(false)
    }
  }

  const generateTimeline = () => {
    if (!complaint) return []
    
    const statuses = [
      { key: 'registered', label: t('tracking.registered') },
      { key: 'assigned', label: t('tracking.assigned') },
      { key: 'in-progress', label: t('tracking.inProgress') },
      { key: 'resolved', label: t('tracking.resolved') }
    ]
    const currentStatusIndex = statuses.findIndex(s => s.key === complaint.status.toLowerCase())
    
    return statuses.map((status, index) => {
      const statusUpdate = statusUpdates.find(update => update.status.toLowerCase() === status.key)
      const isCompleted = index <= currentStatusIndex
      
      return {
        status: status.label,
        timestamp: statusUpdate 
          ? new Date(statusUpdate.created_at).toLocaleString() 
          : (isCompleted ? 'Processing...' : ''),
        completed: isCompleted,
        authority: statusUpdate?.assigned_to,
        contact: statusUpdate?.assigned_contact,
        note: statusUpdate?.note
      }
    })
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'registered': return 'bg-civic-saffron/20 text-civic-saffron border-civic-saffron/30'
      case 'assigned': return 'bg-civic-blue/20 text-civic-blue border-civic-blue/30'
      case 'in progress': return 'bg-yellow-100 text-yellow-700 border-yellow-300'
      case 'resolved': return 'bg-civic-green/20 text-civic-green border-civic-green/30'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  const buildEscalationSummary = () => {
    if (!complaint) return ""

    const issue = complaint.issue_type || 'Civic issue'
    const location = [complaint.city, complaint.state].filter(Boolean).join(', ')
    const status = complaint.status || 'Pending'
    const description = (complaint.description || '').replace(/\s+/g, ' ').trim()
    const trimmedDescription = description.length > 130 ? `${description.slice(0, 130)}...` : description

    const line1 = `Complaint ${complaint.complaint_code}: ${issue} in ${location} is still ${status}.`
    const line2 = `${trimmedDescription || 'Issue is still unresolved.'} Please help resolve this civic issue urgently. #NagarRakshak`

    return `${line1}\n${line2}`
  }

  const handleCopyForX = async () => {
    const summary = buildEscalationSummary()
    if (!summary) return

    const tweetUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(summary)}`
    const xWindow = window.open('', '_blank', 'noopener,noreferrer')
    let copied = false

    try {
      await navigator.clipboard.writeText(summary)
      copied = true
    } catch {
      // Fallback for browsers that block clipboard API
      const textArea = document.createElement('textarea')
      textArea.value = summary
      textArea.style.position = 'fixed'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      copied = document.execCommand('copy')
      document.body.removeChild(textArea)
    }

    if (xWindow) {
      xWindow.location.href = tweetUrl
    } else {
      window.location.href = tweetUrl
    }

    if (copied) {
      toast({
        title: "Summary copied",
        description: "Complaint summary copied and X opened.",
      })
    } else {
      toast({
        title: "Opening X",
        description: "X opened, but clipboard access was blocked. Please copy manually.",
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-civic-green-light to-background">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm shadow-sm border-b border-civic-green/20">
        <div className="flex items-center p-4 max-w-md mx-auto">
          <Button variant="ghost" size="icon" onClick={onBack} className="mr-3">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">{t('tracking.title')}</h1>
        </div>
      </div>

      <div className="p-6 max-w-md mx-auto space-y-6">
        {/* Search Section */}
        <Card className="border-civic-green/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-civic-green" />
              {t('tracking.enterId')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="complaint-id">{t('complaint.id')}</Label>
              <Input 
                id="complaint-id"
                placeholder="e.g., NGR123456"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
              />
            </div>
            <Button 
              variant="default" 
              className="w-full bg-civic-green hover:bg-civic-green/90"
              onClick={handleSearch}
              disabled={loading}
            >
              <Search className="h-4 w-4 mr-2" />
              {loading ? t('action.loading') : t('tracking.search')}
            </Button>
          </CardContent>
        </Card>

        {/* Complaint Details */}
        {complaint && (
          <div className="space-y-4">
            {/* Complaint Info */}
            <Card className="border-civic-saffron/20">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{complaint.issue_type}</span>
                  <Badge className={getStatusColor(complaint.status)}>
                    {complaint.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-civic-saffron mt-1" />
                  <p className="text-sm">{complaint.city}, {complaint.state}</p>
                </div>
                <p className="text-sm text-muted-foreground">{complaint.description}</p>
                {complaint.media_url && (
                  <div className="mt-3">
                    <img 
                      src={complaint.media_url} 
                      alt="Complaint evidence" 
                      className="max-w-full h-auto rounded-lg border"
                    />
                  </div>
                )}
                <div className="bg-civic-saffron/5 rounded-lg p-3">
                  <p className="text-sm font-medium">{t('complaint.id')}: {complaint.complaint_code}</p>
                  <p className="text-xs text-muted-foreground">
                    Submitted: {new Date(complaint.created_at).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card className="border-civic-green/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-civic-green" />
                  {t('tracking.timeline')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {generateTimeline().map((step: any, index: number) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className={`w-4 h-4 rounded-full mt-1 ${
                        step.completed 
                          ? 'bg-civic-green' 
                          : index === generateTimeline().findIndex((s: any) => !s.completed)
                            ? 'bg-civic-saffron animate-pulse'
                            : 'bg-muted'
                      }`} />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className={`text-sm font-medium ${
                            step.completed ? 'text-civic-green' : 'text-muted-foreground'
                          }`}>
                            {step.status}
                          </p>
                          {step.completed && (
                            <CheckCircle className="h-4 w-4 text-civic-green" />
                          )}
                        </div>
                        
                        {step.timestamp && (
                          <p className="text-xs text-muted-foreground mb-2">
                            {step.timestamp}
                          </p>
                        )}
                        
                        {step.note && (
                          <p className="text-xs text-muted-foreground mb-2 italic">
                            {step.note}
                          </p>
                        )}
                        
                        {step.authority && (
                          <div className="bg-civic-blue/5 rounded p-2 text-xs">
                            <div className="flex items-center gap-1 mb-1">
                              <User className="h-3 w-3" />
                              <span className="font-medium">{step.authority}</span>
                            </div>
                            {step.contact && (
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Contact: {step.contact}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-xs"
                                  onClick={() => window.open(`tel:${step.contact}`)}
                                >
                                  <Phone className="h-3 w-3 mr-1" />
                                  Call
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Authority Contact */}
            {complaint.status !== 'Resolved' && statusUpdates.find(update => update.assigned_to) && (
              <Card className="border-civic-blue/20 bg-civic-blue/5">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Assigned Authority</h4>
                      <p className="text-sm text-muted-foreground">
                        {statusUpdates.find(update => update.assigned_to)?.assigned_to}
                      </p>
                    </div>
                    {statusUpdates.find(update => update.assigned_contact) && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="border-civic-blue text-civic-blue hover:bg-civic-blue hover:text-white"
                        onClick={() => window.open(`tel:${statusUpdates.find(update => update.assigned_contact)?.assigned_contact}`)}
                      >
                        Call: {statusUpdates.find(update => update.assigned_contact)?.assigned_contact}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Escalation to X */}
            {complaint.status !== 'Resolved' && (
              <Card className="relative overflow-hidden border-2 border-civic-saffron/40 bg-gradient-to-br from-orange-50 via-amber-50 to-rose-50 shadow-sm">
                <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-civic-saffron/15 blur-2xl" />
                <CardContent className="relative p-4 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-civic-saffron/15 p-2">
                      <Megaphone className="h-5 w-5 text-civic-saffron" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-civic-saffron text-lg leading-tight">
                        Is your issue not resolved yet?
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Post it on X to highlight your issue to the authorities.
                      </p>
                      <p className="text-sm font-medium text-civic-saffron mt-1">
                        Automatically tag the concerned authority with Civic Tag.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-civic-saffron/20 bg-white/65 px-3 py-2.5">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <Copy className="h-3.5 w-3.5 text-civic-saffron" />
                        Copies your complaint summary
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Megaphone className="h-3.5 w-3.5 text-civic-saffron" />
                        Opens the X composer
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Landmark className="h-3.5 w-3.5 text-civic-saffron" />
                        Includes Civic Tag
                      </span>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-civic-saffron hover:bg-civic-saffron/90 text-white"
                    onClick={handleCopyForX}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Summary for X
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Instructions */}
        {!complaint && (
          <Card className="border-civic-saffron/20 bg-civic-saffron/5">
            <CardContent className="p-4 text-center">
              <Search className="h-12 w-12 text-civic-saffron mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Track Your Complaint</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Enter your complaint ID to see real-time status updates and contact information.
              </p>
              <Badge variant="outline" className="border-civic-saffron text-civic-saffron">
                Real-time Tracking
              </Badge>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default ComplaintTracking