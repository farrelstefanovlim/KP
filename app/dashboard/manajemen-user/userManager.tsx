"use client";

import { useActionState, useEffect, useState } from "react";
import { simpanUser, toggleAktif, type FormState } from "./actions";

export type UserItem = {
  id_user: string;
  nama: string;
  jabatan: string | null;
  username: string;
  role: "SUPERADMIN" | "STAFF";
  is_active: boolean;
  terdaftar: string;
};

const inputCls =
  "w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800";

export default function UserManager({ users, meId }: { users: UserItem[]; meId: string }) {
  // null = modal tertutup | {} = tambah user | { user } = edit user
  const [modal, setModal] = useState<{ user?: UserItem } | null>(null);

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 font-medium">{users.length} pengguna terdaftar</p>
        <button
          onClick={() => setModal({})}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 shadow-sm transition-all"
        >
          <span>+</span> Tambah User
        </button>
      </div>

      {/* INFO HAK AKSES */}
      <div className="flex gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm text-blue-700">
        <span>ℹ️</span>
        <div className="space-y-1">
          <p className="font-semibold text-blue-900">Hak Akses Sistem</p>
          <p>
            <b>Super Admin:</b> Akses penuh — buat, edit, hapus data, lihat semua laporan, kelola user, buat
            Perintah Kerja.
          </p>
          <p>
            <b>Staff:</b> Hanya input data operasional (BBM, Sparepart, Kas Kecil). Tidak bisa edit atau hapus
            data yang sudah diinput.
          </p>
        </div>
      </div>

      {/* DAFTAR USER */}
      <div className="space-y-4">
        {users.map((u) => {
          const admin = u.role === "SUPERADMIN";
          const isMe = u.id_user === meId;

          return (
            <div
              key={u.id_user}
              className={`bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden ${
                u.is_active ? "" : "opacity-60"
              }`}
            >
              <div className="flex items-start gap-4 p-5">
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white flex-shrink-0 ${
                    admin ? "bg-emerald-500" : "bg-blue-500"
                  }`}
                >
                  {u.nama.charAt(0).toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900">{u.nama}</h3>
                    {isMe && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                        Anda
                      </span>
                    )}
                    {!u.is_active && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-200 text-slate-600">
                        Nonaktif
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500">{u.jabatan || "-"}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={`px-3 py-0.5 rounded-full text-sm font-medium ${
                        admin ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {admin ? "Super Admin" : "Staff"}
                    </span>
                    <span className="font-mono text-sm text-slate-400">@{u.username}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-slate-400">
                  <button
                    onClick={() => setModal({ user: u })}
                    title="Edit User"
                    className="p-1 hover:text-slate-600 transition-colors"
                  >
                    ✏️
                  </button>
                  {!isMe && (
                    <form action={toggleAktif.bind(null, u.id_user)}>
                      <button
                        title={u.is_active ? "Nonaktifkan" : "Aktifkan"}
                        className="p-1 hover:text-slate-600 transition-colors"
                      >
                        {u.is_active ? "🚫" : "✅"}
                      </button>
                    </form>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3 text-sm text-slate-500">
                <span>📅</span> Terdaftar: {u.terdaftar}
              </div>
            </div>
          );
        })}
      </div>

      {modal && <UserModal user={modal.user} onClose={() => setModal(null)} />}
    </>
  );
}

function UserModal({ user, onClose }: { user?: UserItem; onClose: () => void }) {
  const isEdit = !!user;
  const [state, action, pending] = useActionState<FormState, FormData>(simpanUser, {});

  // Tutup modal otomatis setelah berhasil disimpan
  useEffect(() => {
    if (state.success) onClose();
  }, [state.success, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">{isEdit ? "Edit User" : "Tambah User Baru"}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
            ✕
          </button>
        </div>

        <form action={action} className="p-6 space-y-5">
          {isEdit && <input type="hidden" name="id_user" value={user.id_user} />}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nama Lengkap <span className="text-red-500">*</span>
            </label>
            <input name="nama" required defaultValue={user?.nama} placeholder="Nama pegawai" className={inputCls} />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Jabatan</label>
            <input
              name="jabatan"
              defaultValue={user?.jabatan ?? ""}
              placeholder="Sopir / Admin / dll."
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Username <span className="text-red-500">*</span>
              </label>
              <input name="username" required defaultValue={user?.username} placeholder="username" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Password {!isEdit && <span className="text-red-500">*</span>}
              </label>
              <input
                name="password"
                type="password"
                required={!isEdit}
                placeholder={isEdit ? "Kosongkan jika tidak diubah" : "password"}
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Role / Hak Akses <span className="text-red-500">*</span>
            </label>
            <select name="role" defaultValue={user?.role ?? "STAFF"} className={`${inputCls} bg-white`}>
              <option value="STAFF">Staff (Input Only)</option>
              <option value="SUPERADMIN">Super Admin (Akses Penuh)</option>
            </select>
          </div>

          {state.error && (
            <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded">{state.error}</div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={pending}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 shadow-sm transition-all disabled:opacity-70"
            >
              {pending ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Tambah User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}