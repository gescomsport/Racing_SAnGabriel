import { useState } from "react";
import axios from "axios";
import { Upload, FileText, User, Eye, Trash2 } from "lucide-react";
import { Button } from "../ui/button";

const ax = axios.create({ baseURL: `${process.env.REACT_APP_BACKEND_URL}/api`, withCredentials: true });

function resolveUrl(url) {
  if (!url) return null;
  return url.startsWith("/api/") ? `${process.env.REACT_APP_BACKEND_URL}${url}` : url;
}

function DocSlot({ label, icon: Icon, url, accept, onUpload, uploading }) {
  const resolved = resolveUrl(url);
  const isPdf = url?.endsWith(".pdf");

  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-medium text-[#475569]">{label}</p>
      <label className={`relative flex flex-col items-center justify-center rounded-xl border-2 cursor-pointer transition-all min-h-[80px] ${resolved ? "border-green-300 bg-green-50" : "border-dashed border-[#E2E8F0] hover:border-[#2460FF] bg-[#F8FAFF]"}`}>
        {resolved ? (
          isPdf ? (
            <div className="flex flex-col items-center gap-1 py-3 px-2">
              <FileText size={20} className="text-green-600" />
              <p className="text-xs text-green-700 font-medium text-center">PDF subido</p>
              <a href={resolved} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                className="text-xs text-[#2460FF] underline">Ver documento</a>
            </div>
          ) : (
            <img src={resolved} alt={label} className="w-full h-20 object-cover rounded-lg" onError={e => { e.target.style.display = "none"; }} />
          )
        ) : (
          <div className="flex flex-col items-center gap-1 py-3 px-2 text-[#94A3B8]">
            <Icon size={18} />
            <p className="text-xs text-center">{uploading ? "Subiendo..." : "Subir"}</p>
          </div>
        )}
        <input type="file" accept={accept} className="hidden" onChange={e => onUpload(e.target.files?.[0])} disabled={uploading} />
      </label>
    </div>
  );
}

export default function DocumentUploader({ personType, personId, data, onUpdated }) {
  const [uploading, setUploading] = useState({});

  const upload = async (docType, file) => {
    if (!file || !personId) return;
    setUploading(u => ({ ...u, [docType]: true }));
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await ax.post(`/${personType}/${personId}/upload-doc?doc_type=${docType}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onUpdated?.(r.data.field, r.data.url);
    } catch (e) {
      alert("Error al subir el archivo. Intenta de nuevo.");
    } finally {
      setUploading(u => ({ ...u, [docType]: false }));
    }
  };

  return (
    <div className="border border-[#E2E8F0] rounded-xl p-3 bg-white">
      <p className="text-xs font-bold text-[#475569] uppercase tracking-wide mb-3">Documentos e imagen</p>
      <div className="grid grid-cols-3 gap-3">
        <DocSlot
          label="Foto de perfil"
          icon={User}
          url={data?.photo_url}
          accept="image/*"
          uploading={uploading.photo}
          onUpload={f => upload("photo", f)}
        />
        <DocSlot
          label="DNI Anverso"
          icon={FileText}
          url={data?.dni_front_url}
          accept="image/*,.pdf"
          uploading={uploading.dni_front}
          onUpload={f => upload("dni_front", f)}
        />
        <DocSlot
          label="DNI Reverso"
          icon={FileText}
          url={data?.dni_back_url}
          accept="image/*,.pdf"
          uploading={uploading.dni_back}
          onUpload={f => upload("dni_back", f)}
        />
      </div>
      <p className="text-xs text-[#94A3B8] mt-2">Haz clic en cada cuadro para subir. Acepta JPG, PNG o PDF.</p>
    </div>
  );
}
