import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, Mail } from "lucide-react";

export default function VerifyOtp() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  // Redirect if no email in state
  useEffect(() => {
    if (!email) {
      navigate("/login", { replace: true });
    }
  }, [email, navigate]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when complete
    if (newOtp.every((digit) => digit) && newOtp.join("").length === 6) {
      handleVerify(newOtp.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pastedData.length === 6) {
      const newOtp = pastedData.split("");
      setOtp(newOtp);
      handleVerify(pastedData);
    }
  };

  const handleVerify = async (code: string) => {
    if (!email) return;

    setIsLoading(true);
    try {
      const result = await authClient.signIn.emailOtp({
        email: email.trim(),
        otp: code,
      });

      if (result.error) {
        toast.error(result.error.message || "Invalid verification code");
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else {
        toast.success("Welcome to PN8.ai!");
        navigate("/", { replace: true });
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || resendCooldown > 0) return;

    try {
      const result = await authClient.emailOtp.sendVerificationOtp({
        email: email.trim(),
        type: "sign-in",
      });

      if (result.error) {
        toast.error(result.error.message || "Failed to resend code");
      } else {
        toast.success("New verification code sent!");
        setResendCooldown(60);
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch {
      toast.error("Failed to resend code");
    }
  };

  if (!email) return null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Back button */}
        <button
          onClick={() => navigate("/login")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        {/* Title */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Check your email
          </h1>
          <p className="text-muted-foreground">
            Verification code sent to <span className="text-foreground font-medium">{email}</span>
          </p>
        </div>

        {/* OTP Input */}
        <div className="bg-card border border-border rounded-2xl p-8 space-y-6">
          <div className="flex justify-center gap-2" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 text-center text-2xl font-bold bg-background border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                disabled={isLoading}
                autoFocus={index === 0}
              />
            ))}
          </div>

          <Button
            onClick={() => handleVerify(otp.join(""))}
            className="w-full h-12 text-base font-medium"
            disabled={isLoading || otp.some((d) => !d)}
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              "Verify & Sign In"
            )}
          </Button>

          <div className="text-center space-y-1">
            <p className="text-lg" style={{ color: '#dddddd' }}>
              Don't see the email?
            </p>
            <p className="text-sm text-muted-foreground">
              Check your JUNK or SPAM folder or
            </p>
            <p>
              {resendCooldown > 0 ? (
                <span className="text-sm text-foreground">Resend in {resendCooldown}s</span>
              ) : (
                <button
                  onClick={handleResend}
                  className="text-sm text-primary hover:underline font-medium"
                >
                  RESEND CODE
                </button>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
