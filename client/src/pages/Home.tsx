import { motion, useInView } from "framer-motion";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Leaf,
  Zap,
  TrendingUp,
  Shield,
  ArrowRight,
  Users,
  Sprout,
  Camera,
  Menu,
  X,
  ChevronRight,
  Star,
} from "lucide-react";
import { useLocation } from "wouter";
import { getLoginUrl, getSignupUrl } from "@/const";
import { useState, useEffect, useRef } from "react";

const Counter = ({ end, duration = 2 }: { end: number; duration?: number }) => {
  const [count, setCount] = useState(0);
  const nodeRef = useRef(null);
  const inView = useInView(nodeRef, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const increment = end / (duration * 60);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [end, duration, inView]);

  return <span ref={nodeRef}>{count.toLocaleString()}</span>;
};

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [stats, setStats] = useState({
    farmersHelped: 0,
    scansPerformed: 0,
    diseasesDetected: 0,
  });

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || "";
    fetch(`${apiUrl}/api/stats`)
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch(() => {});
  }, []);

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.pushState(null, "", `#${targetId}`);
    }
    setMobileMenuOpen(false);
  };

  const handleGetStarted = () => {
    if (isAuthenticated) setLocation("/dashboard");
    else setLocation(getSignupUrl());
  };

  const handleQuickScan = () => setLocation("/scanner");

  const testimonials = [
    {
      name: "Grace Akello",
      location: "Uganda",
      text: "CropGuard saved my maize farm! I detected Northern Leaf Blight early and treated it before it spread.",
      rating: 5,
    },
    {
      name: "John Mwangi",
      location: "Kenya",
      text: "The AI recommendations are spot on. My tomato yield increased by 40% after following the fertilizer advice.",
      rating: 5,
    },
    {
      name: "Amina Diallo",
      location: "Tanzania",
      text: "As a smallholder farmer, this app gives me confidence. I can identify cassava diseases instantly.",
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-accent/5 overflow-x-hidden">
      {/* Floating Quick Scan Button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        onClick={handleQuickScan}
        className="fixed bottom-6 right-6 z-50 bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-full shadow-xl flex items-center gap-2 group transition-all duration-300 ease-in-out"
      >
        <Camera className="w-5 h-5" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap">
          Quick Scan
        </span>
      </motion.button>

      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <motion.div
              initial={{ rotate: -10 }}
              animate={{ rotate: 0 }}
              className="bg-emerald-600 p-1.5 rounded-lg"
            >
              <Leaf className="w-5 h-5 text-white" />
            </motion.div>
            <span className="text-xl font-bold text-foreground">CropGuard</span>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <a href="#features" onClick={(e) => handleSmoothScroll(e, "features")} className="text-sm text-muted-foreground hover:text-foreground transition cursor-pointer">
              Features
            </a>
            <a href="#how-it-works" onClick={(e) => handleSmoothScroll(e, "how-it-works")} className="text-sm text-muted-foreground hover:text-foreground transition cursor-pointer">
              How It Works
            </a>
            <a href="#testimonials" onClick={(e) => handleSmoothScroll(e, "testimonials")} className="text-sm text-muted-foreground hover:text-foreground transition cursor-pointer">
              Success Stories
            </a>
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Button variant="ghost" onClick={() => setLocation("/dashboard")} className="hidden md:inline-flex">
                  Dashboard
                </Button>
                <Button onClick={handleQuickScan} className="hidden md:inline-flex">
                  Quick Scan
                </Button>
                <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                  {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => setLocation(getLoginUrl())}
                  className="hidden md:inline-flex bg-background text-foreground border border-border hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all duration-300 ease-in-out"
                >
                  Sign In
                </Button>
                <Button onClick={() => setLocation(getSignupUrl())} className="hidden md:inline-flex bg-emerald-600 hover:bg-emerald-700 text-white transition-all duration-300 ease-in-out">
                  Get Started
                </Button>
                <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                  {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </>
            )}
          </div>
        </div>

        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border bg-background"
          >
            <div className="container py-4 space-y-2">
              <a href="#features" onClick={(e) => handleSmoothScroll(e, "features")} className="block py-2 text-foreground">Features</a>
              <a href="#how-it-works" onClick={(e) => handleSmoothScroll(e, "how-it-works")} className="block py-2 text-foreground">How It Works</a>
              <a href="#testimonials" onClick={(e) => handleSmoothScroll(e, "testimonials")} className="block py-2 text-foreground">Success Stories</a>
              {isAuthenticated ? (
                <Button onClick={() => setLocation("/dashboard")} className="w-full mt-4">Dashboard</Button>
              ) : (
                <>
                  <Button onClick={() => setLocation(getLoginUrl())} variant="outline" className="w-full">Sign In</Button>
                  <Button onClick={() => setLocation(getSignupUrl())} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">Get Started</Button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="container py-20 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
            Detect Crop Diseases{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
              With AI Intelligence
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed max-w-2xl mx-auto">
            Empower your farming with cutting-edge AI technology. Upload a leaf image and get instant disease detection,
            treatment recommendations, and personalized agricultural insights.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={handleGetStarted} className="text-lg px-8 py-6 bg-emerald-600 hover:bg-emerald-700 text-white transition-all duration-300 ease-in-out">
              Get Started Now
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              onClick={handleQuickScan}
              className="text-lg px-8 py-6 bg-background text-foreground border border-border hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all duration-300 ease-in-out"
            >
              Try Quick Scan
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="container py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          {[
            { icon: Users, label: "Farmers Helped", value: stats.farmersHelped },
            { icon: Sprout, label: "Scans Performed", value: stats.scansPerformed },
            { icon: Shield, label: "Diseases Detected", value: stats.diseasesDetected },
            { icon: TrendingUp, label: "Yield Increase", value: 35, suffix: "%" },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="text-center"
            >
              <div className="bg-emerald-100 dark:bg-emerald-900/30 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <stat.icon className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="text-3xl font-bold text-foreground">
                <Counter end={stat.value} />
                {stat.suffix || ""}
              </div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Grid (unchanged) */}
      <section id="features" className="container py-20 scroll-mt-16">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">Why Choose CropGuard?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our AI-powered platform provides everything you need to protect your crops and maximize yield.
          </p>
        </motion.div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: Zap, title: "Instant Detection", description: "Get disease identification in seconds using advanced AI vision", color: "from-amber-500 to-orange-500" },
            { icon: TrendingUp, title: "Smart Recommendations", description: "Receive tailored treatment and fertilizer suggestions", color: "from-emerald-500 to-teal-500" },
            { icon: Shield, title: "Prevention Measures", description: "Learn best practices to prevent future disease outbreaks", color: "from-blue-500 to-cyan-500" },
            { icon: Leaf, title: "Multi-Language Support", description: "Access in English, French, Swahili, and Luganda", color: "from-purple-500 to-pink-500" },
          ].map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="card-elevated p-8 hover:shadow-2xl transition-all duration-300 ease-in-out group"
            >
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 ease-in-out`}>
                <feature.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works (unchanged) */}
      <section id="how-it-works" className="container py-20 scroll-mt-16">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">How It Works</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Three simple steps to healthier crops and better harvests.
          </p>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            { step: "01", title: "Upload Image", description: "Capture or upload a clear photo of the affected crop leaf", icon: Camera },
            { step: "02", title: "AI Analysis", description: "Our AI model analyzes the image and identifies the disease with high accuracy", icon: Zap },
            { step: "03", title: "Get Recommendations", description: "Receive treatment plans, fertilizer tips, and prevention measures", icon: TrendingUp },
          ].map((item, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.15 }} className="relative">
              <div className="card-elevated p-8 text-center h-full">
                <div className="text-6xl font-black text-accent/10 mb-4">{item.step}</div>
                <div className="bg-accent/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
              {idx < 2 && <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-accent/30 transform -translate-y-1/2" />}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials (unchanged) */}
      <section id="testimonials" className="container py-20 scroll-mt-16">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">Success Stories</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Hear from farmers who have transformed their harvests with CropGuard.
          </p>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }} className="card-elevated p-8">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(t.rating)].map((_, i) => (<Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />))}
              </div>
              <p className="text-foreground mb-4 italic">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <span className="font-bold text-emerald-700">{t.name.charAt(0)}</span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">{t.name}</p>
                  <p className="text-sm text-muted-foreground">{t.location}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section (unchanged) */}
      <section className="container py-20">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="card-elevated bg-gradient-to-r from-emerald-600 to-teal-600 p-12 text-center rounded-2xl text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Protect Your Crops?</h2>
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of farmers using AI-powered disease detection to improve yields and reduce losses.
          </p>
          <Button size="lg" onClick={handleGetStarted} className="bg-white text-emerald-700 hover:bg-white/90 text-lg px-8 py-6 transition-all duration-300 ease-in-out">
            Get Started Now
            <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </motion.div>
      </section>

      {/* Footer (unchanged) */}
      <footer className="border-t border-border py-12 mt-20">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4"><Leaf className="w-6 h-6 text-emerald-600" /><span className="font-bold text-foreground">CropGuard</span></div>
              <p className="text-sm text-muted-foreground">Empowering farmers with AI technology for sustainable agriculture.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" onClick={(e) => handleSmoothScroll(e, "features")} className="hover:text-foreground cursor-pointer">Features</a></li>
                <li><a href="#how-it-works" onClick={(e) => handleSmoothScroll(e, "how-it-works")} className="hover:text-foreground cursor-pointer">How It Works</a></li>
                <li><a href="#" className="hover:text-foreground">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">About</a></li>
                <li><a href="#" className="hover:text-foreground">Blog</a></li>
                <li><a href="#" className="hover:text-foreground">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="text-center text-sm text-muted-foreground pt-8 border-t border-border">
            <p>&copy; 2026 CropGuard. Empowering farmers with AI technology.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}