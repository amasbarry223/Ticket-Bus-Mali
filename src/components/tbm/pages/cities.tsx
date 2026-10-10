"use client";

import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Building2, MapPin, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/lib/auth-store";
import { useTbmStore } from "@/lib/tbm-store";
import { cities } from "@/components/tbm/data";

/**
 * A07 — Référentiel des villes et gares + envoi de notifications ciblées.
 */
export function CitiesPage() {
  const { toast } = useToast();
  const user = useAuthStore((s) => s.user);
  const pushAudit = useTbmStore((s) => s.pushAudit);

  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState("all");
  const [cityValue, setCityValue] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSend = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (message.trim().length < 10) {
      setError("Le message doit contenir au moins 10 caractères.");
      return;
    }
    if (target === "city" && !cityValue) {
      setError("Choisissez une ville cible.");
      return;
    }
    pushAudit({
      date: "À l’instant",
      auteur: user?.name ?? "Admin",
      role: "Session en cours",
      action: "Paramétrage",
      objet: "Notification ciblée",
      detail: `Notification « ${message.trim().slice(0, 60)}${message.trim().length > 60 ? "…" : ""} » envoyée à : ${
        target === "all" ? "tous les voyageurs" : `ville de ${cityValue}`
      }.`,
    });
    setOpen(false);
    setMessage("");
    setCityValue("");
    toast({
      title: "Notification envoyée (démo)",
      description: "Le canal SMS et push serait déclenché côté serveur en production.",
    });
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[17px] font-bold tracking-tight text-neutral-900">
            Villes &amp; Gares
          </h2>
          <p className="mt-0.5 text-[12.5px] text-neutral-400">
            A07 — Référentiel des villes et gares, notifications ciblées.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="h-9 gap-1.5 rounded-lg bg-coral-500 px-3.5 text-[13px] font-medium text-white shadow-md shadow-coral-500/30 transition-all hover:bg-coral-600 active:scale-[0.98]">
              <Send className="h-4 w-4" />
              Notification ciblée
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl sm:max-w-[440px]">
            <DialogHeader>
              <DialogTitle className="text-[16px]">Notification ciblée</DialogTitle>
              <DialogDescription className="text-[12.5px]">
                Envoyée par SMS et push aux voyageurs concernés.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSend} className="space-y-3.5" noValidate>
              <div className="space-y-1.5">
                <Label className="text-[13px]">Destinataires</Label>
                <Select value={target} onValueChange={setTarget}>
                  <SelectTrigger className="h-9.5 w-full rounded-xl border-neutral-200 focus:ring-coral-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-neutral-100">
                    <SelectItem value="all" className="rounded-lg text-[13px]">
                      Tous les voyageurs
                    </SelectItem>
                    <SelectItem value="city" className="rounded-lg text-[13px]">
                      Une ville précise
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {target === "city" && (
                <div className="space-y-1.5">
                  <Label className="text-[13px]">Ville</Label>
                  <Select value={cityValue} onValueChange={setCityValue}>
                    <SelectTrigger className="h-9.5 w-full rounded-xl border-neutral-200 focus:ring-coral-200">
                      <SelectValue placeholder="Choisir une ville…" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-neutral-100">
                      {cities.map((c) => (
                        <SelectItem key={c.id} value={c.nom} className="rounded-lg text-[13px]">
                          {c.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="notif-msg" className="text-[13px]">Message</Label>
                <Textarea
                  id="notif-msg"
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ex. : gare de Sogoniko — les départs de 14 h sont avancés à 13 h 30 ce samedi."
                  className="rounded-xl border-neutral-200 text-[13px] focus-visible:ring-coral-200"
                />
              </div>
              {error && (
                <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-[12.5px] font-medium text-rose-600">
                  {error}
                </p>
              )}
              <DialogFooter className="gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="h-9 rounded-xl border-neutral-200 text-[13px]"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="h-9 rounded-xl bg-coral-500 text-[13px] font-medium text-white shadow-md shadow-coral-500/30 hover:bg-coral-600"
                >
                  Envoyer
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
      >
        {cities.map((c) => (
          <article
            key={c.id}
            className="ff-card group rounded-2xl border border-neutral-200/70 bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-neutral-900/5"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-coral-50 text-coral-500 transition-colors group-hover:bg-coral-100">
                  <MapPin className="h-[18px] w-[18px]" />
                </span>
                <div>
                  <h3 className="text-[14.5px] font-bold tracking-tight text-neutral-900">
                    {c.nom}
                  </h3>
                  <p className="text-[11.5px] text-neutral-400">{c.region}</p>
                </div>
              </div>
              <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-neutral-500">
                {c.gares.length} gare{c.gares.length > 1 ? "s" : ""}
              </span>
            </div>
            <ul className="mt-3.5 space-y-1.5">
              {c.gares.map((g) => (
                <li key={g} className="flex items-center gap-2 text-[12.5px] text-neutral-500">
                  <Building2 className="h-3.5 w-3.5 shrink-0 text-neutral-300" />
                  {g}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </motion.div>
    </div>
  );
}
