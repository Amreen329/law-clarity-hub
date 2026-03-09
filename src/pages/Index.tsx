import Navbar from "@/components/Navbar";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileText, MessageSquare, Globe, Shield, Zap, Users, ArrowRight, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const features = [
  { icon: FileText, title: "Document Analysis", desc: "Upload any bill, policy, or legal document and get instant plain-language summaries." },
  { icon: MessageSquare, title: "Ask Questions", desc: "Chat with your document. Ask anything and get clear, jargon-free answers." },
  { icon: Globe, title: "Multi-Language", desc: "Get explanations in English, Hindi, or Telugu — making laws accessible to all." },
  { icon: Shield, title: "Citizen Impact", desc: "Understand exactly how a law affects you, your business, and your community." },
  { icon: Zap, title: "Instant Insights", desc: "Key highlights, important clauses, and bullet-point explanations in seconds." },
  { icon: Users, title: "For Everyone", desc: "Designed for ordinary citizens — no legal background required." },
];

const steps = [
  { num: "01", title: "Upload Document", desc: "Drop a PDF, TXT, or DOCX file of any government bill or policy." },
  { num: "02", title: "AI Analyzes", desc: "Our AI reads, chunks, and summarizes the entire document intelligently." },
  { num: "03", title: "Get Clarity", desc: "Read plain-language summaries, ask questions, and understand the impact." },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden pt-28 pb-20 md:pt-36 md:pb-28">
        <div className="absolute inset-0 bg-gradient-to-b from-civic-cream to-background" />
        <div className="absolute top-20 right-0 h-96 w-96 rounded-full bg-civic-amber/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-civic-teal/10 blur-3xl" />
        
        <div className="container relative mx-auto px-4 text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <span className="inline-flex items-center gap-2 rounded-full border border-civic-amber/30 bg-civic-amber/10 px-4 py-1.5 text-sm font-medium text-civic-navy">
              <Zap className="h-3.5 w-3.5" />
              AI-Powered Civic Tool
            </span>
          </motion.div>

          <motion.h1
            className="mx-auto mt-6 max-w-4xl font-display text-4xl font-bold leading-tight text-foreground md:text-6xl md:leading-tight"
            initial="hidden" animate="visible" variants={fadeUp} custom={1}
          >
            Understand Any Law in{" "}
            <span className="text-gradient-hero">Plain Language</span>
          </motion.h1>

          <motion.p
            className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground md:text-xl"
            initial="hidden" animate="visible" variants={fadeUp} custom={2}
          >
            Upload government bills and policies. Get simplified summaries, key insights,
            and answers to your questions — in seconds.
          </motion.p>

          <motion.div
            className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
            initial="hidden" animate="visible" variants={fadeUp} custom={3}
          >
            <Link to="/dashboard">
              <Button size="lg" className="gap-2 bg-primary text-primary-foreground hover:bg-civic-navy-light">
                Start Analyzing <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="outline" className="border-border text-foreground hover:bg-muted">
                See Features
              </Button>
            </a>
          </motion.div>

          <motion.div
            className="mx-auto mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground"
            initial="hidden" animate="visible" variants={fadeUp} custom={4}
          >
            {["100k+ token documents", "Multi-language support", "Free to use"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-civic-teal" /> {t}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              Everything You Need to Understand Laws
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Powerful AI tools designed to make legal documents accessible for every citizen.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                className="group rounded-xl border border-border bg-card p-6 shadow-soft transition-all hover:shadow-card"
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-civic-amber/15 text-civic-amber transition-colors group-hover:bg-civic-amber group-hover:text-primary-foreground">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-civic-cream py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              How It Works
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Three simple steps to understand any legislation.
            </p>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {steps.map((s, i) => (
              <motion.div
                key={s.num}
                className="text-center"
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary font-display text-2xl font-bold text-primary-foreground">
                  {s.num}
                </div>
                <h3 className="mt-5 font-display text-xl font-semibold text-foreground">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 text-center">
          <div className="mx-auto max-w-2xl rounded-2xl bg-gradient-hero p-10 md:p-14">
            <h2 className="font-display text-3xl font-bold text-primary-foreground md:text-4xl">
              Ready to Understand Your Rights?
            </h2>
            <p className="mt-4 text-primary-foreground/80">
              Upload a document now and get clarity in minutes.
            </p>
            <Link to="/dashboard">
              <Button size="lg" className="mt-6 bg-secondary text-secondary-foreground hover:bg-civic-amber-light">
                Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} LegisAI — Making Laws Understandable for Everyone
        </div>
      </footer>
    </div>
  );
};

export default Index;
