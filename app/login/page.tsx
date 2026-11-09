"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  //Simpan input user
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  //Error dan Loading UI/UX
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  //komponen
  const handleLogin = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try{
      const res = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Username atau Password Salah");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("Terjadi Kesalahan pada server.");
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoAccount = (demoUsername: string, role: string) => {
    setUsername(demoUsername);
    setPassword("masteradmin123");
    setError("");
  }
  return (
    <div className="flex min-h-screen bg-white font-sans">
      
      {/* --- PANEL KIRI: BRANDING & INFO (Sembunyi di HP, Muncul di PC) --- */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#172033] text-white flex-col justify-center px-16 relative overflow-hidden">
        {/* Dekorasi Latar */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-emerald-400 to-transparent"></div>
        
        <div className="relative z-10 max-w-lg">
          <div className="flex items-center gap-2 mb-12 text-emerald-400 font-bold text-xl tracking-wider">
            <div className="w-8 h-8 rounded bg-emerald-500 text-white flex items-center justify-center">
              {/* Icon Dummy SIMO */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M3.375 3C2.339 3 1.5 3.84 1.5 4.875v.75c0 1.036.84 1.875 1.875 1.875h17.25c1.035 0 1.875-.84 1.875-1.875v-.75C22.5 3.839 21.66 3 20.625 3H3.375z" />
                <path fillRule="evenodd" d="M3.087 9l.54 9.176A3 3 0 006.62 21h10.757a3 3 0 002.995-2.824L20.913 9H3.087zm6.163 3.75A.75.75 0 0110 12h4a.75.75 0 010 1.5h-4a.75.75 0 01-.75-.75z" clipRule="evenodd" />
              </svg>
            </div>
            SIMO
          </div>

          <h1 className="text-4xl font-bold mb-4 leading-tight">
            Kelola Operasional<br/>
            <span className="text-emerald-400">Lebih Efisien</span>
          </h1>
          <p className="text-slate-400 mb-10 text-sm leading-relaxed">
            Platform terpadu untuk manajemen armada kendaraan, kas kecil, perintah kerja, dan pelaporan operasional PT. Mega Arista Jaya Utama.
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#1F293F] p-4 rounded-xl border border-slate-700/50 shadow-lg">
              <div className="text-emerald-400 mb-2">🚛</div>
              <h3 className="font-semibold">3 Unit</h3>
              <p className="text-xs text-slate-400">Total Kendaraan</p>
            </div>
            <div className="bg-[#1F293F] p-4 rounded-xl border border-slate-700/50 shadow-lg">
              <div className="text-blue-400 mb-2">📊</div>
              <h3 className="font-semibold">4 Modul</h3>
              <p className="text-xs text-slate-400">Modul Aktif</p>
            </div>
            <div className="bg-[#1F293F] p-4 rounded-xl border border-slate-700/50 shadow-lg">
              <div className="text-amber-400 mb-2">🔐</div>
              <h3 className="font-semibold">2 Level</h3>
              <p className="text-xs text-slate-400">Level Akses</p>
            </div>
            <div className="bg-[#1F293F] p-4 rounded-xl border border-slate-700/50 shadow-lg">
              <div className="text-purple-400 mb-2">📈</div>
              <h3 className="font-semibold">Real-time</h3>
              <p className="text-xs text-slate-400">Laporan</p>
            </div>
          </div>
        </div>
      </div>

      {/* --- PANEL KANAN: FORM LOGIN --- */}
      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Masuk ke Sistem</h2>
            <p className="text-sm text-slate-500">Gunakan akun yang telah diberikan oleh administrator.</p>
          </div>
          
          {/* Notifikasi Error */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username" 
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password" 
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors" 
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full rounded-lg bg-emerald-500 px-4 py-2.5 text-white font-semibold hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? "Memproses..." : "Masuk"}
            </button>
          </form>

          {/* Bagian Auto-fill Demo Akun */}
          <div className="mt-10 border-t border-slate-200 pt-6">
            <p className="text-xs font-semibold text-slate-400 mb-4 tracking-wider uppercase">DEMO AKUN — KLIK UNTUK MENGISI</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => fillDemoAccount("superadmin", "Super Admin")} type="button" className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 transition-colors text-left">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-sm">S</div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Super Admin</p>
                  <p className="text-xs text-slate-500">superadmin</p>
                </div>
              </button>
              
              <button onClick={() => fillDemoAccount("staff_budi", "Staff")} type="button" className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-colors text-left">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">B</div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Budi</p>
                  <p className="text-xs text-slate-500">Staff Operasional</p>
                </div>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// export default function LoginPage() {
//   return (
//     // Container utama selebar dan setinggi layar
//     <div className="flex min-h-screen bg-white">
      
//       {/* KOLOM KIRI (Branding & Info - Hanya muncul di layar besar) */}
//       <div className="hidden lg:flex lg:w-1/2 bg-[#1A253A] text-white flex-col justify-center px-12">
//         <h1 className="text-4xl font-bold mb-4">Kelola Operasional<br/><span className="text-emerald-400">Lebih Efisien</span></h1>
//         <p className="text-slate-300 mb-8">Platform terpadu untuk manajemen armada kendaraan, kas kecil, perintah kerja, dan pelaporan operasional.</p>
        
//         {/* Tempat untuk grid 4 kotak (Total Kendaraan, Level Akses, dll) */}
//         <div className="grid grid-cols-2 gap-4">
//            {/* Isi kotak-kotak kartu di sini */}
//         </div>
//       </div>

//       {/* KOLOM KANAN (Form Login) */}
//       <div className="flex w-full lg:w-1/2 flex-col items-center justify-center p-8">
//         <div className="w-full max-w-md">
//           <h2 className="text-2xl font-bold text-gray-900 mb-2">Masuk ke Sistem</h2>
//           <p className="text-gray-500 mb-8">Gunakan akun yang telah diberikan oleh administrator.</p>
          
//           <form className="space-y-4">
//             {/* Input Username */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700">Username</label>
//               <input type="text" placeholder="Masukkan username" className="mt-1 w-full rounded-md border border-gray-300 p-2 focus:border-emerald-500 focus:ring-emerald-500" />
//             </div>

//             {/* Input Password */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700">Password</label>
//               <input type="password" placeholder="Masukkan password" className="mt-1 w-full rounded-md border border-gray-300 p-2 focus:border-emerald-500 focus:ring-emerald-500" />
//             </div>

//             {/* Tombol Masuk */}
//             <button type="submit" className="w-full rounded-md bg-emerald-500 py-2 text-white hover:bg-emerald-600 font-semibold transition">
//               Masuk
//             </button>
//           </form>
//         </div>
//       </div>

//     </div>
//   );
// }