// src/components/AdminLogin.tsx
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Button } from "./ui/button"
import { Shield, LogIn, Copy } from "lucide-react"

interface AdminLoginProps {
  onBack: () => void
  onSuccess: () => void
}

const AdminLogin = ({ onBack, onSuccess }: AdminLoginProps) => {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showDemo, setShowDemo] = useState(false)

  const handleLogin = async () => {
    setError("")
    setLoading(true)
    try {
      const isValid = username === "AdminCP" && password === "password123"
      await new Promise((r) => setTimeout(r, 400))
      if (!isValid) {
        setError("Invalid credentials")
        return
      }
      localStorage.setItem("nr_admin_auth", "true")
      onSuccess()
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // You can add a toast notification here if you have a toast system
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-civic-blue/10 to-background">
      <div className="bg-white shadow-sm border-b border-civic-blue/20">
        <div className="flex items-center p-4 max-w-md mx-auto">
          <Button variant="ghost" size="icon" onClick={onBack} className="mr-3">
            <LogIn className="h-5 w-5 rotate-180" />
          </Button>
          <h1 className="text-xl font-semibold">Admin Login</h1>
        </div>
      </div>

      <div className="p-6 max-w-md mx-auto">
        <Card className="border-civic-blue/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-civic-blue" />
              Secure Access
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter username" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button className="w-full bg-civic-blue hover:bg-civic-blue/90" onClick={handleLogin} disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
            <div className="text-center">
              <Button variant="link" onClick={() => setShowDemo(!showDemo)}>
                {showDemo ? "Hide" : "Show"} Demo Account
              </Button>
            </div>
            {showDemo && (
              <div className="absolute top-4 right-4">
                <Card className="w-64">
                  <CardHeader>
                    <CardTitle>Demo Account</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Username: AdminCP</span>
                      <Button variant="ghost" size="icon" onClick={() => copyToClipboard("AdminCP")}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Password: password123</span>
                      <Button variant="ghost" size="icon" onClick={() => copyToClipboard("password123")}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AdminLogin