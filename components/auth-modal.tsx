"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Mail, Eye, EyeOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createBrowserSupabase } from "@/utils/supabase/client"

const supabase = createBrowserSupabase()

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  mode?: "login" | "signup"
}

export function AuthModal({ isOpen, onClose, mode = "login" }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState(mode)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const resetForm = () => {
    setEmail("")
    setPassword("")
    setShowPassword(false)
    setIsLoading(false)
  }

  useEffect(() => {
    setActiveTab(mode)
  }, [mode])

  useEffect(() => {
    if (!isOpen) {
      resetForm()
      setActiveTab(mode)
    }
  }, [isOpen, mode])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      })
      
      if (error) {
        toast({
          title: "Sign In Failed",
          description: error.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Welcome back!",
          description: "You've been signed in successfully.",
        })
        resetForm()
        onClose()
      }
    } catch (error) {
      toast({
        title: "Sign In Failed",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    }
    
    setIsLoading(false)
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        },
      })
      
      if (error) {
        toast({
          title: "Sign Up Failed",
          description: error.message,
          variant: "destructive",
        })
      } else {
        if (data.user && data.session) {
          toast({
            title: "Account created!",
            description: "Welcome to CARMA! You're now signed in.",
          })
        } else {
          toast({
            title: "Account created!",
            description: "Please check your email to confirm your account.",
          })
        }
        resetForm()
        onClose()
      }
    } catch (error) {
      toast({
        title: "Sign Up Failed", 
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    }
    
    setIsLoading(false)
  }

  const handleSocialAuth = async (provider: "google" | "azure") => {
    try {
      await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
    } catch (error) {
      toast({
        title: `${provider} Authentication`,
        description: "Could not initiate sign-in. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 gap-0 bg-transparent border-0 shadow-none [&>button]:hidden">
        <div className="w-full max-w-md mx-auto">
          <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 shadow-2xl transform transition-all duration-300 hover:scale-[1.02] hover:shadow-3xl">
            {/* Header with tabs and close button */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex bg-black/30 backdrop-blur-sm rounded-full p-1 border border-white/10">
                <button
                  onClick={() => setActiveTab("signup")}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
                    activeTab === "signup"
                      ? "bg-white/20 backdrop-blur-sm text-white border border-white/20 shadow-lg"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                >
                  Sign up
                </button>
                <button
                  onClick={() => setActiveTab("login")}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
                    activeTab === "login"
                      ? "bg-white/20 backdrop-blur-sm text-white border border-white/20 shadow-lg"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                >
                  Sign in
                </button>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/10 hover:bg-black/40 transition-all duration-200 hover:scale-110 hover:rotate-90"
              >
                <X className="w-5 h-5 text-white/80" />
              </button>
            </div>

            <h1 className="text-3xl font-normal text-white mb-8 transition-all duration-300">
              {activeTab === "signup" ? "Create an account" : "Welcome back"}
            </h1>

            <div className="relative overflow-hidden">
              <div
                className={`transition-all duration-500 ease-in-out transform ${
                  activeTab === "signup" ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0 absolute inset-0"
                }`}
              >
                {/* Sign Up Form */}
                <form onSubmit={handleSignup} className="space-y-4">
                  {/* Email field */}
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40 transition-colors duration-200" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl h-14 text-white placeholder:text-white/40 focus:border-white/30 focus:ring-0 pl-12 text-base transition-all duration-200 hover:bg-black/30 focus:bg-black/30"
                      placeholder="Enter your email"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  {/* Password field */}
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl h-14 text-white placeholder:text-white/40 focus:border-white/30 focus:ring-0 pr-12 text-base transition-all duration-200 hover:bg-black/30 focus:bg-black/30"
                      placeholder="Enter your password"
                      required
                      minLength={6}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors duration-200"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* Create account button */}
                  <Button
                    type="submit"
                    className="w-full bg-white/20 backdrop-blur-sm border border-white/20 hover:bg-white/30 text-white font-medium rounded-2xl h-14 mt-8 text-base transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating account..." : "Create an account"}
                  </Button>
                </form>
              </div>

              <div
                className={`transition-all duration-500 ease-in-out transform ${
                  activeTab === "login" ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 absolute inset-0"
                }`}
              >
                <form onSubmit={handleLogin} className="space-y-4">
                  {/* Email field */}
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40 transition-colors duration-200" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl h-14 text-white placeholder:text-white/40 focus:border-white/30 focus:ring-0 pl-12 text-base transition-all duration-200 hover:bg-black/30 focus:bg-black/30"
                      placeholder="Enter your email"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  {/* Password field */}
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl h-14 text-white placeholder:text-white/40 focus:border-white/30 focus:ring-0 pr-12 text-base transition-all duration-200 hover:bg-black/30 focus:bg-black/30"
                      placeholder="Enter your password"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors duration-200"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* Sign in button */}
                  <Button
                    type="submit"
                    className="w-full bg-white/20 backdrop-blur-sm border border-white/20 hover:bg-white/30 text-white font-medium rounded-2xl h-14 mt-8 text-base transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing in..." : "Sign in"}
                  </Button>
                </form>
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center my-8">
              <div className="flex-1 h-px bg-white/10"></div>
              <span className="px-4 text-white/40 text-sm font-medium">
                {activeTab === "signup" ? "OR SIGN IN WITH" : "OR CONTINUE WITH"}
              </span>
              <div className="flex-1 h-px bg-white/10"></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleSocialAuth("google")}
                className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl h-14 flex items-center justify-center hover:bg-black/30 transition-all duration-300 transform hover:scale-105 hover:shadow-lg active:scale-95"
                disabled={isLoading}
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </button>
              <button
                onClick={() => handleSocialAuth("azure")}
                className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl h-14 flex items-center justify-center hover:bg-black/30 transition-all duration-300 transform hover:scale-105 hover:shadow-lg active:scale-95"
                disabled={isLoading}
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path fill="#00BCF2" d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"/>
                </svg>
              </button>
            </div>

            <p className="text-center text-white/40 text-sm mt-8">
              {activeTab === "signup"
                ? "By creating an account, you agree to our Terms & Service"
                : "By signing in, you agree to our Terms & Service"}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
