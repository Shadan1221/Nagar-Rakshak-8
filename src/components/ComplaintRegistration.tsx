import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Camera, MapPin, Send, CheckCircle, LoaderCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { indianStates, getCitiesByState } from "@/data/indianStatesAndCities"
import { useLanguage } from "@/contexts/LanguageContext"
import { createComplaintNotifications } from "../services/notificationService"

interface ComplaintRegistrationProps {
  onBack: () => void
}

type AiAnalysisResult = {
  is_relevant: boolean
  description?: string
  reason?: string
}

const ComplaintRegistration = ({ onBack }: ComplaintRegistrationProps) => {
  const { t, language } = useLanguage()
  const [step, setStep] = useState<'form' | 'success'>('form')
  const [complaintId, setComplaintId] = useState<string>('')
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showManualLocationFields, setShowManualLocationFields] = useState(false);
  const [isLocationAutoFilled, setIsLocationAutoFilled] = useState(false);
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

  const resolveStateName = (candidate: string) => {
    const normalizedCandidate = normalizeLocationToken(candidate)
    const exactMatch = states.find((state) => normalizeLocationToken(state) === normalizedCandidate)
    if (exactMatch) return exactMatch

    return states.find((state) => {
      const normalizedState = normalizeLocationToken(state)
      return normalizedState.includes(normalizedCandidate) || normalizedCandidate.includes(normalizedState)
    }) || ''
  }

  const resolveCityName = (state: string, candidate: string) => {
    if (!state || !candidate) return ''

    const availableCities = getCitiesByState(state)
    const normalizedCandidate = normalizeLocationToken(candidate)
    const exactMatch = availableCities.find((city) => normalizeLocationToken(city) === normalizedCandidate)
    if (exactMatch) return exactMatch

    return availableCities.find((city) => {
      const normalizedCity = normalizeLocationToken(city)
      return normalizedCity.includes(normalizedCandidate) || normalizedCandidate.includes(normalizedCity)
    }) || ''
  }

  useEffect(() => {
    let isMounted = true

    const reverseGeocodeLocation = async (latitude: number, longitude: number) => {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
      )

      if (!response.ok) {
        throw new Error(`Reverse geocoding failed with status ${response.status}`)
      }

      const geocodeResult = await response.json()
      const address = geocodeResult?.address || {}

      const rawState = (address.state || address['state_district'] || '') as string
      const resolvedState = resolveStateName(rawState)
      const rawCity = (address.city || address.town || address.village || address.municipality || address.county || '') as string
      const resolvedCity = resolveCityName(resolvedState, rawCity)
      const district = (address.state_district || address.county || '') as string
      const address1 = [address.house_number, address.road].filter(Boolean).join(', ')
      const address2 = [address.suburb, address.neighbourhood, address.postcode].filter(Boolean).join(', ')

      return {
        resolvedState,
        resolvedCity,
        district,
        address1,
        address2,
      }
    }

    const autoFillLocation = async () => {
      if (!navigator.geolocation) {
        if (!isMounted) return
        setShowManualLocationFields(true)
        setIsLocationAutoFilled(false)
        toast({
          title: "Location not supported",
          description: "Your browser does not support location. Please fill location manually.",
          variant: "destructive"
        })
        return
      }

      setIsGettingLocation(true)

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          if (!isMounted) return

          const { latitude, longitude } = position.coords
          setLocation({ lat: latitude, lng: longitude })

          try {
            const geocoded = await reverseGeocodeLocation(latitude, longitude)
            if (!isMounted) return

            setFormData((prev) => ({
              ...prev,
              state: geocoded.resolvedState || prev.state,
              city: geocoded.resolvedCity || prev.city,
              district: geocoded.district || prev.district,
              address1: geocoded.address1 || prev.address1,
              address2: geocoded.address2 || prev.address2,
              gpsLatitude: latitude,
              gpsLongitude: longitude,
            }))

            const hasRequiredLocation = Boolean(geocoded.resolvedState && geocoded.resolvedCity)
            setIsLocationAutoFilled(hasRequiredLocation)
            setShowManualLocationFields(!hasRequiredLocation)

            toast({
              title: hasRequiredLocation ? "Location auto-filled" : "Complete location manually",
              description: hasRequiredLocation
                ? "State and city were filled from your current location."
                : "We got GPS coordinates but could not map full address. Please fill state and city manually.",
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
            setIsLocationAutoFilled(false)
            setShowManualLocationFields(true)
            toast({
              title: "Could not auto-fill address",
              description: "GPS was captured but address lookup failed. Please fill location manually.",
              variant: "destructive"
            })
          } finally {
            if (isMounted) setIsGettingLocation(false)
          }
        },
        (error) => {
          console.error('Geolocation error:', error)
          if (!isMounted) return

          setIsGettingLocation(false)
          setIsLocationAutoFilled(false)
          setShowManualLocationFields(true)
          toast({
            title: "Location permission needed",
            description: "Please allow location access, or fill location manually below.",
            variant: "destructive"
          })
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      )
    }

    autoFillLocation()

    return () => {
      isMounted = false
    }
  }, [toast])

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
    if (!formData.state || !formData.city) {
        setShowManualLocationFields(true)
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
                <p className="text-2xl font-bold text-civic-green font-mono">{complaintId}</p>
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
                  onClick={() => onBack()}
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
              <div className="rounded-md border border-civic-saffron/20 bg-civic-saffron/5 p-3 text-sm">
                <p className="font-medium text-foreground">Location</p>
                {isGettingLocation ? (
                  <p className="mt-1 text-muted-foreground">Fetching your location automatically...</p>
                ) : isLocationAutoFilled ? (
                  <p className="mt-1 text-civic-green">Auto-filled: {formData.city}, {formData.state}</p>
                ) : (
                  <p className="mt-1 text-muted-foreground">Could not auto-fill full location. Please fill manually below.</p>
                )}
                {location && (
                  <p className="mt-1 text-xs text-muted-foreground">GPS: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}</p>
                )}
                <Button
                  type="button"
                  variant="link"
                  className="h-auto px-0 text-civic-saffron"
                  onClick={() => setShowManualLocationFields((prev) => !prev)}
                >
                  {showManualLocationFields ? 'Hide manual location fields' : 'Edit location manually'}
                </Button>
              </div>

              {showManualLocationFields && (
                <>
                  <div>
                    <Label htmlFor="state">{t('complaint.state')} *</Label>
                    <Select value={formData.state} onValueChange={(value) => setFormData(prev => ({...prev, state: value, city: ''}))}>
                      <SelectTrigger id="state">
                        <SelectValue placeholder="Select your state" />
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
                    <Select value={formData.city} onValueChange={(value) => setFormData(prev => ({...prev, city: value}))}>
                      <SelectTrigger id="city">
                        <SelectValue placeholder={formData.state ? "Select your city" : "Select state first"} />
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
                </>
              )}
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

