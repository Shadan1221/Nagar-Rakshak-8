import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLanguage, Language } from "@/contexts/LanguageContext"
import { Globe } from "lucide-react"

interface LanguageSelectorProps {
  className?: string
  showIcon?: boolean
}

const LanguageSelector = ({ className = "", showIcon = true }: LanguageSelectorProps) => {
  const { language, setLanguage } = useLanguage()

  const languages: { code: Language; name: string; native: string }[] = [
    { code: 'en', name: 'English', native: 'English' },
    { code: 'hi', name: 'Hindi', native: 'हिंदी' },
    { code: 'bn', name: 'Bengali', native: 'বাংলা' },
    { code: 'te', name: 'Telugu', native: 'తెలుగు' },
    { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
    { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
    { code: 'mr', name: 'Marathi', native: 'मराठी' },
    { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
    { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
    { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  ]

  const currentLanguage = languages.find(lang => lang.code === language)

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showIcon && <Globe className="h-4 w-4 text-muted-foreground" />}
      <Select value={language} onValueChange={(value: Language) => setLanguage(value)}>
        <SelectTrigger className={`w-32 bg-white/90 border-0 ${showIcon ? 'pl-8' : ''}`}>
          <SelectValue>
            <span className="text-sm font-medium">
              {currentLanguage?.native || currentLanguage?.name}
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {languages.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              <div className="flex items-center justify-between w-full">
                <span className="font-medium">{lang.native}</span>
                <span className="text-xs text-muted-foreground ml-2">{lang.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export default LanguageSelector

