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
import { Mail, ArrowLeft } from "lucide-react"
import { useMeta } from "@/hooks/useMeta"

const RequestPasswordResetPage = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [identifier, setIdentifier] = useState("")
  const [loading, setLoading] = useState(false)

  const handleRequest = async () => {
    if (!identifier.trim()) {
      toast({
        variant: "warning",
        title: "Missing identifier",
        description: "Please enter your email, username, or phone.",
        duration: 4000,
      })
      return
    }

    setLoading(true)
    try {
      const res = await fetch("https://api.sewmrsms.co.tz/api/v1/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      })
      const data = await res.json()
      toast({
        variant: data?.success ? "success" : "destructive",
        title: data?.success ? "Request Sent" : "Request Failed",
        description: data?.message || "Please try again.",
        duration: 4500,
      })
      if (data?.success) {
        // Optionally redirect to a "check your email" page
        setIdentifier("")
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Network error",
        description: "Could not reach server. Try again shortly.",
        duration: 4500,
      })
    } finally {
      setLoading(false)
    }
  }
  useMeta({
    title: "Forgot Password",
    description: "Request a password reset link to regain access to your SEWMR SMS account."
  });
  
  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-16 flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <Link to="/signin" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors mb-6">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Sign In
              </Link>
              <h1 className="text-3xl font-bold text-foreground mb-2">Reset Password</h1>
              <p className="text-muted-foreground">Enter your email, username, or phone to receive a reset link.</p>
            </div>

            <Card className="shadow-lg border-0 bg-card/50 backdrop-blur-sm">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl text-center">Request Reset</CardTitle>
                <CardDescription className="text-center">
                  We'll send a password reset link to your email
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="identifier">Email, Username or Phone</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="identifier"
                      placeholder="Enter email, username or phone"
                      className="pl-10"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                    />
                  </div>
                </div>

                <Button className="w-full" size="lg" onClick={handleRequest} disabled={loading}>
                  {loading ? "Sending..." : "Send Reset Link"}
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

export default RequestPasswordResetPage
