import { useState } from "react";
import axios from "axios";
import { Mail, Phone, MapPin, Send, CheckCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ContactSection() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "", subject: "general" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setError("");
    try {
      await axios.post(`${API}/contact`, form);
      setSent(true);
      setForm({ name: "", email: "", phone: "", message: "", subject: "general" });
    } catch {
      setError("Error al enviar el mensaje. Intentalo de nuevo.");
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="contacto" className="py-16 lg:py-24 bg-[#F4F7FB]" data-testid="contact-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Info */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Mail size={20} className="text-[#2460FF]" />
              <p className="text-sm font-medium text-[#2460FF] uppercase tracking-widest">Contacto</p>
            </div>
            <h2 className="font-heading font-bold text-[#00296B] text-2xl lg:text-3xl tracking-tight mb-6">
              Ponte en contacto con nosotros
            </h2>
            <p className="text-[#475569] leading-relaxed mb-8">
              Quieres formar parte de nuestro club? Tienes alguna pregunta? Rellena el formulario o contactanos directamente. Horario: Lunes a Sabado de 9:00 a 21:00.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-[#00296B] p-2 rounded-lg">
                  <MapPin size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#0F172A]">Direccion</p>
                  <p className="text-sm text-[#475569]">Carrer Racing San Gabriel, 39, 03008 Alacant, Alicante</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-[#00296B] p-2 rounded-lg">
                  <Phone size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#0F172A]">Telefono</p>
                  <p className="text-sm text-[#475569]">+34 617 50 27 80</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-[#00296B] p-2 rounded-lg">
                  <Mail size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#0F172A]">Email</p>
                  <p className="text-sm text-[#475569]">racingsangabrieladc@hotmail.com</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 lg:p-8">
            {sent ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12" data-testid="contact-success">
                <CheckCircle size={48} className="text-green-500 mb-4" />
                <h3 className="font-heading font-bold text-[#00296B] text-xl mb-2">Mensaje enviado</h3>
                <p className="text-[#475569] text-sm">Nos pondremos en contacto contigo pronto.</p>
                <Button
                  onClick={() => setSent(false)}
                  className="mt-6 bg-[#2460FF] hover:bg-[#00296B] text-white"
                  data-testid="send-another-message-btn"
                >
                  Enviar otro mensaje
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4" data-testid="contact-form">
                <div>
                  <Label htmlFor="name" className="text-sm font-medium text-[#0F172A]">Nombre *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    required
                    className="mt-1 border-[#E2E8F0] focus:ring-[#2460FF] focus:border-[#2460FF]"
                    data-testid="contact-name-input"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-[#0F172A]">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      required
                      className="mt-1 border-[#E2E8F0] focus:ring-[#2460FF] focus:border-[#2460FF]"
                      data-testid="contact-email-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium text-[#0F172A]">Telefono</Label>
                    <Input
                      id="phone"
                      value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                      className="mt-1 border-[#E2E8F0] focus:ring-[#2460FF] focus:border-[#2460FF]"
                      data-testid="contact-phone-input"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="message" className="text-sm font-medium text-[#0F172A]">Mensaje *</Label>
                  <Textarea
                    id="message"
                    value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })}
                    required
                    rows={4}
                    className="mt-1 border-[#E2E8F0] focus:ring-[#2460FF] focus:border-[#2460FF]"
                    data-testid="contact-message-input"
                  />
                </div>
                {error && <p className="text-sm text-red-500" data-testid="contact-error">{error}</p>}
                <Button
                  type="submit"
                  disabled={sending}
                  className="w-full bg-[#2460FF] hover:bg-[#00296B] text-white font-heading font-bold py-3 rounded-lg transition-colors duration-150"
                  data-testid="submit-contact-button"
                >
                  {sending ? "Enviando..." : <><Send size={16} className="mr-2" /> Enviar Mensaje</>}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
