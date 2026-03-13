import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const AuthSignup = () => {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState("phone"); // 'phone', 'otp', 'credentials'
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      phone: `+91${phone}`,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Error sending OTP", description: error.message, variant: "destructive" });
    } else {
      setStep("otp");
      toast({ title: "OTP Sent!", description: "Check your phone for the OTP." });
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.verifyOtp({
      phone: `+91${phone}`,
      token: otp,
      type: "sms",
    });
    setLoading(false);
    if (error) {
      toast({ title: "Error verifying OTP", description: error.message, variant: "destructive" });
    } else if (data.session) {
      setStep("credentials");
      toast({ title: "Phone number verified!", description: "Please set a username and password." });
    }
  };

  const handleSetCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      toast({ title: "Username required", description: "Please choose a username.", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const updateRes = await supabase.auth.updateUser({ password });
      if (updateRes.error) {
        throw updateRes.error;
      }

      const { data: user } = await supabase.auth.getUser();
      const userId = user.user?.id;

      // Ensure username is unique
      const { data: existing, error: existingErr } = await supabase
        .from("users")
        .select("id")
        .eq("username", username)
        .maybeSingle();
      if (existingErr && existingErr.code !== "PGRST116") {
        throw existingErr;
      }
      if (existing) {
        throw new Error("Username already taken. Please choose another.");
      }

      const { error: upsertErr } = await supabase
        .from("users")
        .upsert({
          id: userId ?? undefined,
          username,
          phone_number: `+91${phone}`,
          password,
        }, { onConflict: "id" });
      if (upsertErr) {
        throw upsertErr;
      }

      toast({ title: "Signup Successful!", description: "You can now log in with your username and password." });
      navigate("/login");
    } catch (err: any) {
      toast({ title: "Error saving credentials", description: err.message ?? "Unknown error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-md mx-4">
        {step === "phone" && (
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">Nagar Rakshak Signup</CardTitle>
              <CardDescription>Enter your phone number to get an OTP</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="flex items-center">
                  <span className="p-2 border rounded-l-md bg-gray-200 dark:bg-gray-700">+91</span>
                  <Input type="tel" placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-l-none" required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>{loading ? "Sending OTP..." : "Send OTP"}</Button>
              </form>
            </CardContent>
          </>
        )}

        {step === "otp" && (
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">Verify OTP</CardTitle>
              <CardDescription>An OTP has been sent to +91 {phone}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="flex justify-center">
                    <InputOTP maxLength={6} value={otp} onChange={(value) => setOtp(value)}>
                        <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                        </InputOTPGroup>
                    </InputOTP>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>{loading ? "Verifying..." : "Verify OTP"}</Button>
              </form>
            </CardContent>
          </>
        )}

        {step === "credentials" && (
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">Set Username & Password</CardTitle>
              <CardDescription>Create your login credentials.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSetCredentials} className="space-y-4">
                <Input type="text" placeholder="Choose a username" value={username} onChange={(e) => setUsername(e.target.value)} required />
                <Input type="password" placeholder="Enter Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <Input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                <Button type="submit" className="w-full" disabled={loading}>{loading ? "Saving..." : "Save & Finish"}</Button>
              </form>
            </CardContent>
          </>
        )}

        <CardContent>
            <p className="mt-4 text-center text-sm">
                Already have an account?{" "}
                <Button variant="link" onClick={() => navigate("/login")} className="p-0">
                Login
                </Button>
            </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthSignup;

