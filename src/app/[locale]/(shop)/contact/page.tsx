"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Mail, Phone, MapPin, Loader2 } from "lucide-react";

export default function ContactPage() {
  const pathname = usePathname();
  const isEn = pathname.startsWith("/en");
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (res.ok) {
        toast({ title: isEn ? "Message sent!" : "Το μήνυμα στάλθηκε!" });
        setForm({ name: "", email: "", subject: "", message: "" });
      } else {
        toast({ title: isEn ? "Error" : "Σφάλμα", variant: "destructive" });
      }
    } catch {
      toast({ title: isEn ? "Error" : "Σφάλμα", variant: "destructive" });
    }
    setSending(false);
  };

  return (
    <div className="container py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">{isEn ? "Contact Us" : "Επικοινωνία"}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader><CardTitle>{isEn ? "Send us a message" : "Στείλτε μας μήνυμα"}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2"><Label>{isEn ? "Name" : "Όνομα"}</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
              <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required /></div>
              <div className="space-y-2"><Label>{isEn ? "Subject" : "Θέμα"}</Label><Input value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} required /></div>
              <div className="space-y-2"><Label>{isEn ? "Message" : "Μήνυμα"}</Label><Textarea value={form.message} onChange={e => setForm({...form, message: e.target.value})} rows={5} required /></div>
              <Button type="submit" disabled={sending} className="w-full">{sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{isEn ? "Send Message" : "Αποστολή"}</Button>
            </form>
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Card><CardContent className="p-6 flex items-start gap-4"><Mail className="h-6 w-6 text-primary mt-1" /><div><h3 className="font-semibold">Email</h3><p className="text-sm text-muted-foreground">info@eshop.fantsos.gr</p></div></CardContent></Card>
          <Card><CardContent className="p-6 flex items-start gap-4"><Phone className="h-6 w-6 text-primary mt-1" /><div><h3 className="font-semibold">{isEn ? "Phone" : "Τηλέφωνο"}</h3><p className="text-sm text-muted-foreground">+30 210 1234567</p></div></CardContent></Card>
          <Card><CardContent className="p-6 flex items-start gap-4"><MapPin className="h-6 w-6 text-primary mt-1" /><div><h3 className="font-semibold">{isEn ? "Address" : "Διεύθυνση"}</h3><p className="text-sm text-muted-foreground">{isEn ? "Athens, Greece" : "Αθήνα, Ελλάδα"}</p></div></CardContent></Card>
        </div>
      </div>
    </div>
  );
}
