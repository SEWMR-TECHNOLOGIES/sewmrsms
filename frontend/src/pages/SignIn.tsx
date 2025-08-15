import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react"

const SignInPage = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [form, setForm] = useState({ identifier: "", password: "", remember: false })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [id]: type === "checkbox" ? checked : value }))
  }

  const togglePassword = () => setShowPassword(prev => !prev)

  const handleSignIn = async () => {
    if (!form.identifier || !form.password) {
      toast({
        variant: "warning",
        title: "Missing credentials",
        description: "Please enter your email, username, or phone and password.",
        duration: 4000,
      })
      return
    }

    setLoading(true)
    try {
      const res = await fetch("https://api.sewmrsms.co.tz/api/v1/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: form.identifier,
          password: form.password,
        }),
        credentials: "include",
      })

      const data = await res.json()

      if (data?.success) {
        toast({
          variant: "success",
          title: "Signed in successfully",
          description: `Welcome back, ${data.data.first_name || "user"}!`,
          duration: 3500,
        })
        navigate("/dashboard")
      } else {
        toast({
          variant: "destructive",
          title: "Sign in failed",
          description: data?.message ?? "Invalid credentials. Try again.",
          duration: 4500,
        })
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Network error",
        description: "Unable to reach the server. Try again shortly.",
        duration: 4500,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-16 flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors mb-6">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
              <h1 className="text-3xl font-bold text-foreground mb-2">Welcome Back</h1>
              <p className="text-muted-foreground">Sign in to your SEWMR SMS account</p>
            </div>

            <Card className="shadow-lg border-0 bg-card/50 backdrop-blur-sm">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl text-center">Sign In</CardTitle>
                <CardDescription className="text-center">Enter your credentials to access your account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">

                {/* Identifier Field */}
                <div className="space-y-2 relative">
                  <Label htmlFor="identifier">Email, Username or Phone</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="identifier"
                      placeholder="Enter email, username or phone"
                      className="pl-10"
                      value={form.identifier}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2 relative">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      className="pl-10 pr-10"
                      value={form.password}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      onClick={togglePassword}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2 text-sm">
                    <input
                      id="remember"
                      type="checkbox"
                      checked={form.remember}
                      onChange={handleChange}
                      className="rounded border-border"
                    />
                    <span>Remember me</span>
                  </label>
                  <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>

                <Button className="w-full" size="lg" onClick={handleSignIn} disabled={loading}>
                  {loading ? "Signing In..." : "Sign In"}
                </Button>

                <Separator />
                <div className="text-center text-sm">
                  Don't have an account?{" "}
                  <Link to="/signup" className="text-primary hover:underline font-medium">
                    Sign up for free
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default SignInPage
