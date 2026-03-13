import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Camera, MapPin, Send, CheckCircle, LoaderCircle, Copy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { indianStates, getCitiesByState } from "@/data/indianStatesAndCities"
import { useLanguage } from "@/contexts/LanguageContext"
import { createComplaintNotifications } from "../services/notificationService"

interface ComplaintRegistrationProps {
  onBack: () => void
  onTrackComplaint?: (complaintId?: string) => void
}

type AiAnalysisResult = {
  is_relevant: boolean
  description?: string
  reason?: string
}

const ComplaintRegistration = ({ onBack, onTrackComplaint }: ComplaintRegistrationProps) => {
  const { t, language } = useLanguage()
  const [step, setStep] = useState<'form' | 'success'>('form')
  const [locationFetchKey, setLocationFetchKey] = useState(0)
  const [isLocating, setIsLocating] = useState(true)
  const [complaintId, setComplaintId] = useState<string>('')
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<BlobPart[]>([])
  const cameraInputRef = useRef<HTMLInputElement | null>(null)
  const galleryInputRef = useRef<HTMLInputElement | null>(null)


  const [formData, setFormData] = useState({
    state: '',
    city: '',
    district: '',
    address1: '',
    address2: '',
    issueType: '',
    description: '',
    media: null as File | null,
    audio: null as File | null,
    gpsLatitude: null as number | null,
    gpsLongitude: null as number | null
  })

  const issueTypes = [
    { value: 'streetlight', label: `🔦 ${t('issue.streetlight')}`, category: 'Infrastructure' },
    { value: 'pothole', label: `🕳️ ${t('issue.pothole')}`, category: 'Roads' },
    { value: 'garbage', label: `🗑️ ${t('issue.garbage')}`, category: 'Sanitation' },
    { value: 'drainage', label: `🌊 ${t('issue.drainage')}`, category: 'Water' },
    { value: 'water', label: `💧 ${t('issue.water')}`, category: 'Water' },
    { value: 'electricity', label: `⚡ ${t('issue.electricity')}`, category: 'Utilities' },
    { value: 'noise', label: `🔊 ${t('issue.noise')}`, category: 'Environment' },
    { value: 'others', label: `📝 ${t('issue.others')}`, category: 'General' }
  ]

  const states = indianStates
  const cities = formData.state ? getCitiesByState(formData.state) : []

  const normalizeLocationToken = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '')
  const stateAliasMap: Record<string, string> = {
    uttrakhand: 'Uttarakhand',
    uttaranchal: 'Uttarakhand',
    nctofdelhi: 'Delhi',
    delhinct: 'Delhi',
    orissa: 'Odisha',
  }
  const stripStatePrefix = (value: string) => value
    .replace(/^state of\s+/i, '')
    .replace(/^union territory of\s+/i, '')
    .replace(/^nct of\s+/i, '')
    .trim()

  const cleanCityCandidate = (value: string) => value
    .replace(/\b(district|dist\.?|tehsil|taluk|taluka|subdistrict|mandal|block|division|municipal corporation|mc)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()

  const resolveStateName = (candidate: string) => {
    if (!candidate) return ''

    const candidates = [candidate, stripStatePrefix(candidate)]
      .map((value) => value.trim())
      .filter(Boolean)

    for (const candidateValue of candidates) {
      const normalizedCandidate = normalizeLocationToken(candidateValue)
      const aliasMatch = stateAliasMap[normalizedCandidate]
      if (aliasMatch) return aliasMatch

      const exactMatch = states.find((state) => normalizeLocationToken(state) === normalizedCandidate)
      if (exactMatch) return exactMatch

      const partialMatch = states.find((state) => {
        const normalizedState = normalizeLocationToken(state)
        return normalizedState.includes(normalizedCandidate) || normalizedCandidate.includes(normalizedState)
      })
      if (partialMatch) return partialMatch
    }

    return ''
  }

  const resolveCityName = (state: string, candidate: string) => {
    if (!candidate) return ''

    const cleanedCandidate = cleanCityCandidate(candidate)
    if (!cleanedCandidate) return ''
    if (!state) return cleanedCandidate

    const availableCities = getCitiesByState(state)
    const normalizedCandidate = normalizeLocationToken(cleanedCandidate)
    const exactMatch = availableCities.find((city) => normalizeLocationToken(city) === normalizedCandidate)
    if (exactMatch) return exactMatch

    const partialMatch = availableCities.find((city) => {
      const normalizedCity = normalizeLocationToken(city)
      return normalizedCity.includes(normalizedCandidate) || normalizedCandidate.includes(normalizedCity)
    })

    return partialMatch || ''
  }

  const resolveCityFromCandidates = (state: string, candidates: Array<string | null | undefined>) => {
    for (const candidate of candidates) {
      if (!candidate) continue
      const resolved = resolveCityName(state, candidate)
      if (resolved) return resolved
    }
    return ''
  }

  const getCurrentPositionWithHighAccuracy = () =>
    new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      })
    })

  useEffect(() => {
    let isMounted = true

    const reverseGeocodeLocation = async (latitude: number, longitude: number) => {
      let rawState = ''
      const rawCityCandidates: string[] = []
      let address1 = ''
      let address2 = ''

      const nominatimResponse = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1&accept-language=en`
      )

      if (nominatimResponse.ok) {
        const nominatimResult = await nominatimResponse.json()
        const nominatimAddress = nominatimResult?.address || {}

        rawState = (nominatimAddress.state || nominatimAddress['state_district'] || nominatimAddress.region || '') as string
        rawCityCandidates.push(
          nominatimAddress.city,
          nominatimAddress.town,
          nominatimAddress.city_district,
          nominatimAddress.county,
          nominatimAddress.state_district,
          nominatimAddress.municipality,
          nominatimAddress.village,
          nominatimAddress.hamlet
        )
        address1 = [nominatimAddress.house_number, nominatimAddress.road].filter(Boolean).join(', ')
        address2 = [nominatimAddress.suburb, nominatimAddress.neighbourhood, nominatimAddress.postcode].filter(Boolean).join(', ')
      }

      const preliminaryState = resolveStateName(rawState) || rawState.trim()
      const preliminaryCity = resolveCityFromCandidates(preliminaryState, rawCityCandidates)
      const shouldUseFallback = !rawState || !preliminaryCity

      if (shouldUseFallback) {
        const fallbackResponse = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
        )

        if (fallbackResponse.ok) {
          const fallbackResult = await fallbackResponse.json()
          const fallbackState = (fallbackResult?.principalSubdivision || fallbackResult?.localityInfo?.administrative?.[1]?.name || '') as string
          const fallbackCityCandidates: Array<string | null | undefined> = [
            fallbackResult?.city,
            fallbackResult?.locality,
            fallbackResult?.localityInfo?.administrative?.[2]?.name,
            fallbackResult?.localityInfo?.administrative?.[3]?.name,
          ]

          for (const adminEntry of fallbackResult?.localityInfo?.administrative || []) {
            fallbackCityCandidates.push(adminEntry?.name)
          }

          rawState = rawState || fallbackState
          rawCityCandidates.push(...fallbackCityCandidates as string[])

          address2 = address2 || [fallbackResult?.locality, fallbackResult?.postcode].filter(Boolean).join(', ')
        }
      }

      const resolvedState = resolveStateName(rawState) || rawState.trim()
      const resolvedCity = resolveCityFromCandidates(resolvedState, rawCityCandidates)

      return {
        resolvedState,
        resolvedCity,
        address1,
        address2,
      }
    }

    const autoFillLocation = async () => {
      if (!navigator.geolocation) {
        if (!isMounted) return
        setIsLocating(false)
        toast({
          title: "Location not supported",
          description: "Your browser does not support location. Please fill location manually.",
          variant: "destructive"
        })
        return
      }

      if (isMounted) setIsLocating(true)

      try {
        const position = await getCurrentPositionWithHighAccuracy()
        if (!isMounted) return

        const { latitude, longitude } = position.coords

        try {
          const geocoded = await reverseGeocodeLocation(latitude, longitude)
          if (!isMounted) return

          setFormData((prev) => ({
            ...prev,
            state: geocoded.resolvedState || prev.state,
            city: geocoded.resolvedCity || prev.city,
            address1: geocoded.address1 || prev.address1,
            address2: geocoded.address2 || prev.address2,
            gpsLatitude: latitude,
            gpsLongitude: longitude,
          }))

          const hasRequiredLocation = Boolean((geocoded.resolvedState || '').trim() && (geocoded.resolvedCity || '').trim())

          toast({
            title: hasRequiredLocation ? "Location fetched" : "Location partially fetched",
            description: hasRequiredLocation
              ? "State, city and GPS coordinates were fetched automatically."
              : "GPS coordinates were fetched, but state/city mapping is incomplete. Please verify and update manually.",
            variant: hasRequiredLocation ? "default" : "destructive"
          })
        } catch (error) {
          console.error('Reverse geocoding error:', error)
          if (!isMounted) return

          setFormData((prev) => ({
            ...prev,
            gpsLatitude: latitude,
            gpsLongitude: longitude,
          }))
          toast({
            title: "Location partially fetched",
            description: "GPS coordinates were fetched, but address lookup failed. Please fill state and city manually.",
            variant: "destructive"
          })
        }
      } catch (error) {
        console.error('Geolocation error:', error)
        if (!isMounted) return

        toast({
          title: "Location permission needed",
          description: "Please allow location access, or fill location manually below.",
          variant: "destructive"
        })
      } finally {
        if (isMounted) setIsLocating(false)
      }
    }

    autoFillLocation()

    return () => {
      isMounted = false
    }
  }, [locationFetchKey])

  const mapAuthorityForIssue = (issue: string): string | null => {
    const normalized = (issue || '').toLowerCase()
    if (normalized.includes('electric')) return 'Electricity Department'
    if (normalized.includes('water') || normalized.includes('drain')) return 'Jal Board / Water Supply Department'
    if (normalized.includes('garbage')) return 'Nagar Nigam / Municipal Corporation'
    if (normalized.includes('pothole') || normalized.includes('road')) return 'Public Works Department (PWD)'
    if (normalized.includes('street')) return 'Nagar Nigam / Municipal Corporation (Street Lighting Division)'
    if (normalized.includes('transport')) return 'Local Transport Authority / RTO'
    if (normalized.includes('noise')) return 'Pollution Control Board / Local Police Authority'
    return null
  }

  const analyzeComplaintImage = async (imageData: string, issueType: string): Promise<AiAnalysisResult> => {
    const { data, error } = await supabase.functions.invoke('analyze-complaint-image', {
      body: { imageData, issueType },
    })

    if (error) throw new Error(error.message)
    if (!data || typeof data !== 'object') throw new Error('Invalid response from AI function')

    return data as AiAnalysisResult
  }

  const handleCopyComplaintId = async () => {
    if (!complaintId) return

    try {
      await navigator.clipboard.writeText(complaintId)
      toast({
        title: "Complaint ID copied",
        description: `${complaintId} copied to clipboard.`,
      })
    } catch {
      const textArea = document.createElement('textarea')
      textArea.value = complaintId
      textArea.style.position = 'fixed'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)

      toast({
        title: "Complaint ID copied",
        description: `${complaintId} copied to clipboard.`,
      })
    }
  }


  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!formData.issueType) {
        toast({
            title: "Please select an issue type first",
            description: "The AI needs to know what kind of issue to look for.",
            variant: "destructive"
        });
        e.target.value = ''; // Reset file input
        return;
    }

    setFormData(prev => ({ ...prev, media: file, description: '' })); // Clear previous description
    setIsAnalyzing(true);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const base64data = reader.result?.toString().split(',')[1];

      if (!base64data) {
        setIsAnalyzing(false);
        toast({
          title: "AI Analysis Failed",
          description: "Selected image could not be read. Please try another image.",
          variant: "destructive"
        });
        return;
      }

        try {
        const data = await analyzeComplaintImage(base64data, formData.issueType);
            
            if (data.is_relevant) {
                setFormData(prev => ({ ...prev, description: data.description }));
                toast({
                    title: "Image Analyzed Successfully",
                    description: "An AI-generated description has been added.",
                });
            } else {
                setFormData(prev => ({ ...prev, media: null })); // Clear invalid media
                e.target.value = ''; // Reset file input
                toast({
                    title: "Irrelevant Image Detected",
                    description: data.reason || "Please upload an image related to the selected issue.",
                    variant: "destructive"
                });
            }
        } catch (err: any) {
            console.error('Error analyzing image:', err);
            toast({
                title: "AI Analysis Failed",
            description: "AI service is unreachable right now. You can still type description manually and submit.",
                variant: "destructive"
            });
        } finally {
            setIsAnalyzing(false);
        }
    };
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data)
      }
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' })
        setFormData(prev => ({ ...prev, audio: file }))
        // stop tracks
        stream.getTracks().forEach(t => t.stop())
      }
      mediaRecorder.start()
      setIsRecording(true)
    } catch (err) {
      console.error('Audio recording error:', err)
      toast({ title: 'Microphone access denied', variant: 'destructive' })
    }
  }

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const handleSubmit = async () => {
    if (!formData.media) {
        toast({
          title: "Upload Media is required",
          description: "Please add a relevant photo or video.",
          variant: "destructive"
        })
        return
      }
    if (!formData.issueType || !formData.description) {
        toast({
          title: "Missing Information",
          description: "Please fill issue type and description",
          variant: "destructive"
        })
        return
      }
    if (isLocating && (!formData.state || !formData.city)) {
        toast({
          title: "Fetching location",
          description: "Please wait a moment while we auto-fill your location.",
          variant: "default"
        })
        return
      }
    if (!formData.state || !formData.city) {
        toast({
          title: "Location Required",
          description: "We could not auto-fill full location. Please fill state and city manually.",
          variant: "destructive"
        })
        return
      }
      setIsSubmitting(true);
      try {
        let mediaUrl = null
        let audioUrl = null
  
        if (formData.media) {
          const fileExt = formData.media.name.split('.').pop()
          const fileName = `${Date.now()}.${fileExt}`
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('complaints')
            .upload(fileName, formData.media)
  
          if (uploadError) throw uploadError
          
          const { data: { publicUrl } } = supabase.storage
            .from('complaints')
            .getPublicUrl(fileName)
          
          mediaUrl = publicUrl
        }
  
        const { data, error } = await supabase
          .from('complaints')
          .insert({
            state: formData.state,
            city: formData.city, 
            address_line1: formData.address1 || null,
            address_line2: (formData.district ? `${formData.district}${formData.address2 ? ', ' + formData.address2 : ''}` : (formData.address2 || null)),
            issue_type: formData.issueType,
            description: formData.description,
            media_url: mediaUrl,
            voice_note_url: audioUrl,
            gps_latitude: formData.gpsLatitude,
            gps_longitude: formData.gpsLongitude
          } as any)
          .select('id, complaint_code, issue_type, city, state')
          .single()
  
        if (error) throw error
  
        setComplaintId(data.complaint_code)

        // Auto-assign routing based on issue type
        const authority = mapAuthorityForIssue(formData.issueType)
        if (authority) {
          await supabase
            .from('complaints')
            .update({ status: 'Assigned' as any, assigned_to: authority })
            .eq('id', (data as any).id)

          await supabase
            .from('complaint_status_updates')
            .insert({
              complaint_id: (data as any).id,
              status: 'Assigned' as any,
              assigned_to: authority,
              note: `Auto-routed based on issue type: ${formData.issueType}`
            } as any)
        }

        // Create notifications for the complaint stages
        await createComplaintNotifications(
          (data as any).id,
          data.complaint_code,
          formData.issueType,
          language
        )

        setStep('success')
        
        toast({
          title: "Report Submitted Successfully! 🎉",
          description: `Complaint ID: ${data.complaint_code}`,
          variant: "default"
        })
      } catch (error) {
        console.error('Error submitting complaint:', error)
        toast({
          title: "Submission Failed",
          description: "Please try again later",
          variant: "destructive"
        })
      } finally {
          setIsSubmitting(false);
      }
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-civic-green-light to-background p-6">
        <div className="max-w-md mx-auto pt-8">
          <Card className="border-civic-green border-2 shadow-success">
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                <CheckCircle className="h-20 w-20 text-civic-green mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-civic-green mb-2">
                  {t('complaint.success')} 🎉
                </h2>
              </div>

              <div className="bg-civic-green/10 rounded-lg p-4 mb-6">
                <p className="text-sm text-muted-foreground mb-2">{t('complaint.id')}</p>
                <div className="flex items-center justify-center gap-2">
                  <p className="text-2xl font-bold text-civic-green font-mono">{complaintId}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-civic-green hover:bg-civic-green/10"
                    onClick={handleCopyComplaintId}
                    aria-label="Copy complaint ID"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="bg-gradient-to-r from-civic-saffron/10 to-civic-green/10 rounded-lg p-4 mb-6">
                <p className="font-semibold text-civic-saffron text-lg mb-2">
                  🙏 {t('complaint.thankYou')}
                </p>
                <p className="font-bold text-civic-green">
                  {t('app.title')}!
                </p>
              </div>

              <div className="space-y-3">
                <Button 
                  variant="default"
                  size="lg" 
                  className="w-full"
                  onClick={() => (onTrackComplaint ? onTrackComplaint(complaintId) : onBack())}
                >
                  {t('dashboard.trackComplaint')}
                </Button>
                
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="w-full"
                  onClick={() => {
                    setStep('form')
                    setFormData({
                      state: '',
                      city: '',
                      district: '',
                      address1: '',
                      address2: '',
                      issueType: '',
                      description: '',
                      media: null,
                      audio: null,
                      gpsLatitude: null,
                      gpsLongitude: null
                    })
                    setLocationFetchKey((prev) => prev + 1)
                  }}
                >
                  {t('dashboard.registerComplaint')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-civic-orange-light to-background">
      <div className="bg-white/90 backdrop-blur-sm shadow-sm border-b border-civic-saffron/20">
        <div className="flex items-center p-4 max-w-md mx-auto">
          <Button variant="ghost" size="icon" onClick={onBack} className="mr-3">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">{t('complaint.title')}</h1>
        </div>
      </div>

      <div className="p-6 max-w-md mx-auto">
        <Card className="shadow-lg border-civic-saffron/20">
          <CardHeader className="bg-gradient-to-r from-civic-saffron/5 to-civic-green/5">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-civic-saffron" />
              {t('complaint.location')}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-6 space-y-6">
            <div className="space-y-4">
               <div>
                <Label htmlFor="issueType">{t('complaint.issueType')} *</Label>
                <Select value={formData.issueType} onValueChange={(value) => setFormData(prev => ({...prev, issueType: value}))}>
                  <SelectTrigger id="issueType">
                    <SelectValue placeholder="Select issue type" />
                  </SelectTrigger>
                  <SelectContent>
                    {issueTypes.map(issue => (
                      <SelectItem key={issue.value} value={issue.value}>
                        <div className="flex items-center justify-between w-full">
                          <span>{issue.label}</span>
                          <Badge variant="secondary" className="ml-2">{issue.category}</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="state">{t('complaint.state')} *</Label>
                <Select disabled={isLocating} value={formData.state} onValueChange={(value) => setFormData(prev => ({...prev, state: value, city: ''}))}>
                  <SelectTrigger id="state">
                    <SelectValue placeholder={isLocating ? "Fetching location..." : "Select your state"} />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map(state => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="city">{t('complaint.city')} *</Label>
                <Select disabled={isLocating} value={formData.city} onValueChange={(value) => setFormData(prev => ({...prev, city: value}))}>
                  <SelectTrigger id="city">
                    <SelectValue placeholder={isLocating ? "Fetching location..." : (formData.state ? "Select your city" : "Select state first")} />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map(city => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="district">{t('complaint.district')} ({t('action.optional')})</Label>
                <Input
                  id="district"
                  placeholder="Enter district (optional)"
                  value={formData.district}
                  onChange={(e) => setFormData(prev => ({...prev, district: e.target.value}))}
                />
              </div>
              <div>
                <Label htmlFor="address1">{t('complaint.address1')} ({t('action.optional')})</Label>
                <Input
                  id="address1"
                  placeholder="House no., Street, Landmark"
                  value={formData.address1}
                  onChange={(e) => setFormData(prev => ({...prev, address1: e.target.value}))}
                />
              </div>
              <div>
                <Label htmlFor="address2">{t('complaint.address2')} ({t('action.optional')})</Label>
                <Input
                  id="address2"
                  placeholder="Area, Locality"
                  value={formData.address2}
                  onChange={(e) => setFormData(prev => ({...prev, address2: e.target.value}))}
                />
              </div>
            </div>

            <div>
              <Label>{t('complaint.media')} *</Label>
              <div className="border-2 border-dashed border-civic-saffron/30 rounded-lg p-4 text-center hover:border-civic-saffron/50 transition-colors">
                {/* capture="environment" tells mobile browsers to open the rear camera directly */}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleMediaUpload}
                  className="hidden"
                  id="media-upload-camera"
                  ref={cameraInputRef}
                  disabled={isAnalyzing}
                />
                {/* No capture attribute — opens file picker / gallery */}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleMediaUpload}
                  className="hidden"
                  id="media-upload-gallery"
                  ref={galleryInputRef}
                  disabled={isAnalyzing}
                />
                <div className="flex items-center justify-center gap-2">
                  <Button 
                    type="button"
                    variant="outline" 
                    size="sm" 
                    className="h-8 px-2"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={isAnalyzing}
                  >
                    Camera
                  </Button>
                  <Button 
                    type="button"
                    variant="outline" 
                    size="sm" 
                    className="h-8 px-2"
                    onClick={() => galleryInputRef.current?.click()}
                    disabled={isAnalyzing}
                  >
                    Gallery
                  </Button>
                </div>
                <div className="mt-2">
                  {isAnalyzing ? (
                    <LoaderCircle className="h-5 w-5 text-civic-saffron mx-auto mb-1 animate-spin" />
                  ) : (
                    <Camera className="h-5 w-5 text-civic-saffron mx-auto mb-1" />
                  )}
                  <p className="text-xs text-muted-foreground">
                    {isAnalyzing ? "Analyzing..." : formData.media ? formData.media.name : 'Use Camera or Gallery to upload media'}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <Label>{t('complaint.audio')} ({t('action.optional')})</Label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="audio/*"
                  id="audio-upload"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null
                    setFormData(prev => ({ ...prev, audio: file }))
                  }}
                />
                <label htmlFor="audio-upload">
                  <Button variant="outline" size="sm" className="h-8 px-2">Upload</Button>
                </label>
                {!isRecording ? (
                  <Button variant="outline" size="sm" className="h-8 px-2" onClick={handleStartRecording}>Record</Button>
                ) : (
                  <Button variant="destructive" size="sm" className="h-8 px-2" onClick={handleStopRecording}>Stop</Button>
                )}
                {formData.audio && (
                  <audio controls className="h-8">
                    <source src={URL.createObjectURL(formData.audio)} />
                  </audio>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="description">{t('complaint.description')} *</Label>
              <Textarea
                id="description"
                placeholder={isAnalyzing ? "AI is analyzing the image..." : "Describe the issue or let AI do it for you."}
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
                disabled={isAnalyzing}
              />
            </div>

            <Button 
              size="xl" 
              className="w-full"
              onClick={handleSubmit}
              disabled={isSubmitting || isAnalyzing}
            >
              {isSubmitting ? <LoaderCircle className="animate-spin mr-2" /> : <Send className="h-5 w-5 mr-2" />}
              {isSubmitting ? t('action.loading') : t('complaint.submit')}
            </Button>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}

export default ComplaintRegistration;

