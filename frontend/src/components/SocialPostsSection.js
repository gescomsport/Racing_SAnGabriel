import { useEffect, useState } from "react";
import axios from "axios";
import { Instagram, Facebook, ExternalLink, Rss } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function SocialPostsSection() {
  const [igPosts, setIgPosts] = useState([]);
  const [fbPosts, setFbPosts] = useState([]);

  useEffect(() => {
    axios.get(`${API}/social-posts?source=instagram&limit=4`).then(r => setIgPosts(r.data)).catch(() => {});
    axios.get(`${API}/social-posts?source=facebook&limit=4`).then(r => setFbPosts(r.data)).catch(() => {});
  }, []);

  const hasPosts = igPosts.length > 0 || fbPosts.length > 0;
  if (!hasPosts) return null;

  return (
    <section id="noticias" className="py-16 lg:py-24 bg-[#F4F7FB]" data-testid="social-posts-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-2">
          <Rss size={20} className="text-[#2460FF]" />
          <p className="text-sm font-medium text-[#2460FF] uppercase tracking-widest">Ultimas publicaciones</p>
        </div>
        <h2 className="font-heading font-bold text-[#00296B] text-2xl lg:text-3xl tracking-tight mb-3">
          Novedades desde nuestras redes
        </h2>
        <p className="text-[#475569] text-sm mb-8">
          Todo lo que publicamos en Instagram y Facebook aparece aqui automaticamente.
        </p>

        {/* Instagram Posts */}
        {igPosts.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-gradient-to-br from-[#833AB4] via-[#E1306C] to-[#F77737] p-1.5 rounded-lg">
                <Instagram size={16} className="text-white" />
              </div>
              <h3 className="font-heading font-bold text-[#00296B] text-base">Instagram</h3>
              <a href="https://www.instagram.com/racingsangabrieladc/" target="_blank" rel="noopener noreferrer"
                 className="ml-auto text-sm text-[#2460FF] hover:text-[#00296B] flex items-center gap-1" data-testid="ig-profile-link">
                @racingsangabrieladc <ExternalLink size={12} />
              </a>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {igPosts.map((post, i) => (
                <PostCard key={post.id} post={post} index={i} type="instagram" />
              ))}
            </div>
          </div>
        )}

        {/* Facebook Posts */}
        {fbPosts.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-[#1877F2] p-1.5 rounded-lg">
                <Facebook size={16} className="text-white" />
              </div>
              <h3 className="font-heading font-bold text-[#00296B] text-base">Facebook</h3>
              <a href="https://www.facebook.com/RacingSanGabrielADC/" target="_blank" rel="noopener noreferrer"
                 className="ml-auto text-sm text-[#2460FF] hover:text-[#00296B] flex items-center gap-1" data-testid="fb-profile-link">
                RacingSanGabrielADC <ExternalLink size={12} />
              </a>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {fbPosts.map((post, i) => (
                <PostCard key={post.id} post={post} index={i} type="facebook" />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function PostCard({ post, index, type }) {
  const borderColor = type === "instagram" ? "hover:border-[#E1306C]" : "hover:border-[#1877F2]";
  const iconColor = type === "instagram" ? "text-[#E1306C]" : "text-[#1877F2]";
  const Icon = type === "instagram" ? Instagram : Facebook;

  return (
    <a
      href={post.post_url}
      target="_blank"
      rel="noopener noreferrer"
      className={`bg-white rounded-xl border border-[#E2E8F0] ${borderColor} transition-all duration-150 overflow-hidden group block`}
      data-testid={`${type}-post-${index}`}
    >
      {post.image_url && (
        <div className="h-40 overflow-hidden">
          <img
            src={post.image_url}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center gap-1.5 mb-2">
          <Icon size={12} className={iconColor} />
          <span className="text-xs text-[#475569]">{post.author}</span>
        </div>
        <p className="text-sm text-[#0F172A] leading-relaxed line-clamp-3">{post.content}</p>
        <p className="text-xs text-[#94A3B8] mt-2">
          {post.posted_at ? new Date(post.posted_at).toLocaleDateString("es-ES", { day: "numeric", month: "short" }) : ""}
        </p>
      </div>
    </a>
  );
}
