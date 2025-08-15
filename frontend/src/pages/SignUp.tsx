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
import { Mail, Lock, User, Phone, ArrowLeft, Check } from "lucide-react"

const SignUpPage = () => {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    agree: false,
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [id]: type === "checkbox" ? checked : value }))
  }

  const handleSignUp = async () => {
    if (!form.agree) {
      toast({
        variant: "warning",
        title: "Agree to continue",
        description: "Please accept the terms and privacy policy.",
        duration: 4000,
      })
      return
    }
    setLoading(true)
    try {
      const res = await fetch("https://api.sewmrsms.co.tz/api/v1/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: form.firstName,
          last_name: form.lastName,
          username: form.username,
          email: form.email,
          phone: form.phone,
          password: form.password,
          confirm_password: form.confirmPassword,
        }),
        credentials: "include",
      })

      const data = await res.json()

      if (data?.success) {
        toast({
          variant: "success",
          title: "Account created",
          description: data.message ?? "Welcome to SEWMR SMS",
          duration: 3500,
        })
        navigate("/signin")
      } else {
        const msg =
          data?.message ??
          "We could not create your account. Check your details and try again."
        toast({
          variant: "destructive",
          title: "Signup failed",
          description: msg,
          duration: 5000,
        })
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Network error",
        description: "Could not reach the server. Try again shortly.",
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
              <h1 className="text-3xl font-bold text-foreground mb-2">Get Started</h1>
              <p className="text-muted-foreground">Create your SEWMR SMS account</p>
            </div>

            <Card className="shadow-lg border-0 bg-card/50 backdrop-blur-sm">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl text-center">Sign Up</CardTitle>
                <CardDescription className="text-center">
                  Join thousands of businesses using SEWMR SMS
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input id="firstName" placeholder="First name" className="pl-10" value={form.firstName} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" placeholder="Last name" value={form.lastName} onChange={handleChange} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input id="username" placeholder="Choose a username" className="pl-10" value={form.username} onChange={handleChange} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input id="email" type="email" placeholder="Enter your email" className="pl-10" value={form.email} onChange={handleChange} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input id="phone" type="tel" placeholder="255XXXXXXXXX" className="pl-10" value={form.phone} onChange={handleChange} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input id="password" type="password" placeholder="Create a password" className="pl-10" value={form.password} onChange={handleChange} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input id="confirmPassword" type="password" placeholder="Confirm your password" className="pl-10" value={form.confirmPassword} onChange={handleChange} />
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <input type="checkbox" id="agree" checked={form.agree} onChange={handleChange} className="rounded border-border mt-1" />
                  <span className="text-sm text-muted-foreground">
                    I agree to the{" "}
                    <Link to="/terms-of-service" className="text-primary hover:underline">Terms of Service</Link>{" "}
                    and{" "}
                    <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>
                  </span>
                </div>

                <Button className="w-full" size="lg" onClick={handleSignUp} disabled={loading}>
                  {loading ? "Creating Account..." : "Create Account"}
                </Button>

                <Separator />
                <div className="text-center text-sm">
                  Already have an account? <Link to="/signin" className="text-primary hover:underline font-medium">Sign in</Link>
                </div>

                <div className="mt-6 p-4 bg-primary/10 rounded-lg">
                  <h4 className="font-medium text-foreground mb-2 flex items-center">
                    <Check className="h-4 w-4 text-primary mr-2" />
                    What you get:
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Free sandbox environment</li>
                    <li>• API documentation access</li>
                    <li>• 24/7 support</li>
                    <li>• No setup fees</li>
                  </ul>
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

export default SignUpPage
