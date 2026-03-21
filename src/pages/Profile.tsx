import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Save, Loader2, ArrowLeft, Globe } from "lucide-react";
import type { Language } from "@/lib/analysisTypes";
import { languageLabels } from "@/lib/analysisTypes";
import { toast } from "sonner";
import { motion } from "framer-motion";

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [preferredLang, setPreferredLang] = useState<Language>("en");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        setFullName(data.full_name || "");
        setAvatarUrl(data.avatar_url || "");
      } else {
        setFullName(user.user_metadata?.full_name || "");
      }
      // Load language preference from latest analysis or default
      const { data: analysis } = await supabase
        .from("analyses")
        .select("language")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (analysis?.language) setPreferredLang(analysis.language as Language);
      setFetching(false);
    };
    load();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, avatar_url: avatarUrl || null })
      .eq("id", user.id);
    if (error) {
      toast.error("Failed to save profile");
    } else {
      toast.success("Profile updated!");
    }
    setLoading(false);
  };

  const initials = (fullName || user?.email || "U").slice(0, 2).toUpperCase();

  if (fetching) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center pt-32">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-lg px-4 pt-24 pb-12">
        <Button variant="ghost" size="sm" className="mb-4 gap-2" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-card p-8 shadow-soft"
        >
          <div className="flex flex-col items-center mb-8">
            <Avatar className="h-20 w-20 mb-4">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <h1 className="font-display text-2xl font-bold text-foreground">Profile Settings</h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>

          <div className="space-y-5">
            <div>
              <Label htmlFor="fullName">Display Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
              />
            </div>

            <div>
              <Label htmlFor="avatarUrl">Avatar URL</Label>
              <Input
                id="avatarUrl"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
              />
              <p className="mt-1 text-xs text-muted-foreground">Paste a link to your profile picture</p>
            </div>

            <div>
              <Label className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-accent" /> Preferred Language
              </Label>
              <div className="mt-2 flex rounded-lg border border-border bg-background p-0.5">
                {(["en", "hi", "te"] as Language[]).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setPreferredLang(lang)}
                    className={`flex-1 rounded-md py-2.5 text-sm font-medium transition-all ${
                      preferredLang === lang
                        ? "bg-accent text-accent-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {languageLabels[lang]}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Used as default when analyzing new documents</p>
            </div>

            <Button onClick={handleSave} className="w-full gap-2" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Changes
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
