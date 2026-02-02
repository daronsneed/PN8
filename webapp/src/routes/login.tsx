import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Mail, Sparkles, Clapperboard, ListChecks, Save, UserPlus, LogIn } from "lucide-react";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

export default function Login() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState<"register" | "login" | null>(null);
  const navigate = useNavigate();

  const handleRegister = async () => {
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    setIsLoading("register");
    try {
      // First check if user already exists and is verified
      const checkResponse = await fetch(`${backendUrl}/api/auto-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim() }),
      });

      const checkResult = await checkResponse.json();

      if (checkResult.data?.canAutoLogin) {
        // User already verified - show message to login instead
        toast.info("This email has been previously verified. Please click LOGIN instead.");
        setIsLoading(null);
        return;
      }

      // Send OTP for new user registration
      const result = await authClient.emailOtp.sendVerificationOtp({
        email: email.trim(),
        type: "sign-in",
      });

      if (result.error) {
        toast.error(result.error.message || "Failed to send verification code");
      } else {
        toast.success("Verification code sent to your email!");
        navigate("/verify-otp", { state: { email: email.trim() } });
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(null);
    }
  };

  const handleLogin = async () => {
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    setIsLoading("login");
    try {
      // Check if user has previously verified - auto-login if so
      const autoLoginResponse = await fetch(`${backendUrl}/api/auto-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim() }),
      });

      const autoLoginResult = await autoLoginResponse.json();

      if (autoLoginResult.data?.canAutoLogin && autoLoginResult.data?.otp) {
        // Auto-verify with the returned OTP
        const result = await authClient.signIn.emailOtp({
          email: email.trim(),
          otp: autoLoginResult.data.otp,
        });

        if (result.error) {
          toast.error("Auto-login failed. Please try registering again.");
        } else {
          toast.success("Welcome back!");
          window.location.href = "/";
        }
        return;
      }

      // User not found or not verified
      toast.error("No account found with this email. Please register first.");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Left side - Hero/Marketing */}
      <div className="flex-1 flex flex-col justify-center p-8 lg:p-16 bg-gradient-to-br from-background via-background to-primary/5">
        <div className="max-w-lg mx-auto lg:mx-0">
          <h1 className="text-5xl lg:text-6xl font-bold tracking-tight mb-4" style={{ color: '#bdf005' }}>
            PN8.ai
          </h1>
          <p className="text-xl lg:text-2xl text-foreground mb-6">
            The Ultimate AI Image Prompt Builder
          </p>
          <p className="text-muted-foreground mb-8 text-lg">
            Getting AI to see what you already see in your head has never been easier! Let <span className="font-bold text-foreground">PN8</span> help you translate your imagination into functional 'text-to-image' prompts.
          </p>

          {/* Feature highlights */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clapperboard className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-bold text-foreground">LIGHTS - CAMERA - ACTION!</p>
                <p className="text-sm text-muted-foreground">Set all the technical specs so your images look perfect</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <ListChecks className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-bold text-foreground">CLEAR & CONCISE PROCESS</p>
                <p className="text-sm text-muted-foreground">PN8 will help make sure all your bases are covered</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Save className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-bold text-foreground">SAVE & SYNC YOUR PROMPTS</p>
                <p className="text-sm text-muted-foreground">Access your saved prompts for future projects</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-16 bg-card/50">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              100% Free Tool
            </div>
            <h2 className="text-2xl font-bold text-foreground">
              Get Started
            </h2>
            <p className="text-muted-foreground">
              Enter your email to access the <span className="font-bold text-foreground">FREE</span> prompt builder
            </p>
          </div>

          {/* Login Form */}
          <div className="bg-card border border-border rounded-2xl p-8 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 bg-background"
                    autoComplete="email"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex justify-center gap-12">
                <button
                  type="button"
                  onClick={handleRegister}
                  disabled={isLoading !== null}
                  className="text-lg font-medium text-primary hover:text-white transition-colors disabled:opacity-50"
                >
                  {isLoading === "register" ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                  ) : (
                    "REGISTER"
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleLogin}
                  disabled={isLoading !== null}
                  className="text-lg font-medium text-primary hover:text-white transition-colors disabled:opacity-50"
                >
                  {isLoading === "login" ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                  ) : (
                    "LOGIN"
                  )}
                </button>
              </div>
            </form>

            <p className="text-xs text-center text-muted-foreground">
              We'll send you a verification code. No password needed.
            </p>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            By signing in, you agree to receive occasional updates about PN8.ai
          </p>
        </div>
      </div>
    </div>
  );
}
