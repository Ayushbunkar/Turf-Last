import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOutletContext } from "react-router-dom";
import toast from "react-hot-toast";
import {
  PlusCircle, Search, Filter, Grid, List, RefreshCw, Flag, TrendingUp
} from "lucide-react";
import { fetchTurfs as getTurfs, deleteTurf } from "../../../services/turfAdminService";
import TurfForm from "./TurfForm";
import TurfAdminCard from "./TurfAdminCard";

export default function TurfAdminTurfs() {
  const { darkMode } = useOutletContext() || {};
  const [turfs, setTurfs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [view, setView] = useState("grid");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("newest");

  const sportTypes = ["all","football","cricket","basketball","volleyball","badminton","tennis","multiple"];
  const sortOptions = [
    ["newest","Newest First"],["oldest","Oldest First"],
    ["name","Name A-Z"],["price_low","Price: Low to High"],["price_high","Price: High to Low"]
  ];

  useEffect(() => { loadTurfs(); }, []);
  useEffect(() => { filterSort(); }, [turfs, search, filter, sort]);

  const loadTurfs = async () => {
    setIsLoading(true);
    try {
      const data = await getTurfs();
      setTurfs(data);
    } catch (e) {
      toast.error("Failed to load turfs");
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const filterSort = () => {
    let f = turfs.filter(t =>
      (t.name+t.location+t.description).toLowerCase().includes(search.toLowerCase())
    );
    if (filter !== "all") f = f.filter(t => t.sportType === filter);
    f.sort((a,b)=>{
      switch(sort){
        case "oldest": return new Date(a.createdAt)-new Date(b.createdAt);
        case "name": return a.name.localeCompare(b.name);
        case "price_low": return a.pricePerHour-b.pricePerHour;
        case "price_high": return b.pricePerHour-a.pricePerHour;
        default: return new Date(b.createdAt)-new Date(a.createdAt);
      }
    });
    setFiltered(f);
  };

  const stats = {
    total: turfs.length,
    active: turfs.filter(t=>t.isActive).length,
    avg: turfs.length ? turfs.reduce((a,b)=>a+b.pricePerHour,0)/turfs.length : 0
  };

  const handleDelete = async id => {
    if(!window.confirm("Delete this turf?")) return;
    try {
      await deleteTurf(id);
      toast.success("Turf deleted");
      loadTurfs();
    } catch (e) {
      toast.error("Error deleting turf");
      console.error(e);
    }
  };

  const card = (icon, label, val, color) => (
    <div className={`p-6 rounded-xl border shadow-sm ${darkMode?"bg-gray-800 border-gray-700":"bg-white border-gray-200"}`}>
      <div className="flex items-center">
        <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center`}>
          {icon}
        </div>
        <div className="ml-4">
          <p className={darkMode?"text-gray-400":"text-gray-500"}>{label}</p>
          <p className={`text-2xl font-bold ${darkMode?"text-white":"text-gray-900"}`}>{val}</p>
        </div>
      </div>
    </div>
  );

  if (isLoading)
    return <div className="flex justify-center items-center min-h-screen"><div className="animate-spin h-12 w-12 border-t-2 border-b-2 border-green-500 rounded-full"></div></div>;

  return (
    <div className={`p-6 ${darkMode?"bg-gray-900":"bg-gray-50"} min-h-screen`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
        <div>
          <h1 className={`text-3xl font-bold ${darkMode?"text-white":"text-gray-900"}`}>Manage Turfs</h1>
          <p className={darkMode?"text-gray-400":"text-gray-600"}>Create, edit, and manage turf listings</p>
        </div>
        <div className="flex gap-3">
          <button onClick={loadTurfs} className={`flex items-center px-4 py-2 rounded-lg border ${darkMode?"bg-gray-800 text-gray-300 border-gray-700":"bg-white text-gray-700 border-gray-300"} hover:bg-gray-700/10`}>
            <RefreshCw className="w-4 h-4 mr-2"/>Refresh
          </button>
          <button onClick={()=>{setEditing(null);setShowForm(true);}} className="flex items-center px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-lg">
            <PlusCircle className="w-4 h-4 mr-2"/>Add Turf
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-6">
        {card(<Flag className="w-6 h-6 text-green-600"/>, "Total Turfs", stats.total, "bg-green-100 dark:bg-green-900/20")}
        {card(<TrendingUp className="w-6 h-6 text-blue-600"/>, "Active Turfs", stats.active, "bg-blue-100 dark:bg-blue-900/20")}
        {card(<span className="text-purple-600 font-bold text-lg">₹</span>, "Avg. Price/hr", `₹${Math.round(stats.avg)}`, "bg-purple-100 dark:bg-purple-900/20")}
      </div>

      {/* Controls */}
      <div className={`p-4 mb-6 rounded-xl border ${darkMode?"bg-gray-800 border-gray-700":"bg-white border-gray-200"}`}>
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode?"text-gray-400":"text-gray-500"}`}/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search turfs..." className={`w-full pl-10 pr-4 py-2 rounded-lg border focus:ring-2 focus:ring-green-500 ${darkMode?"bg-gray-700 border-gray-600 text-white":"bg-white border-gray-300 text-gray-900"}`}/>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500"/>
              <select value={filter} onChange={e=>setFilter(e.target.value)} className={`px-3 py-2 rounded-lg border focus:ring-2 focus:ring-green-500 ${darkMode?"bg-gray-700 border-gray-600 text-white":"bg-white border-gray-300 text-gray-900"}`}>
                {sportTypes.map(s=><option key={s} value={s}>{s[0].toUpperCase()+s.slice(1)}</option>)}
              </select>
            </div>
            <select value={sort} onChange={e=>setSort(e.target.value)} className={`px-3 py-2 rounded-lg border focus:ring-2 focus:ring-green-500 ${darkMode?"bg-gray-700 border-gray-600 text-white":"bg-white border-gray-300 text-gray-900"}`}>
              {sortOptions.map(([v,l])=><option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            {["grid","list"].map(v=>(
              <button key={v} onClick={()=>setView(v)} className={`p-2 rounded-lg focus:ring-2 focus:ring-green-500 ${view===v?"bg-green-600 text-white":darkMode?"bg-gray-700 text-gray-300":"bg-gray-200 text-gray-600"}`}>
                {v==="grid"?<Grid className="w-4 h-4"/>:<List className="w-4 h-4"/>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Turfs */}
      <div className={`mb-4 ${darkMode?"text-gray-300":"text-gray-600"}`}>Showing {filtered.length} of {turfs.length} turfs</div>
      <AnimatePresence>
        {filtered.length===0?(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className={`text-center py-16 rounded-xl border ${darkMode?"bg-gray-800 border-gray-700":"bg-white border-gray-200"}`}>
            <Flag className="w-16 h-16 mx-auto mb-4 text-gray-400"/>
            <h3 className={`text-xl font-semibold mb-2 ${darkMode?"text-white":"text-gray-900"}`}>No turfs found</h3>
            <button onClick={()=>setShowForm(true)} className="mt-4 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"><PlusCircle className="w-5 h-5 inline-block mr-2"/>Add Turf</button>
          </motion.div>
        ):(
          <div className={`grid gap-6 ${view==="grid"?"md:grid-cols-2 xl:grid-cols-3":"grid-cols-1"}`}>
            {filtered.map((t,i)=>(
              <motion.div key={t._id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.03}}>
                <TurfAdminCard turf={t} onEdit={t=>{setEditing(t);setShowForm(true);}} onDelete={handleDelete} onView={t=>toast.success(`Viewing ${t.name}`)} darkMode={darkMode}/>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      <TurfForm isOpen={showForm} onClose={()=>setShowForm(false)} onTurfAdded={loadTurfs} editingTurf={editing} darkMode={darkMode}/>
    </div>
  );
}
