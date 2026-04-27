import { useState, useEffect } from "react";
import React from "react";
import {
  LayoutDashboard, GitBranch, Store, BedDouble, Table2,
  UtensilsCrossed, CreditCard, Users, Layers, TrendingUp,
  ShoppingBag, DollarSign, Clock, MoreHorizontal,
  PanelRightOpen, ChevronRight,
  Printer, CheckCircle2, ShieldCheck, Activity, Share2,
  Loader2
} from "lucide-react";
import Header from "../components/Header";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { Button } from "../components/ui/button";
import { useRootStore } from "../store/root-store";
import { cn } from "../lib/utils";
import { onboardsetupApi } from "../lib/onboardsetup-api";

// Sub-step components for configuration
import { BranchStep } from "../components/onboarding/steps/configuration/BranchStep";
import { RestaurantStep } from "../components/onboarding/steps/configuration/RestaurantStep";
import { MenuStep } from "../components/onboarding/steps/configuration/MenuStep";
import { RoomsStep } from "../components/onboarding/steps/configuration/RoomsStep";
import { TablesStep } from "../components/onboarding/steps/configuration/TablesStep";
import { PaymentStep } from "../components/onboarding/steps/configuration/PaymentStep";
import { UsersStep } from "../components/onboarding/steps/configuration/UsersStep";
import { PrinterStep } from "../components/onboarding/steps/configuration/PrinterStep";
import { IntegrationsStep } from "../components/onboarding/steps/configuration/IntegrationsStep";

type Section =
  | "overview" | "branch" | "restaurant" | "rooms" | "tables"
  | "menu" | "payment" | "users" | "integration" | "printer";

interface NavItem {
  id: Section;
  label: string;
  icon: React.ElementType;
  group: string;
  description: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, group: "Main", description: "Real-time performance metrics" },
  { id: "branch", label: "Branch", icon: GitBranch, group: "Operations", description: "Location and contact details" },
  { id: "restaurant", label: "Restaurant", icon: Store, group: "Operations", description: "Branding and profile settings" },
  { id: "printer", label: "Printers", icon: Printer, group: "Operations", description: "Billing and KOT configuration" },
  { id: "rooms", label: "Rooms", icon: BedDouble, group: "Operations", description: "Dining area management" },
  { id: "tables", label: "Tables", icon: Table2, group: "Operations", description: "Table layout and seating" },
  { id: "menu", label: "Menu", icon: UtensilsCrossed, group: "Content", description: "Catalog, items and pricing" },
  { id: "payment", label: "Payment", icon: CreditCard, group: "Financial", description: "Payment gateways and taxes" },
  { id: "users", label: "Users", icon: Users, group: "System", description: "Team roles and access" },
  { id: "integration", label: "Integration", icon: Share2, group: "System", description: "Third-party connections" },
];

const COLORS = ["#2563eb", "#6366f1", "#10b981"];

const ICON_MAP: Record<string, React.ElementType> = {
  DollarSign,
  ShoppingBag,
  Clock,
  Table2,
  Users
};

export function AdminDashboard() {
  const { user, checkAuth } = useRootStore();
  const [activeSection, setActiveSection] = useState<Section>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  
  // Dashboard Data State
  const [stats, setStats] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);
  const [popularItems, setPopularItems] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      checkAuth();
    }
  }, [user, checkAuth]);

  useEffect(() => {
    const fetchStats = async () => {
      if (activeSection !== 'overview') return;
      
      setLoading(true);
      try {
        const response = await onboardsetupApi.getAdminStats();
        if (response.message) {
          const data = response.message;
          setStats(data.stats || []);
          setRevenueData(data.revenueData || []);
          setPieData(data.pieData || []);
          setPopularItems(data.popularItems || []);
        }
      } catch (error) {
        console.error("Failed to fetch admin stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [activeSection]);

  const groups = Array.from(new Set(NAV_ITEMS.map((item) => item.group)));

  const renderSectionContent = () => {
    switch (activeSection) {
      case "branch": return <BranchStep />;
      case "restaurant": return <RestaurantStep />;
      case "menu": return <MenuStep />;
      case "rooms": return <RoomsStep />;
      case "tables": return <TablesStep />;
      case "payment": return <PaymentStep />;
      case "users": return <UsersStep />;
      case "printer": return <PrinterStep />;
      case "integration": return <IntegrationsStep />;
      case "overview": return renderOverview();
      default:
        return (
          <div className="flex flex-col items-center justify-center h-96 text-center">
            <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mb-8 rotate-3 shadow-xl shadow-blue-100">
              <Layers className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 capitalize mb-2">{activeSection} Module</h2>
            <p className="text-gray-500 max-w-lg text-sm font-medium">
              We're currently perfecting the {activeSection} management tools. Stay tuned for advanced analytics and control features!
            </p>
            <Button className="mt-8 px-8 py-6 rounded-md gap-2 font-medium shadow-lg shadow-blue-100 bg-blue-600" onClick={() => setActiveSection("overview")}>
              <LayoutDashboard className="w-5 h-5" />
              Return to Dashboard
            </Button>
          </div>
        );
    }
  };

  const renderOverview = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          <p className="text-sm font-medium text-gray-500">Loading your performance metrics...</p>
        </div>
      );
    }

    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-0.5">Dashboard</h1>
            <p className="text-sm text-gray-500 font-medium">Welcome back, {user?.full_name?.split(' ')[0] || 'Admin'}! Here's your restaurant's performance.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2 shadow-sm font-medium border h-11 px-5 rounded-md bg-white">
              <Clock className="w-4 h-4" />
              Last 24 Hours
            </Button>
            <Button className="gap-2 shadow-lg shadow-blue-100 font-medium h-11 px-5 rounded-md bg-blue-600">
              <Activity className="w-4 h-4" />
              Live View
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {stats.map((stat, i) => {
            const Icon = ICON_MAP[stat.icon] || LayoutDashboard;
            return (
              <div key={i} className="bg-white p-6 rounded-md border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 group">
                <div className="flex items-center justify-between mb-4">
                  <div className={cn(
                    "p-3 rounded-md transition-colors",
                    stat.color === "blue" ? "bg-blue-50 text-blue-600" :
                    stat.color === "indigo" ? "bg-indigo-50 text-indigo-600" :
                    stat.color === "emerald" ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={cn(
                    "text-xs font-medium px-2.5 py-1 rounded-full",
                    stat.trend?.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-500'
                  )}>
                    {stat.trend}
                  </span>
                </div>
                <p className="text-sm text-gray-500 font-medium mb-1 opacity-70">{stat.label}</p>
                <h3 className="text-xl font-bold text-gray-900 tracking-tight">{stat.value}</h3>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Revenue Chart */}
          <div className="lg:col-span-2 bg-white p-8 rounded-md border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-blue-50 flex items-center justify-center text-blue-600">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Revenue Analytics</h3>
              </div>
              <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData.length > 0 ? revenueData : [{time: '', amount: 0}]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '16px', 
                      border: 'none', 
                      boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', 
                      backgroundColor: '#ffffff',
                      padding: '12px'
                    }} 
                    itemStyle={{ fontWeight: 800, color: '#1e293b' }}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorAmount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-8 rounded-md border border-gray-200 shadow-sm flex flex-col">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-md bg-indigo-50 flex items-center justify-center text-indigo-600">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Order Sources</h3>
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <div className="h-56 mb-8">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={8} dataKey="value">
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '16px', 
                        border: 'none', 
                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', 
                        backgroundColor: '#ffffff' 
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-4">
                {pieData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                      <span className="text-gray-500 font-medium">{item.name}</span>
                    </div>
                    <span className="font-medium text-gray-900">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Popular Items */}
        <div className="bg-white p-8 rounded-md border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-emerald-50 flex items-center justify-center text-emerald-600">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Popular Items Today</h3>
            </div>
            <Button variant="ghost" className="text-blue-600 font-medium hover:bg-blue-50">View Menu</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-gray-100">
                  <th className="pb-4 font-medium text-gray-500 text-xs">Item Name</th>
                  <th className="pb-4 font-medium text-gray-500 text-xs text-right">Sales</th>
                  <th className="pb-4 font-medium text-gray-500 text-xs text-right">Revenue</th>
                  <th className="pb-4 font-medium text-gray-500 text-xs text-right">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {popularItems.length > 0 ? popularItems.map((item, i) => (
                  <tr key={i} className="group hover:bg-gray-50/50 transition-colors">
                    <td className="py-5 font-medium text-gray-900 text-sm">{item.name}</td>
                    <td className="py-5 text-right text-gray-500 font-medium">{item.sales}</td>
                    <td className="py-5 text-right text-gray-900 font-medium">₹{item.revenue}</td>
                    <td className="py-5 text-right">
                      <span className="inline-flex items-center gap-1.5 text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-xs font-medium">
                        <TrendingUp className="w-3 h-3" />
                        {item.trend || '0%'}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-gray-400 font-medium">No sales data recorded today</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50/50 text-gray-900 overflow-hidden selection:bg-blue-100 selection:text-blue-900">
      <Header hideSearch />
      <div className="flex flex-1 overflow-hidden">
        {/* Premium Sidebar */}
        <aside
          className={cn("bg-white border-r border-gray-200 flex-shrink-0 flex flex-col z-30 shadow-sm transition-all duration-300", sidebarOpen ? "w-[280px]" : "w-[80px]")}
        >
          <div className="flex flex-col h-full overflow-hidden">
            {/* Sidebar Toggle & Header */}
            <div className={cn("flex items-center mb-6", sidebarOpen ? "justify-end px-2" : "justify-center")}>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
              >
                {sidebarOpen ? <PanelRightOpen className="w-5 h-5 rotate-180" /> : <PanelRightOpen className="w-5 h-5" />}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-4 custom-scrollbar">
              <div className={cn(
                "transition-all duration-300",
                sidebarOpen ? "bg-gray-50/50 border border-gray-100 rounded-2xl p-3" : ""
              )}>
                {groups.map((group) => (
                  <div key={group} className="mb-6 last:mb-0">
                    {sidebarOpen && (
                      <p className="text-xs font-bold text-gray-500 mb-3 px-3">
                        {group}
                      </p>
                    )}
                    <div className="space-y-1">
                      {NAV_ITEMS.filter((item) => item.group === group).map((item) => {
                        const isActive = activeSection === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => setActiveSection(item.id)}
                            className={cn(
                              "w-full flex items-center rounded-md text-sm transition-all duration-200 relative group h-11",
                              isActive
                                ? "bg-white text-blue-600 shadow-sm border border-gray-200 font-medium"
                                : "text-gray-500 hover:bg-gray-100 hover:text-gray-900 font-medium",
                              sidebarOpen ? "gap-3 px-3" : "justify-center"
                            )}
                            title={!sidebarOpen ? item.label : undefined}
                          >
                            {isActive && (
                              <div
                                className="absolute start-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-e-full"
                              />
                            )}
                            <div className={cn(
                              "flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg transition-colors",
                              isActive ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-400 group-hover:bg-gray-200"
                            )}>
                              <item.icon className="w-4 h-4" />
                            </div>
                            {sidebarOpen && <span className="truncate">{item.label}</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden relative">
        {/* Modern Sub-header / Breadcrumbs */}
        <header className="h-16 border-b border-gray-200 bg-white/50 backdrop-blur-md flex items-center justify-between px-10 flex-shrink-0 z-20">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Admin Control</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-gray-900 font-bold">{activeSection}</span>
            </div>
          </div>
        </header>

        {/* Dynamic Main Content Wrapper */}
        <main className="flex-1 overflow-y-auto bg-gray-50/30 custom-scrollbar">
          <div className="max-w-6xl mx-auto p-12 w-full">
            <div>
              <div>
                {/* Section Header */}
                {activeSection !== "overview" && (
                  <div className="mb-12">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-100">
                        {React.createElement(NAV_ITEMS.find(n => n.id === activeSection)?.icon || LayoutDashboard, { className: "w-6 h-6" })}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 tracking-tight capitalize">
                          {NAV_ITEMS.find(n => n.id === activeSection)?.label} Settings
                        </h2>
                        <p className="text-sm text-gray-500 font-medium">
                          {NAV_ITEMS.find(n => n.id === activeSection)?.description}
                        </p>
                      </div>
                    </div>
                    <div className="h-1 w-24 bg-blue-600 rounded-full" />
                  </div>
                )}

                {/* Actual Content */}
                <div className={cn(
                  activeSection !== "overview" ? "bg-white p-10 rounded-md border border-gray-200 shadow-xl shadow-gray-200/40" : ""
                )}>
                  {renderSectionContent()}
                </div>

                {/* Footer hint for non-overview sections */}
                {activeSection !== "overview" && (
                  <div className="mt-12 flex items-center justify-center gap-3 text-gray-500 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Changes are saved automatically to your restaurant profile</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  </div>
  );
}

export default AdminDashboard;
