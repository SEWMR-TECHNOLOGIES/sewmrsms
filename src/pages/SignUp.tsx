import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Mail, Lock, User, Phone, ChevronLeft, ChevronRight, Eye, EyeOff, Check, ArrowLeft } from "lucide-react"
import { useMeta } from "@/hooks/useMeta"
import { motion, AnimatePresence } from "framer-motion"

const STEPS = [
  { id: 1, label: "Personal", icon: User },
  { id: 2, label: "Account", icon: Mail },
  { id: 3, label: "Security", icon: Lock },
]

const SignUpPage = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [step, setStep] = useState(1)

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
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [id]: type === "checkbox" ? checked : value }))
  }

  const canProceed = () => {
    if (step === 1) return form.firstName.trim() && form.lastName.trim()
    if (step === 2) return form.username.trim() && form.email.trim() && form.phone.trim()
    if (step === 3) return form.password && form.confirmPassword && form.agree
    return false
  }

  const nextStep = () => {
    if (step === 1 && (!form.firstName.trim() || !form.lastName.trim())) {
      toast({ variant: "destructive", title: "Required", description: "Please enter your first and last name." })
      return
    }
    if (step === 2) {
      if (!form.username.trim()) { toast({ variant: "destructive", title: "Required", description: "Please choose a username." }); return }
      if (!form.email.trim()) { toast({ variant: "destructive", title: "Required", description: "Please enter your email." }); return }
      if (!form.phone.trim()) { toast({ variant: "destructive", title: "Required", description: "Please enter your phone number." }); return }
    }
    if (step < 3) setStep(step + 1)
  }

  const prevStep = () => { if (step > 1) setStep(step - 1) }

  const handleSignUp = async () => {
    if (!form.agree) {
      toast({ variant: "warning", title: "Agree to continue", description: "Please accept the terms and privacy policy.", duration: 4000 })
      return
    }
    if (form.password !== form.confirmPassword) {
      toast({ variant: "destructive", title: "Password mismatch", description: "Passwords do not match." })
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
        toast({ variant: "success", title: "Account created", description: data.message ?? "Welcome to SEWMR SMS", duration: 3500 })
        navigate("/signin")
      } else {
        toast({ variant: "destructive", title: "Signup failed", description: data?.message ?? "Check your details and try again.", duration: 5000 })
      }
    } catch {
      toast({ variant: "destructive", title: "Network error", description: "Could not reach the server. Try again shortly.", duration: 4500 })
    } finally {
      setLoading(false)
    }
  }

  useMeta({ title: "Sign Up", description: "Create a SEWMR SMS account to start sending and managing your SMS campaigns." })

  const slideVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction < 0 ? 80 : -80, opacity: 0 }),
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-16 flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/5">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-lg mx-auto">
            {/* Back Link */}
            <div className="text-center mb-6">
              <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors text-sm">
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back to Home
              </Link>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-2 mb-8">
              {STEPS.map((s, i) => {
                const Icon = s.icon
                const isActive = step === s.id
                const isDone = step > s.id
                return (
                  <div key={s.id} className="flex items-center gap-2">
                    <button
                      onClick={() => { if (isDone) setStep(s.id) }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                          : isDone
                          ? "bg-primary/10 text-primary cursor-pointer hover:bg-primary/20"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                      <span className="hidden sm:inline">{s.label}</span>
                    </button>
                    {i < STEPS.length - 1 && (
                      <div className={`w-8 h-0.5 rounded-full transition-colors duration-300 ${step > s.id ? "bg-primary" : "bg-border"}`} />
                    )}
                  </div>
                )
              })}
            </div>

            <Card className="shadow-xl border-0 bg-card/80 backdrop-blur-sm overflow-hidden">
              <CardContent className="p-8">
                {/* Title */}
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold text-foreground">
                    {step === 1 && "What's your name?"}
                    {step === 2 && "Set up your account"}
                    {step === 3 && "Secure your account"}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    {step === 1 && "Let's start with the basics"}
                    {step === 2 && "Choose your username and contact info"}
                    {step === 3 && "Create a strong password to protect your account"}
                  </p>
                </div>

                {/* Animated Step Content */}
                <AnimatePresence mode="wait" custom={step}>
                  <motion.div
                    key={step}
                    custom={step}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                  >
                    {step === 1 && (
                      <div className="space-y-5">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input id="firstName" placeholder="Enter your first name" className="pl-10 h-12" value={form.firstName} onChange={handleChange} autoFocus />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input id="lastName" placeholder="Enter your last name" className="pl-10 h-12" value={form.lastName} onChange={handleChange} />
                          </div>
                        </div>
                      </div>
                    )}

                    {step === 2 && (
                      <div className="space-y-5">
                        <div className="space-y-2">
                          <Label htmlFor="username">Username</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input id="username" placeholder="Choose a username" className="pl-10 h-12" value={form.username} onChange={handleChange} autoFocus />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input id="email" type="email" placeholder="you@example.com" className="pl-10 h-12" value={form.email} onChange={handleChange} />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input id="phone" type="tel" placeholder="255XXXXXXXXX" className="pl-10 h-12" value={form.phone} onChange={handleChange} />
                          </div>
                        </div>
                      </div>
                    )}

                    {step === 3 && (
                      <div className="space-y-5">
                        <div className="space-y-2">
                          <Label htmlFor="password">Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                              id="password"
                              type={showPassword ? "text" : "password"}
                              placeholder="Create a strong password"
                              className="pl-10 pr-10 h-12"
                              value={form.password}
                              onChange={handleChange}
                              autoFocus
                            />
                            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" onClick={() => setShowPassword(p => !p)}>
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">Confirm Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                              id="confirmPassword"
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="Confirm your password"
                              className="pl-10 pr-10 h-12"
                              value={form.confirmPassword}
                              onChange={handleChange}
                            />
                            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" onClick={() => setShowConfirmPassword(p => !p)}>
                              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3 pt-1">
                          <input type="checkbox" id="agree" checked={form.agree} onChange={handleChange} className="rounded border-border mt-0.5" />
                          <span className="text-sm text-muted-foreground leading-tight">
                            I agree to the{" "}
                            <Link to="/terms-of-service" className="text-primary hover:underline">Terms of Service</Link>{" "}
                            and{" "}
                            <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>
                          </span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between mt-8 gap-3">
                  {step > 1 ? (
                    <Button variant="outline" onClick={prevStep} className="h-12 px-6">
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                  ) : (
                    <div />
                  )}

                  {step < 3 ? (
                    <Button onClick={nextStep} disabled={!canProceed()} className="h-12 px-8 ml-auto">
                      Continue <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button onClick={handleSignUp} disabled={loading || !canProceed()} className="h-12 px-8 ml-auto">
                      {loading ? "Creating Account..." : "Create Account"}
                    </Button>
                  )}
                </div>

                {/* Sign in link */}
                <div className="text-center text-sm mt-6 pt-6 border-t border-border">
                  Already have an account? <Link to="/signin" className="text-primary hover:underline font-medium">Sign in</Link>
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
