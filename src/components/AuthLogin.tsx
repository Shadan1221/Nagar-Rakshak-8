// src/components/AuthLogin.tsx
import { useState } from "react"
import { Button } from "./ui/button.tsx"
import { Input } from "./ui/input.tsx"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "./ui/card.tsx"
import { Label } from "./ui/label.tsx"
import { supabase } from "../integrations/supabase/client.ts"
import { ArrowLeft, Eye, EyeOff, User, Lock, Copy } from "lucide-react"
import { useToast } from "../hooks/use-toast.ts"

interface AuthLoginProps {
  onBack: () => void
  onSuccess: (userRole: string) => void
  onNavigateToSignup: () => void
}

const AuthLogin = ({ onBack, onSuccess, onNavigateToSignup }: AuthLoginProps) => {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showDemo, setShowDemo] = useState(false)
  const { toast } = useToast()

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      toast({
        title: "Error",
        description: "Please enter both username and password",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      // Try citizen login first since this is for citizens only
      const { data: citizenRole } = await supabase.rpc('login_citizen', {
        p_username: username,
        p_password: password
      })

      if (citizenRole) {
        toast({
          title: "Login Successful",
          description: "Welcome back!",
        })
        onSuccess(citizenRole)
        return
      }

      // If citizen login fails, show error
      toast({
        title: "Error",
        description: "Invalid username or password",
        variant: "destructive"
      })
    } catch (error) {
      console.error('Error logging in:', error)
      toast({
        title: "Error",
        description: "Failed to login. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin()
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({ title: "Copied to clipboard!" })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto pt-16">
        <Button variant="ghost" onClick={onBack} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Login to Nagar Rakshak</CardTitle>
            <CardDescription>Enter your credentials to continue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="pl-10 pr-12"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? 
                      <EyeOff className="h-4 w-4 text-gray-400" /> : 
                      <Eye className="h-4 w-4 text-gray-400" />
                    }
                  </Button>
                </div>
              </div>
            </div>

            <Button
              onClick={handleLogin}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>

            <div className="text-center pt-4">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Button variant="link" className="p-0 h-auto" onClick={onNavigateToSignup}>
                  Sign Up
                </Button>
              </p>
            </div>
            <div className="text-center">
              <Button variant="link" onClick={() => setShowDemo(!showDemo)}>
                {showDemo ? "Hide" : "Show"} Demo Account
              </Button>
            </div>
            {showDemo && (
              <CardFooter className="flex flex-col items-start space-y-2">
                <h3 className="text-lg font-semibold">Demo Account:</h3>
                <div className="flex items-center justify-between w-full">
                  <span>Username: citizen70156</span>
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard("citizen70156")}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between w-full">
                  <span>Password: lucknow123@L</span>
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard("lucknow123@L")}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AuthLogin