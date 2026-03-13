import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Smartphone, Shield, Users, Phone, UserPlus, Settings } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"
import LanguageSelector from "./LanguageSelector"
import heroImage from "@/assets/nagar-rakshak-hero.jpg"

interface SplashScreenProps {
  onNavigate: (screen: string) => void
}

const SplashScreen = ({ onNavigate }: SplashScreenProps) => {
  const { t } = useLanguage()
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-civic-orange-light via-background to-civic-green-light">
      {/* Hero Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/90" />
        <img 
          src={heroImage} 
          alt="Nagar Rakshak - Digital Civic Engagement" 
          className="w-full h-64 md:h-80 object-cover"
        />
        
        {/* Language Selector */}
        <div className="absolute top-4 right-4 z-10">
          <LanguageSelector />
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-8 max-w-md mx-auto">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-civic-saffron to-civic-green p-4 rounded-full shadow-civic">
              <Shield className="h-12 w-12 text-white" />
            </div>
          </div>
          
          <h1 className="text-4xl font-bold bg-gradient-to-r from-civic-saffron to-civic-green bg-clip-text text-transparent mb-2">
            {t('app.title')}
          </h1>
          
          <p className="text-muted-foreground text-lg leading-relaxed mb-6">
            {t('app.subtitle')}
          </p>

          <div className="flex flex-wrap justify-center gap-2 mb-6">
            <Badge variant="outline" className="border-civic-saffron text-civic-saffron">
              <Users className="h-3 w-3 mr-1" />
              {t('app.citizenPowered')}
            </Badge>
            <Badge variant="outline" className="border-civic-green text-civic-green">
              <Smartphone className="h-3 w-3 mr-1" />
              {t('app.mobileFirst')}
            </Badge>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4 mb-8">
          <Card className="border-2 border-civic-saffron/20 hover:border-civic-saffron/40 transition-colors cursor-pointer"
                onClick={() => onNavigate('login')}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="bg-civic-saffron/10 p-3 rounded-full">
                  <Phone className="h-6 w-6 text-civic-saffron" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{t('nav.login')}</h3>
                  <p className="text-sm text-muted-foreground">{t('nav.loginDesc')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-civic-green/20 hover:border-civic-green/40 transition-colors cursor-pointer"
                onClick={() => onNavigate('signup')}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="bg-civic-green/10 p-3 rounded-full">
                  <UserPlus className="h-6 w-6 text-civic-green" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{t('nav.signup')}</h3>
                  <p className="text-sm text-muted-foreground">{t('nav.signupDesc')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-civic-blue/20 hover:border-civic-blue/40 transition-colors cursor-pointer"
                onClick={() => onNavigate('admin')}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="bg-civic-blue/10 p-3 rounded-full">
                  <Settings className="h-6 w-6 text-civic-blue" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{t('nav.admin')}</h3>
                  <p className="text-sm text-muted-foreground">{t('nav.adminDesc')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>{t('app.empoweringCitizens')}</p>
          <p className="mt-2 text-xs">🇮🇳 {t('app.madeForIndia')}</p>
        </div>
      </div>
    </div>
  )
}

export default SplashScreen