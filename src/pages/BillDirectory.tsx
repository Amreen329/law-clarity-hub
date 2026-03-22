import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Search, FileText, Calendar, Tag, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface Bill {
  id: string;
  title: string;
  description: string;
  category: string;
  year: number;
  status: string;
  full_text: string;
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.4 },
  }),
};

const BillDirectory = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBills = async () => {
      const { data, error } = await supabase
        .from("bills")
        .select("*")
        .order("year", { ascending: false });

      if (error) {
        console.error("Error fetching bills:", error);
      } else {
        setBills(data || []);
      }
      setLoading(false);
    };
    fetchBills();
  }, []);

  const categories = ["All", ...Array.from(new Set(bills.map((b) => b.category)))];

  const filteredBills = bills.filter((b) => {
    const matchesSearch =
      !searchQuery ||
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || b.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAnalyze = (bill: Bill) => {
    navigate("/dashboard", { state: { bill } });
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">
            Bill Directory
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Browse major Indian laws, bills, and policies. Click any bill to get a detailed AI-powered summary.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="mb-8 space-y-4">
          <div className="relative mx-auto max-w-xl">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search bills by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Bills Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredBills.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            No bills found matching your search.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredBills.map((bill, i) => (
              <motion.div
                key={bill.id}
                className="group flex flex-col rounded-xl border border-border bg-card p-6 shadow-soft transition-all hover:shadow-card"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary/15">
                    <FileText className="h-5 w-5 text-secondary" />
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${
                      bill.status === "Enacted"
                        ? "bg-accent/15 text-accent"
                        : "bg-secondary/15 text-secondary"
                    }`}
                  >
                    {bill.status}
                  </span>
                </div>

                <h3 className="mt-4 font-display text-base font-semibold leading-snug text-foreground">
                  {bill.title}
                </h3>
                <p className="mt-2 flex-1 text-xs leading-relaxed text-muted-foreground line-clamp-3">
                  {bill.description}
                </p>

                <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {bill.year}
                  </span>
                  <span className="flex items-center gap-1">
                    <Tag className="h-3 w-3" /> {bill.category}
                  </span>
                </div>

                <Button
                  size="sm"
                  className="mt-4 w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => handleAnalyze(bill)}
                >
                  Summarize This Bill <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default BillDirectory;
