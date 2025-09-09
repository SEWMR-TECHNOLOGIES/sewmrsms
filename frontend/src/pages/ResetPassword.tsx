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
import { Lock, Eye, EyeOff, ArrowLeft } from "lucide-react"
import { useMeta } from "@/hooks/useMeta"

const ResetPasswordPage = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState({ newPassword: false, confirmPassword: false })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setForm((prev) => ({ ...prev, [id]: value }))
  }

  const togglePassword = (field: "newPassword" | "confirmPassword") => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }))
  }

  const handleReset = async () => {
    if (!form.newPassword || !form.confirmPassword) {
      toast({
        variant: "warning",
        title: "Missing fields",
        description: "Please enter your new password and confirm it.",
        duration: 4000,
      })
      return
    }
    if (form.newPassword !== form.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Password mismatch",
        description: "Passwords do not match.",
        duration: 4000,
      })
      return
    }

    setLoading(true)
    try {
      const res = await fetch("https://api.sewmrsms.co.tz/api/v1/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          new_password: form.newPassword,
          confirm_password: form.confirmPassword,
        }),
        credentials: "include", 
      })
      const data = await res.json()
      if (data?.success) {
        toast({
          variant: "success",
          title: "Password reset",
          description: data.message || "Your password has been updated.",
          duration: 3500,
        })
        navigate("/signin")
      } else {
        toast({
          variant: "destructive",
          title: "Reset failed",
          description: data?.message || "Could not reset password. Try again.",
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

  useMeta({
    title: "Reset Password",
    description: "Set a new password to securely access your SEWMR SMS account."
  });
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
              <h1 className="text-3xl font-bold text-foreground mb-2">Reset Password</h1>
              <p className="text-muted-foreground">Enter your new password below</p>
            </div>

            <Card className="shadow-lg border-0 bg-card/50 backdrop-blur-sm">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl text-center">New Password</CardTitle>
                <CardDescription className="text-center">Choose a strong password</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">

                {/* New Password Field */}
                <div className="space-y-2 relative">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="newPassword"
                      type={showPassword.newPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      className="pl-10 pr-10"
                      value={form.newPassword}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      onClick={() => togglePassword("newPassword")}
                    >
                      {showPassword.newPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-2 relative">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="confirmPassword"
                      type={showPassword.confirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      className="pl-10 pr-10"
                      value={form.confirmPassword}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      onClick={() => togglePassword("confirmPassword")}
                    >
                      {showPassword.confirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button className="w-full" size="lg" onClick={handleReset} disabled={loading}>
                  {loading ? "Resetting..." : "Reset Password"}
                </Button>

                <Separator />
                <div className="text-center text-sm">
                  Remembered your password?{" "}
                  <Link to="/signin" className="text-primary hover:underline font-medium">
                    Sign in
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

export default ResetPasswordPage
