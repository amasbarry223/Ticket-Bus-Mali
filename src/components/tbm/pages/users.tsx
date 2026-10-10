"use client";

import { useMemo, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Ban,
  Building2,
  CheckCircle2,
  Download,
  Eye,
  Hourglass,
  Lock,
  LockOpen,
  Monitor,
  Phone,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  UserCheck,
  UserCog,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/lib/auth-store";
import { useTbmStore } from "@/lib/tbm-store";
import {
  LOGIN_RESULT_META,
  ROLE_PERMISSIONS,
  USER_ROLE_META,
  USER_STATUS_META,
  type UserAccount,
  type UserRole,
  type UserStatus,
} from "@/components/tbm/data";
import { ActionIconButton } from "@/components/tbm/action-icon";
import { TablePagination } from "@/components/tbm/table-pagination";
import { useParamState, validParam } from "@/lib/use-param-state";
import { useTablePagination } from "@/lib/use-pagination";
import { cn } from "@/lib/utils";

/* ============================ Helpers ============================ */

/** Normalise une chaîne pour la recherche : minuscules, sans espaces/tirets/points. */
function normalizeKey(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\s\-.]/g, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const PRO_ROLES: UserRole[] = [
  "Agent de guichet",
  "Gestionnaire de compagnie",
  "Contrôleur",
];

/* Onglets page-level (paramètre d'URL ?tab=). */
const USER_TABS = ["comptes", "a_activer", "activite"] as const;

/** Rang antéchronologique d'une date de démo (« Aujourd'hui 09:14 », « Hier 18:40 », « 02/10 09:10 »). */
function dateRank(date: string): number {
  const t = date.match(/(\d{1,2}):(\d{2})/);
  const hhmm = t ? Number(t[1]) * 60 + Number(t[2]) : 0;
  if (date.startsWith("Aujourd")) return 4e9 + hhmm;
  if (date.startsWith("Hier")) return 3e9 + hhmm;
  const m = date.match(/^(\d{1,2})\/(\d{1,2})/);
  if (m) return (Number(m[2]) * 100 + Number(m[1])) * 1e6 + hhmm;
  return 0;
}

/** Entrée agrégée de l'onglet « Activité sensible » (échecs de connexion + actions sensibles). */
interface SensitiveEntry {
  key: string;
  userId: string;
  compte: string;
  date: string;
  kind: "echec_connexion" | "action";
  label: string;
  detail: string;
}

type DialogState =
  | { kind: "create" }
  | { kind: "activate" }
  | { kind: "block" }
  | { kind: "unblock" }
  | { kind: "role" }
  | null;

/* ======================= Petits composants ======================= */

function MiniKpi({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  hint: string;
  tone: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="ff-card flex items-center gap-3.5 rounded-2xl border border-neutral-200/70 bg-white p-4"
    >
      <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", tone)}>
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[12px] font-medium text-neutral-400">{label}</span>
        <span className="block truncate text-[15.5px] font-bold tracking-tight text-neutral-900">
          {value}
        </span>
        <span className="block truncate text-[11px] text-neutral-400">{hint}</span>
      </span>
    </motion.div>
  );
}

function RoleBadge({ role, className }: { role: UserRole; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-[11px] font-semibold",
        USER_ROLE_META[role].className,
        className
      )}
    >
      {USER_ROLE_META[role].label}
    </span>
  );
}

function StatusBadge({ statut }: { statut: UserStatus }) {
  const meta = USER_STATUS_META[statut];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold",
        meta.className
      )}
    >
      {meta.label}
    </span>
  );
}

function KindPill({ role }: { role: UserRole }) {
  const kind = USER_ROLE_META[role].kind;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10.5px] font-medium",
        kind === "professionnel"
          ? "bg-coral-50 text-coral-500"
          : "bg-neutral-100 text-neutral-500"
      )}
    >
      {kind === "professionnel" ? "Compte pro" : "Compte voyageur"}
    </span>
  );
}

/** Périmètre d'accès : compagnie cloisonnée, plateforme globale ou données personnelles. */
function ScopePill({ u, className }: { u: UserAccount; className?: string }) {
  const scope = USER_ROLE_META[u.role].scope;
  if (scope === "compagnie" && u.compagnie) {
    return (
      <span
        className={cn(
          "inline-flex max-w-[170px] items-center gap-1 rounded-md bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-600",
          className
        )}
      >
        <Building2 className="h-3 w-3 shrink-0" />
        <span className="truncate">{u.compagnie}</span>
      </span>
    );
  }
  if (scope === "global") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-600",
          className
        )}
      >
        <ShieldCheck className="h-3 w-3 shrink-0" />
        Plateforme TBM
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-500",
        className
      )}
    >
      <Smartphone className="h-3 w-3 shrink-0" />
      Ses données
    </span>
  );
}

function LoginBadge({ resultat }: { resultat: "succes" | "echec" }) {
  const meta = LOGIN_RESULT_META[resultat];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold",
        meta.className
      )}
    >
      {meta.label}
    </span>
  );
}

function Avatar({ nom, className }: { nom: string; className?: string }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[12px] font-bold text-neutral-500",
        className ?? "h-9 w-9"
      )}
    >
      {initials(nom)}
    </span>
  );
}

function InfoLine({
  label,
  value,
  mono,
}: {
  label: string;
  value?: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="shrink-0 text-[12px] text-neutral-400">{label}</span>
      <span
        className={cn(
          "min-w-0 break-words text-right text-[12.5px] font-medium text-neutral-700",
          mono && "font-mono"
        )}
      >
        {value ?? <span className="text-neutral-300">—</span>}
      </span>
    </div>
  );
}

/* ========================= Fiche utilisateur ===================== */

function UserSheet({
  user,
  open,
  onOpenChange,
  selfEmail,
  onActivate,
  onBlock,
  onUnblock,
  onRole,
}: {
  user: UserAccount | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  selfEmail: string;
  onActivate: (u: UserAccount) => void;
  onBlock: (u: UserAccount) => void;
  onUnblock: (u: UserAccount) => void;
  onRole: (u: UserAccount) => void;
}) {
  if (!user) return null;
  const isSelf = user.email === selfEmail;
  const isAdminUser = user.role === "Administrateur TBM";
  const scope = USER_ROLE_META[user.role].scope;
  const echecs = user.connexions.filter((c) => c.resultat === "echec").length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-[600px]">
        <SheetTitle className="sr-only">Compte {user.nom}</SheetTitle>
        <SheetDescription className="sr-only">
          {USER_ROLE_META[user.role].label}
          {user.compagnie ? ` — ${user.compagnie}` : ""} — statut {USER_STATUS_META[user.statut].label}.
        </SheetDescription>

        {/* En-tête */}
        <div className="sticky top-0 z-10 border-b border-neutral-100 bg-white/95 px-6 pb-4 pt-5 backdrop-blur">
          <div className="flex items-start gap-3.5">
            <Avatar nom={user.nom} className="h-12 w-12 rounded-2xl text-[14px]" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-[16px] font-bold tracking-tight text-neutral-900">
                  {user.nom}
                </h3>
                {isSelf && (
                  <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-400">
                    vous
                  </span>
                )}
                <StatusBadge statut={user.statut} />
              </div>
              <p className="mt-0.5 truncate text-[12px] text-neutral-400">
                {user.email}
                {user.telephone ? ` · ${user.telephone}` : ""}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <RoleBadge role={user.role} />
                <KindPill role={user.role} />
              </div>
            </div>
          </div>

          {/* Actions contextuelles */}
          <div className="mt-3 flex flex-wrap gap-2">
            {user.statut === "attente" && (
              <Button
                size="sm"
                className="h-8 gap-1.5 rounded-xl bg-emerald-500 text-[12.5px] font-semibold text-white hover:bg-emerald-600"
                onClick={() => onActivate(user)}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Activer le compte
              </Button>
            )}
            {user.statut === "bloque" && (
              <Button
                size="sm"
                className="h-8 gap-1.5 rounded-xl bg-emerald-500 text-[12.5px] font-semibold text-white hover:bg-emerald-600"
                onClick={() => onUnblock(user)}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Débloquer
              </Button>
            )}
            {user.statut === "actif" && !isAdminUser && !isSelf && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 rounded-xl border-rose-200 text-[12.5px] font-semibold text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                onClick={() => onBlock(user)}
              >
                <Ban className="h-3.5 w-3.5" />
                Bloquer
              </Button>
            )}
            {!isAdminUser && !isSelf && user.statut !== "attente" && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 rounded-xl border-neutral-200 text-[12.5px] font-medium text-neutral-600 shadow-none hover:border-neutral-300"
                onClick={() => onRole(user)}
              >
                <UserCog className="h-3.5 w-3.5" />
                Changer le rôle
              </Button>
            )}
            {(isAdminUser || isSelf) && (
              <span
                className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-100 px-3 py-1.5 text-[11.5px] font-semibold text-neutral-500"
                title={
                  isAdminUser
                    ? "Un administrateur TBM ne peut pas être bloqué"
                    : "Vous ne pouvez pas bloquer votre propre compte"
                }
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                {isAdminUser ? "Administrateur — protégé" : "Votre compte"}
              </span>
            )}
          </div>
        </div>

        <Tabs defaultValue="profil" className="px-6 pb-6 pt-5">
          <TabsList className="grid w-full grid-cols-3 rounded-xl bg-neutral-100 p-1">
            <TabsTrigger
              value="profil"
              className="rounded-lg text-[12.5px] font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              Profil &amp; accès
            </TabsTrigger>
            <TabsTrigger
              value="connexions"
              className="rounded-lg text-[12.5px] font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              Connexions ({user.connexions.length})
            </TabsTrigger>
            <TabsTrigger
              value="actions"
              className="rounded-lg text-[12.5px] font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              Actions ({user.actionsSensibles.length})
            </TabsTrigger>
          </TabsList>

          {/* ------- Onglet Profil & accès ------- */}
          <TabsContent value="profil" className="mt-5 space-y-5">
            {user.statut === "bloque" && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 shrink-0 text-rose-600" />
                  <p className="text-[12.5px] font-bold text-rose-700">
                    Compte bloqué{user.bloqueLe ? ` le ${user.bloqueLe}` : ""}
                    {user.bloquePar ? ` par ${user.bloquePar}` : ""}
                  </p>
                </div>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-rose-700/90">
                  {user.bloqueMotif}
                </p>
              </div>
            )}
            {user.statut === "attente" && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-center gap-2">
                  <Hourglass className="h-4 w-4 shrink-0 text-amber-600" />
                  <p className="text-[12.5px] font-bold text-amber-700">
                    En attente d&apos;activation TBM
                  </p>
                </div>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-amber-700/90">
                  Compte créé {user.creeLe.toLowerCase()}
                  {user.creePar ? ` par ${user.creePar}` : ""} — aucun accès tant
                  que le compte n&apos;est pas activé (aucune connexion possible).
                </p>
              </div>
            )}

            <section>
              <h4 className="text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-400">
                Informations du compte
              </h4>
              <div className="mt-2.5 space-y-2.5 rounded-2xl border border-neutral-200/70 p-4">
                <InfoLine label="Référence" value={user.id} mono />
                <InfoLine label="E-mail" value={user.email} />
                <InfoLine
                  label="Téléphone"
                  value={
                    user.telephone ? (
                      <a
                        href={`tel:${user.telephone.replace(/\s/g, "")}`}
                        className="font-medium text-coral-600 hover:underline"
                      >
                        {user.telephone}
                      </a>
                    ) : undefined
                  }
                />
                <InfoLine label="Rôle" value={<RoleBadge role={user.role} />} />
                <InfoLine label="Type de compte" value={<KindPill role={user.role} />} />
                <InfoLine
                  label="Compagnie"
                  value={user.compagnie ?? <span className="text-neutral-300">—</span>}
                />
                <InfoLine
                  label="Créé le"
                  value={
                    user.creePar
                      ? `${user.creeLe} · par ${user.creePar}`
                      : user.creeLe
                  }
                />
                <InfoLine
                  label="Activé le"
                  value={
                    user.activeLe
                      ? `${user.activeLe}${user.activePar ? ` · par ${user.activePar}` : ""}`
                      : undefined
                  }
                />
                <InfoLine label="Dernière connexion" value={user.derniereConnexion} />
                {echecs > 0 && (
                  <InfoLine
                    label="Connexions échouées"
                    value={
                      <span className="font-semibold text-rose-600">{echecs}</span>
                    }
                  />
                )}
              </div>
            </section>

            {/* Périmètre d'isolation des données */}
            <section>
              <h4 className="text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-400">
                Périmètre d&apos;isolation des données
              </h4>
              <div
                className={cn(
                  "mt-2.5 rounded-2xl border p-4",
                  scope === "compagnie"
                    ? "border-violet-200 bg-violet-50/70"
                    : "border-neutral-200/70 bg-neutral-50/60"
                )}
              >
                <div className="flex items-center gap-2">
                  {scope === "compagnie" ? (
                    <Building2 className="h-4 w-4 shrink-0 text-violet-600" />
                  ) : (
                    <ShieldCheck
                      className={cn(
                        "h-4 w-4 shrink-0",
                        scope === "global" ? "text-sky-600" : "text-neutral-500"
                      )}
                    />
                  )}
                  <p
                    className={cn(
                      "text-[12.5px] font-bold",
                      scope === "compagnie" ? "text-violet-700" : "text-neutral-700"
                    )}
                  >
                    {scope === "compagnie"
                      ? "Isolation stricte par compagnie"
                      : scope === "global"
                        ? "Accès à l'ensemble de la plateforme"
                        : "Ses propres données uniquement"}
                  </p>
                </div>
                <p
                  className={cn(
                    "mt-1.5 text-[12.5px] leading-relaxed",
                    scope === "compagnie" ? "text-violet-700/90" : "text-neutral-500"
                  )}
                >
                  {scope === "compagnie" && user.compagnie ? (
                    <>
                      Accès limité à « <span className="font-semibold">{user.compagnie}</span> » —
                      ce compte ne peut jamais consulter les réservations, billets,
                      ventes ni les données privées d&apos;une autre compagnie. Le
                      cloisonnement est appliqué par la plateforme, quelle que soit
                      la requête.
                    </>
                  ) : scope === "compagnie" ? (
                    <>Rôle de compagnie sans compagnie rattachée — accès ventes désactivé.</>
                  ) : scope === "global" ? (
                    <>
                      Dans la limite des droits du rôle — chaque action sensible est
                      tracée au journal d&apos;audit avec son auteur.
                    </>
                  ) : (
                    <>
                      Billets, réservations et paiements personnels du voyageur,
                      depuis l&apos;application mobile.
                    </>
                  )}
                </p>
              </div>
            </section>

            {/* Permissions du rôle */}
            <section>
              <h4 className="text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-400">
                Permissions du rôle — {USER_ROLE_META[user.role].label}
              </h4>
              <ul className="mt-2.5 space-y-2 rounded-2xl border border-neutral-200/70 p-4">
                {ROLE_PERMISSIONS[user.role].map((perm) => (
                  <li key={perm} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    <span className="text-[12.5px] leading-relaxed text-neutral-600">
                      {perm}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[11px] text-neutral-400">
                Permissions attribuées automatiquement au rôle — toute exception est
                interdite, la plateforme applique strictement cette matrice.
              </p>
            </section>
          </TabsContent>

          {/* ------- Onglet Connexions ------- */}
          <TabsContent value="connexions" className="mt-5">
            {user.connexions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-neutral-200 py-8 text-center">
                <Lock className="mx-auto h-5 w-5 text-neutral-300" />
                <p className="mt-2 text-[12.5px] text-neutral-400">
                  {user.statut === "attente"
                    ? "Aucune connexion — le compte n'est pas encore activé."
                    : "Aucune connexion enregistrée."}
                </p>
              </div>
            ) : (
              <>
                <p className="text-[11.5px] text-neutral-400">
                  Historique des connexions — IP, lieu et appareil, du plus récent
                  au plus ancien.
                </p>
                <ol className="mt-3 space-y-3.5">
                  {[...user.connexions].reverse().map((c) => (
                    <li key={c.id} className="flex gap-3">
                      <span
                        className={cn(
                          "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                          c.resultat === "succes" ? "bg-emerald-400" : "bg-rose-400"
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <LoginBadge resultat={c.resultat} />
                          <span className="text-[11.5px] font-medium text-neutral-500">
                            {c.date}
                          </span>
                        </div>
                        <p className="mt-1 text-[12.5px] text-neutral-600">
                          <span className="font-mono">{c.ip}</span> · {c.lieu}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-neutral-400">
                          <Monitor className="h-3 w-3" />
                          {c.appareil}
                        </p>
                        {c.detail && (
                          <p
                            className={cn(
                              "mt-0.5 text-[11.5px]",
                              c.resultat === "echec" ? "text-rose-500" : "text-neutral-400"
                            )}
                          >
                            {c.detail}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </>
            )}
          </TabsContent>

          {/* ------- Onglet Actions sensibles ------- */}
          <TabsContent value="actions" className="mt-5">
            {user.actionsSensibles.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-neutral-200 py-8 text-center">
                <CheckCircle2 className="mx-auto h-5 w-5 text-neutral-300" />
                <p className="mt-2 text-[12.5px] text-neutral-400">
                  Aucune action sensible — ce compte n&apos;a effectué aucune
                  opération à forte valeur.
                </p>
              </div>
            ) : (
              <>
                <p className="text-[11.5px] text-neutral-400">
                  Actions sensibles de ce compte — également inscrites au journal
                  d&apos;audit (A06) avec leur auteur.
                </p>
                <ol className="mt-3 space-y-3.5">
                  {[...user.actionsSensibles].reverse().map((a) => (
                    <li key={a.id} className="flex gap-3">
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-coral-400" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-md bg-coral-50 px-2 py-0.5 text-[11px] font-semibold text-coral-600">
                            <Activity className="h-3 w-3" />
                            {a.action}
                          </span>
                          <span className="text-[11.5px] font-medium text-neutral-500">
                            {a.date}
                          </span>
                        </div>
                        <p className="mt-1 text-[12.5px] leading-relaxed text-neutral-600">
                          {a.detail}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

/* ========================= Tableau des comptes ==================== */

/**
 * Tableau des comptes — colonne « Actions » en icônes seules (tooltip +
 * sr-only), conformément au motif ActionIconButton. Le clic sur une ligne
 * ouvre la fiche ; les actions stoppent la propagation.
 */
function UsersTable({
  rows,
  selfEmail,
  onOpen,
  onActivate,
  onBlock,
  onUnblock,
  emptyLabel,
}: {
  rows: UserAccount[];
  selfEmail: string;
  onOpen: (u: UserAccount) => void;
  onActivate: (u: UserAccount) => void;
  onBlock: (u: UserAccount) => void;
  onUnblock: (u: UserAccount) => void;
  emptyLabel: string;
}) {
  return (
    <div className="ff-scrollbar max-h-[640px] overflow-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-neutral-100 hover:bg-transparent">
            <TableHead className="sticky top-0 z-10 h-11 bg-neutral-50 pl-5 text-xs font-medium text-neutral-400">
              Utilisateur
            </TableHead>
            <TableHead className="sticky top-0 z-10 h-11 bg-neutral-50 text-xs font-medium text-neutral-400">
              Rôle
            </TableHead>
            <TableHead className="sticky top-0 z-10 h-11 bg-neutral-50 text-xs font-medium text-neutral-400">
              Périmètre
            </TableHead>
            <TableHead className="sticky top-0 z-10 h-11 bg-neutral-50 text-xs font-medium text-neutral-400">
              Statut
            </TableHead>
            <TableHead className="sticky top-0 z-10 h-11 bg-neutral-50 text-xs font-medium text-neutral-400">
              Dernière connexion
            </TableHead>
            <TableHead className="sticky top-0 z-10 h-11 bg-neutral-50 pr-5 text-right text-xs font-medium text-neutral-400">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((u) => {
            const isSelf = u.email === selfEmail;
            const isAdminUser = u.role === "Administrateur TBM";
            return (
              <TableRow
                key={u.id}
                className="cursor-pointer border-neutral-100 align-top transition-colors hover:bg-neutral-50/70"
                onClick={() => onOpen(u)}
              >
                <TableCell className="py-3.5 pl-5">
                  <div className="flex items-center gap-3">
                    <Avatar nom={u.nom} />
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-semibold text-neutral-800">
                        {u.nom}
                        {isSelf && (
                          <span className="ml-1.5 rounded bg-neutral-100 px-1 py-0.5 text-[10px] font-medium text-neutral-400">
                            vous
                          </span>
                        )}
                      </span>
                      <span className="block truncate text-[11.5px] text-neutral-400">
                        {u.telephone ?? u.email}
                      </span>
                    </span>
                  </div>
                </TableCell>
                <TableCell className="pt-3.5">
                  <RoleBadge role={u.role} />
                  <span className="mt-1 block text-[11px] text-neutral-400">
                    {USER_ROLE_META[u.role].scopeLabel}
                  </span>
                </TableCell>
                <TableCell className="pt-3.5">
                  <ScopePill u={u} />
                </TableCell>
                <TableCell className="pt-3.5">
                  <StatusBadge statut={u.statut} />
                  {u.statut === "bloque" && u.bloqueMotif && (
                    <span
                      className="mt-1 block max-w-[190px] truncate text-[11px] text-rose-400"
                      title={u.bloqueMotif}
                    >
                      {u.bloqueMotif}
                    </span>
                  )}
                  {u.statut === "attente" && (
                    <span className="mt-1 block text-[11px] text-neutral-400">
                      créé {u.creeLe.toLowerCase()}
                    </span>
                  )}
                </TableCell>
                <TableCell className="pt-3.5">
                  {u.derniereConnexion ? (
                    <span className="block text-[12.5px] text-neutral-600">
                      {u.derniereConnexion}
                    </span>
                  ) : (
                    <span className="block text-[11.5px] text-neutral-300">
                      Jamais
                    </span>
                  )}
                  {u.connexions.length > 0 && (
                    <span className="block text-[11px] text-neutral-400">
                      {u.connexions.length} connex. ·{" "}
                      {u.connexions.filter((c) => c.resultat === "echec").length} échec
                      {u.connexions.filter((c) => c.resultat === "echec").length > 1 ? "s" : ""}
                    </span>
                  )}
                </TableCell>
                <TableCell className="pr-5 pt-3.5">
                  <div className="flex items-center justify-end gap-1.5">
                    {u.statut === "attente" ? (
                      <>
                        <ActionIconButton
                          icon={Eye}
                          label="Voir la fiche"
                          onClick={() => onOpen(u)}
                        />
                        <ActionIconButton
                          icon={UserCheck}
                          tone="emerald"
                          label="Activer le compte"
                          onClick={() => onActivate(u)}
                        />
                      </>
                    ) : u.statut === "bloque" ? (
                      <>
                        <ActionIconButton
                          icon={Eye}
                          label="Voir la fiche"
                          onClick={() => onOpen(u)}
                        />
                        <ActionIconButton
                          icon={LockOpen}
                          tone="emerald"
                          label="Débloquer le compte"
                          onClick={() => onUnblock(u)}
                        />
                      </>
                    ) : isAdminUser || isSelf ? (
                      <ActionIconButton
                        icon={ShieldCheck}
                        disabled
                        label={
                          isAdminUser
                            ? "Administrateur — protégé"
                            : "Votre propre compte"
                        }
                      />
                    ) : (
                      <>
                        <ActionIconButton
                          icon={Eye}
                          label="Voir la fiche"
                          onClick={() => onOpen(u)}
                        />
                        <ActionIconButton
                          icon={Ban}
                          tone="rose"
                          label="Bloquer le compte"
                          onClick={() => onBlock(u)}
                        />
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="py-10 text-center text-[13px] text-neutral-400">
                {emptyLabel}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

/* ==================== Tableau d'activité sensible ================= */

/** Agrégat antéchronologique : échecs de connexion + actions sensibles, tous comptes. */
function ActivityTable({
  entries,
  onOpenCompte,
  emptyLabel,
}: {
  entries: SensitiveEntry[];
  onOpenCompte: (userId: string) => void;
  emptyLabel: string;
}) {
  return (
    <div className="ff-scrollbar max-h-[560px] overflow-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-neutral-100 hover:bg-transparent">
            <TableHead className="sticky top-0 z-10 h-11 bg-neutral-50 pl-5 text-xs font-medium text-neutral-400">
              Date
            </TableHead>
            <TableHead className="sticky top-0 z-10 h-11 bg-neutral-50 text-xs font-medium text-neutral-400">
              Compte
            </TableHead>
            <TableHead className="sticky top-0 z-10 h-11 bg-neutral-50 text-xs font-medium text-neutral-400">
              Type
            </TableHead>
            <TableHead className="sticky top-0 z-10 h-11 bg-neutral-50 pr-5 text-xs font-medium text-neutral-400">
              Détail
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((e) => (
            <TableRow
              key={e.key}
              className="border-neutral-100 align-top transition-colors hover:bg-neutral-50/70"
            >
              <TableCell className="py-3 pl-5 text-[12px] tabular-nums text-neutral-500">
                {e.date}
              </TableCell>
              <TableCell className="py-3">
                <div className="flex items-center gap-2.5">
                  <Avatar nom={e.compte} className="h-7 w-7 text-[10px]" />
                  <button
                    type="button"
                    onClick={() => onOpenCompte(e.userId)}
                    title={`Ouvrir la fiche de ${e.compte}`}
                    className="max-w-[160px] truncate text-[12.5px] font-semibold text-neutral-700 transition-colors hover:text-coral-600"
                  >
                    {e.compte}
                  </button>
                </div>
              </TableCell>
              <TableCell className="py-3">
                {e.kind === "echec_connexion" ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-600">
                    <ShieldAlert className="h-3 w-3" />
                    Connexion échouée
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-md bg-coral-50 px-2 py-0.5 text-[11px] font-semibold text-coral-600">
                    <Activity className="h-3 w-3" />
                    {e.label}
                  </span>
                )}
              </TableCell>
              <TableCell className="max-w-[360px] py-3 pr-5">
                <span
                  className="block truncate text-[12.5px] text-neutral-600"
                  title={e.detail}
                >
                  {e.detail}
                </span>
              </TableCell>
            </TableRow>
          ))}
          {entries.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="py-10 text-center text-[13px] text-neutral-400">
                {emptyLabel}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

/* ============================== Page ============================= */

export function UsersPage() {
  const { toast } = useToast();
  const user = useAuthStore((s) => s.user);
  const auteur = user?.name ?? "Opérateur";
  const roleLabel = user?.role === "admin" ? "Administrateur TBM" : "Support TBM";
  const selfEmail = user?.email ?? "";

  const users = useTbmStore((s) => s.users);
  const companies = useTbmStore((s) => s.companies);
  const createProAccount = useTbmStore((s) => s.createProAccount);
  const activateUser = useTbmStore((s) => s.activateUser);
  const blockUser = useTbmStore((s) => s.blockUser);
  const unblockUser = useTbmStore((s) => s.unblockUser);
  const changeUserRole = useTbmStore((s) => s.changeUserRole);

  // Onglet page-level + fiche détail synchronisés aux paramètres d'URL (?tab=, ?sel=)
  const [tabParam, setTabParam] = useParamState("tab", "comptes");
  const tab = validParam(tabParam, USER_TABS, "comptes");
  const [selParam, setSel] = useParamState("sel", "");

  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statutFilter, setStatutFilter] = useState<string>("all");
  const [compagnieFilter, setCompagnieFilter] = useState<string>("all");
  const [dialog, setDialog] = useState<DialogState>(null);

  // Formulaire de création
  const [formNom, setFormNom] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formTel, setFormTel] = useState("");
  const [formRole, setFormRole] = useState<UserRole>("Agent de guichet");
  const [formCompagnie, setFormCompagnie] = useState("");

  // Blocage / changement de rôle
  const [motif, setMotif] = useState("");
  const [justification, setJustification] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("Agent de guichet");
  const [error, setError] = useState<string | null>(null);

  // Fiche dérivée du store par id (live) — les badges suivent les actions.
  const selected = selParam
    ? users.find((u) => u.id === selParam) ?? null
    : null;
  const openSheet = (u: UserAccount) => setSel(u.id);
  const closeSheet = () => setSel("");

  const compagnieNames = useMemo(
    () => companies.map((c) => c.nom).sort((a, b) => a.localeCompare(b, "fr")),
    [companies]
  );

  const filtered = useMemo(() => {
    const q = normalizeKey(query);
    return users.filter((u) => {
      const kind = USER_ROLE_META[u.role].kind;
      if (kindFilter !== "all" && kind !== kindFilter) return false;
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (statutFilter !== "all" && u.statut !== statutFilter) return false;
      if (compagnieFilter !== "all" && u.compagnie !== compagnieFilter)
        return false;
      if (q === "") return true;
      const hay = normalizeKey(
        [u.id, u.nom, u.email, u.telephone ?? "", u.compagnie ?? "", u.role].join(" ")
      );
      return hay.includes(q);
    });
  }, [users, query, kindFilter, roleFilter, statutFilter, compagnieFilter]);

  /** Sous-liste « À activer » : comptes en attente (recherche normalisée appliquée). */
  const aActiver = useMemo(() => {
    const q = normalizeKey(query);
    return users.filter((u) => {
      if (u.statut !== "attente") return false;
      if (q === "") return true;
      const hay = normalizeKey(
        [u.id, u.nom, u.email, u.telephone ?? "", u.compagnie ?? "", u.role].join(" ")
      );
      return hay.includes(q);
    });
  }, [users, query]);

  /**
   * Agrégat antéchronologique (onglet « Activité sensible ») : connexions
   * échouées et actions sensibles de tous les comptes, du plus récent au plus
   * ancien, filtrés par la recherche.
   */
  const activite = useMemo<SensitiveEntry[]>(() => {
    const entries: SensitiveEntry[] = [];
    for (const u of users) {
      for (const c of u.connexions) {
        if (c.resultat !== "echec") continue;
        entries.push({
          key: `${u.id}-${c.id}`,
          userId: u.id,
          compte: u.nom,
          date: c.date,
          kind: "echec_connexion",
          label: "Connexion échouée",
          detail: c.detail ?? `${c.ip} · ${c.lieu}`,
        });
      }
      for (const a of u.actionsSensibles) {
        entries.push({
          key: `${u.id}-${a.id}`,
          userId: u.id,
          compte: u.nom,
          date: a.date,
          kind: "action",
          label: a.action,
          detail: a.detail,
        });
      }
    }
    entries.sort((x, y) => dateRank(y.date) - dateRank(x.date));
    const q = normalizeKey(query);
    if (q === "") return entries;
    return entries.filter((e) =>
      normalizeKey([e.compte, e.label, e.detail].join(" ")).includes(q)
    );
  }, [users, query]);

  // Pagination des listes — hook partagé (reset à la page 1 quand filtres/onglet changent)
  const comptesPg = useTablePagination(filtered, {
    resetKey: [query, kindFilter, roleFilter, statutFilter, compagnieFilter, tab].join("|"),
  });
  const aActiverPg = useTablePagination(aActiver, {
    resetKey: [query, tab].join("|"),
  });
  const activitePg = useTablePagination(activite, { resetKey: [query, tab].join("|") });

  const searchInput = (
    <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Nom, e-mail, téléphone, compagnie, réf…"
        aria-label="Rechercher un utilisateur"
        className="h-9 rounded-xl border-neutral-200 bg-white pl-9 text-[13px] focus-visible:ring-coral-200"
      />
    </div>
  );

  const enAttente = users.filter((u) => u.statut === "attente");
  const bloques = users.filter((u) => u.statut === "bloque");
  const voyageurs = users.filter((u) => USER_ROLE_META[u.role].kind === "voyageur");
  const pros = users.length - voyageurs.length;
  const echecsRecents = users.reduce(
    (s, u) => s + u.connexions.filter((c) => c.resultat === "echec").length,
    0
  );

  const openCreate = () => {
    setFormNom("");
    setFormEmail("");
    setFormTel("");
    setFormRole("Agent de guichet");
    setFormCompagnie("");
    setDialog({ kind: "create" });
    setError(null);
  };
  const openActivate = (u: UserAccount) => {
    setSel(u.id);
    setDialog({ kind: "activate" });
    setError(null);
  };
  const openBlock = (u: UserAccount) => {
    setSel(u.id);
    setDialog({ kind: "block" });
    setMotif("");
    setError(null);
  };
  const openUnblock = (u: UserAccount) => {
    setSel(u.id);
    setDialog({ kind: "unblock" });
    setError(null);
  };
  const openRole = (u: UserAccount) => {
    setSel(u.id);
    setDialog({ kind: "role" });
    setJustification("");
    setNewRole(u.role === "Agent de guichet" ? "Gestionnaire de compagnie" : "Agent de guichet");
    setError(null);
  };
  const closeDialog = () => {
    setDialog(null);
    setError(null);
  };

  const confirmCreate = () => {
    if (formNom.trim().length < 3) {
      setError("Nom complet obligatoire (3 caractères minimum).");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(formEmail.trim())) {
      setError("E-mail professionnel invalide — ex. prenom.nom@compagnie.ml");
      return;
    }
    if (formTel.replace(/\D/g, "").length < 8) {
      setError("Téléphone obligatoire (8 chiffres minimum) — le mot de passe provisoire y sera envoyé.");
      return;
    }
    if (!formCompagnie) {
      setError("Compagnie obligatoire — le compte sera cloisonné aux données de cette compagnie uniquement.");
      return;
    }
    createProAccount(
      {
        nom: formNom,
        email: formEmail,
        telephone: formTel,
        role: formRole,
        compagnie: formCompagnie,
      },
      auteur,
      roleLabel
    );
    toast({
      title: "Compte professionnel créé",
      description: `${formNom.trim()} — en attente d'activation, aucun accès tant que le compte n'est pas activé.`,
    });
    closeDialog();
  };

  const confirmActivate = () => {
    if (!selected) return;
    activateUser(selected.id, auteur, roleLabel);
    toast({
      title: "Compte activé",
      description: `${selected.nom} — mot de passe provisoire envoyé par SMS, action tracée au journal d'audit.`,
    });
    closeDialog();
  };

  const confirmBlock = () => {
    if (!selected) return;
    if (motif.trim().length < 10) {
      setError(
        "Motif obligatoire (10 caractères minimum) — il sera tracé au journal d'audit et visible dans la fiche du compte."
      );
      return;
    }
    blockUser(selected.id, motif, auteur, roleLabel);
    toast({
      title: "Compte bloqué",
      description: `${selected.nom} — accès retiré immédiatement, action tracée au journal d'audit.`,
    });
    closeDialog();
  };

  const confirmUnblock = () => {
    if (!selected) return;
    unblockUser(selected.id, auteur, roleLabel);
    toast({
      title: "Compte débloqué",
      description: `${selected.nom} — accès rétabli après vérification de l'identité.`,
    });
    closeDialog();
  };

  const confirmRole = () => {
    if (!selected) return;
    const scopeCible = USER_ROLE_META[newRole].scope;
    if (scopeCible === "compagnie" && !selected.compagnie) {
      setError(
        "Ce compte n'est rattaché à aucune compagnie — un rôle de compagnie exige un cloisonnement. Rattachez d'abord le compte à une compagnie."
      );
      return;
    }
    if (justification.trim().length < 10) {
      setError(
        "Justification obligatoire (10 caractères minimum) — elle sera citée au journal d'audit avec votre nom."
      );
      return;
    }
    changeUserRole(selected.id, newRole, justification, auteur, roleLabel);
    toast({
      title: "Rôle modifié",
      description: `${selected.nom} — ${USER_ROLE_META[selected.role].label} → ${USER_ROLE_META[newRole].label}, périmètre recalculé.`,
    });
    closeDialog();
  };

  const exportCsv = () => {
    const header = [
      "Reference",
      "Nom",
      "Email",
      "Telephone",
      "Role",
      "Type",
      "Compagnie",
      "Statut",
      "Motif de blocage",
      "Cree le",
      "Active le",
      "Derniere connexion",
      "Connexions",
      "Echecs connexion",
      "Actions sensibles",
    ].join(";");
    const rows = filtered.map((u) =>
      [
        u.id,
        u.nom,
        u.email,
        u.telephone ?? "",
        u.role,
        USER_ROLE_META[u.role].kind,
        u.compagnie ?? "",
        USER_STATUS_META[u.statut].label,
        u.bloqueMotif ?? "",
        u.creeLe,
        u.activeLe ?? "",
        u.derniereConnexion ?? "",
        u.connexions.length,
        u.connexions.filter((c) => c.resultat === "echec").length,
        u.actionsSensibles.length,
      ]
        .map((c) => String(c).replace(/;/g, ","))
        .join(";")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "tbm-utilisateurs-acces.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast({
      title: "Export CSV généré",
      description: `${filtered.length} compte(s) exporté(s) — rôles, périmètres et historiques inclus.`,
    });
  };

  return (
    <div>
      {/* En-tête */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[17px] font-bold tracking-tight text-neutral-900">
            Utilisateurs &amp; accès
          </h2>
          <p className="mt-0.5 text-[12.5px] text-neutral-400">
            A05 — Comptes voyageurs et professionnels, rôles et permissions, isolation par compagnie.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={openCreate}
            className="h-9 gap-1.5 rounded-xl bg-coral-500 px-3.5 text-[12.5px] font-semibold text-white shadow-sm hover:bg-coral-600"
          >
            <Plus className="h-4 w-4" />
            Compte professionnel
          </Button>
          <Button
            variant="outline"
            onClick={exportCsv}
            className="h-9 gap-1.5 rounded-xl border-neutral-200 text-[12.5px] font-medium shadow-none hover:border-neutral-300"
          >
            <Download className="h-4 w-4 text-neutral-400" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Bandeau droits + isolation */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border border-neutral-200/70 bg-neutral-50/60 px-4 py-3"
      >
        <span className="flex items-center gap-2 text-[12px] font-semibold text-neutral-600">
          <ShieldCheck className="h-4 w-4 text-coral-500" />
          Vos droits (administration) :
        </span>
        <ul className="flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-neutral-500">
          <li className="flex items-center gap-1.5">
            <span className="h-1 w-1 rounded-full bg-neutral-300" />
            Créer et activer les comptes professionnels
          </li>
          <li className="flex items-center gap-1.5">
            <span className="h-1 w-1 rounded-full bg-neutral-300" />
            Bloquer / débloquer tout compte (sauf administrateurs)
          </li>
          <li className="flex items-center gap-1.5">
            <span className="h-1 w-1 rounded-full bg-neutral-300" />
            Modifier les rôles — justification tracée
          </li>
          <li className="flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 shrink-0 text-violet-500" />
            Isolation : un compte de compagnie ne voit jamais les données d&apos;une autre compagnie
          </li>
        </ul>
      </motion.div>

      {/* KPIs */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MiniKpi
          icon={Users}
          label="Comptes"
          value={`${users.length}`}
          hint={`${voyageurs.length} voyageurs · ${pros} professionnels`}
          tone="bg-coral-100 text-coral-600"
        />
        <MiniKpi
          icon={Hourglass}
          label="À activer"
          value={`${enAttente.length}`}
          hint="comptes pro créés, sans accès"
          tone="bg-amber-100 text-amber-600"
        />
        <MiniKpi
          icon={Ban}
          label="Bloqués"
          value={`${bloques.length}`}
          hint="accès suspendus, motif tracé"
          tone="bg-rose-100 text-rose-600"
        />
        <MiniKpi
          icon={ShieldAlert}
          label="Connexions échouées"
          value={`${echecsRecents}`}
          hint="7 derniers jours — surveillance"
          tone="bg-violet-100 text-violet-600"
        />
      </div>

      {/* Onglets page-level — synchronisés au paramètre d'URL ?tab= */}
      <Tabs value={tab} onValueChange={setTabParam} className="mt-5">
        <TabsList className="h-10 w-full justify-start gap-1 overflow-x-auto rounded-xl border border-neutral-200/70 bg-neutral-50/60 p-1 ff-scrollbar sm:w-auto">
          <TabsTrigger
            value="comptes"
            className="gap-1.5 rounded-lg px-3.5 text-[12.5px] data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Users className="h-3.5 w-3.5" />
            Comptes
            <span className="rounded-md bg-neutral-200/80 px-1.5 py-px text-[10.5px] font-semibold text-neutral-500">
              {users.length}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="a_activer"
            className="gap-1.5 rounded-lg px-3.5 text-[12.5px] data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Hourglass className="h-3.5 w-3.5" />
            À activer
            <span
              className={cn(
                "rounded-md px-1.5 py-px text-[10.5px] font-semibold",
                enAttente.length > 0
                  ? "bg-amber-100 text-amber-600"
                  : "bg-neutral-200/80 text-neutral-500"
              )}
            >
              {enAttente.length}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="activite"
            className="gap-1.5 rounded-lg px-3.5 text-[12.5px] data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            Activité sensible
            <span
              className={cn(
                "rounded-md px-1.5 py-px text-[10.5px] font-semibold",
                activite.length > 0
                  ? "bg-violet-100 text-violet-600"
                  : "bg-neutral-200/80 text-neutral-500"
              )}
            >
              {activite.length}
            </span>
          </TabsTrigger>
        </TabsList>

        {/* ----- Onglet Comptes : liste complète + filtres ----- */}
        <TabsContent value="comptes" className="mt-4">
          <div className="flex flex-wrap items-center gap-2.5">
            {searchInput}
            <Select value={kindFilter} onValueChange={setKindFilter}>
              <SelectTrigger
                aria-label="Filtrer par type de compte"
                className="h-9 w-[150px] rounded-xl border-neutral-200 bg-white text-[13px] shadow-none hover:border-neutral-300"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-neutral-100">
                <SelectItem value="all" className="rounded-lg text-[13px]">Tous comptes</SelectItem>
                <SelectItem value="voyageur" className="rounded-lg text-[13px]">Voyageurs</SelectItem>
                <SelectItem value="professionnel" className="rounded-lg text-[13px]">Professionnels</SelectItem>
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger
                aria-label="Filtrer par rôle"
                className="h-9 w-[170px] rounded-xl border-neutral-200 bg-white text-[13px] shadow-none hover:border-neutral-300"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-neutral-100">
                <SelectItem value="all" className="rounded-lg text-[13px]">Tous rôles</SelectItem>
                {(Object.keys(USER_ROLE_META) as UserRole[]).map((r) => (
                  <SelectItem key={r} value={r} className="rounded-lg text-[13px]">
                    {USER_ROLE_META[r].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statutFilter} onValueChange={setStatutFilter}>
              <SelectTrigger
                aria-label="Filtrer par statut"
                className="h-9 w-[140px] rounded-xl border-neutral-200 bg-white text-[13px] shadow-none hover:border-neutral-300"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-neutral-100">
                <SelectItem value="all" className="rounded-lg text-[13px]">Tous statuts</SelectItem>
                {(Object.keys(USER_STATUS_META) as UserStatus[]).map((s) => (
                  <SelectItem key={s} value={s} className="rounded-lg text-[13px]">
                    {USER_STATUS_META[s].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={compagnieFilter} onValueChange={setCompagnieFilter}>
              <SelectTrigger
                aria-label="Filtrer par compagnie"
                className="h-9 w-[160px] rounded-xl border-neutral-200 bg-white text-[13px] shadow-none hover:border-neutral-300"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-neutral-100">
                <SelectItem value="all" className="rounded-lg text-[13px]">Toutes compagnies</SelectItem>
                {compagnieNames.map((c) => (
                  <SelectItem key={c} value={c} className="rounded-lg text-[13px]">
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="ml-auto text-[12px] text-neutral-400">
              {filtered.length} compte{filtered.length > 1 ? "s" : ""}
            </span>
          </div>
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="ff-card mt-3 overflow-hidden rounded-2xl border border-neutral-200/70 bg-white"
          >
            <UsersTable
              rows={comptesPg.pageItems}
              selfEmail={selfEmail}
              onOpen={openSheet}
              onActivate={openActivate}
              onBlock={openBlock}
              onUnblock={openUnblock}
              emptyLabel="Aucun compte ne correspond à ces filtres."
            />
            <TablePagination
              page={comptesPg.page}
              pageCount={comptesPg.pageCount}
              onPageChange={comptesPg.setPage}
              total={comptesPg.total}
              from={comptesPg.from}
              to={comptesPg.to}
              pageSize={comptesPg.pageSize}
              onPageSizeChange={comptesPg.setPageSize}
              entity="compte"
            />
          </motion.section>
        </TabsContent>

        {/* ----- Onglet À activer : comptes professionnels en attente ----- */}
        <TabsContent value="a_activer" className="mt-4">
          <div className="flex flex-wrap items-center gap-2.5">
            {searchInput}
            <span className="ml-auto text-[12px] text-neutral-400">
              {aActiver.length} compte{aActiver.length > 1 ? "s" : ""} en attente
            </span>
          </div>
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="ff-card mt-3 overflow-hidden rounded-2xl border border-neutral-200/70 bg-white"
          >
            <UsersTable
              rows={aActiverPg.pageItems}
              selfEmail={selfEmail}
              onOpen={openSheet}
              onActivate={openActivate}
              onBlock={openBlock}
              onUnblock={openUnblock}
              emptyLabel={
                query.trim() !== ""
                  ? "Aucun compte à activer ne correspond à cette recherche."
                  : "Aucun compte en attente — tous les comptes professionnels ont accès à leur périmètre."
              }
            />
            <TablePagination
              page={aActiverPg.page}
              pageCount={aActiverPg.pageCount}
              onPageChange={aActiverPg.setPage}
              total={aActiverPg.total}
              from={aActiverPg.from}
              to={aActiverPg.to}
              pageSize={aActiverPg.pageSize}
              onPageSizeChange={aActiverPg.setPageSize}
              entity="compte"
            />
            <div className="flex flex-wrap items-center gap-2 border-t border-neutral-100 px-5 py-3">
              <Hourglass className="h-3.5 w-3.5 shrink-0 text-neutral-300" aria-hidden="true" />
              <p className="text-[11.5px] text-neutral-400">
                Créés par le support, ces comptes n&apos;ont aucun accès tant que TBM ne les
                active pas — l&apos;activation envoie un mot de passe provisoire par SMS.
              </p>
            </div>
          </motion.section>
        </TabsContent>

        {/* ----- Onglet Activité sensible : agrégat antéchronologique ----- */}
        <TabsContent value="activite" className="mt-4">
          <div className="flex flex-wrap items-center gap-2.5">
            {searchInput}
            <span className="ml-auto text-[12px] text-neutral-400">
              {activite.length} entrée{activite.length > 1 ? "s" : ""}
            </span>
          </div>
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="ff-card mt-3 overflow-hidden rounded-2xl border border-neutral-200/70 bg-white"
          >
            <ActivityTable
              entries={activitePg.pageItems}
              onOpenCompte={setSel}
              emptyLabel={
                query.trim() !== ""
                  ? "Aucune activité sensible ne correspond à cette recherche."
                  : "Aucune activité sensible — aucun échec de connexion ni action à forte valeur enregistré."
              }
            />
            <TablePagination
              page={activitePg.page}
              pageCount={activitePg.pageCount}
              onPageChange={activitePg.setPage}
              total={activitePg.total}
              from={activitePg.from}
              to={activitePg.to}
              pageSize={activitePg.pageSize}
              onPageSizeChange={activitePg.setPageSize}
              entity="événement"
            />
            <div className="flex flex-wrap items-center gap-2 border-t border-neutral-100 px-5 py-3">
              <Activity className="h-3.5 w-3.5 shrink-0 text-neutral-300" aria-hidden="true" />
              <p className="text-[11.5px] text-neutral-400">
                Connexions échouées et actions sensibles de tous les comptes, de la plus
                récente à la plus ancienne — chaque action est également inscrite au
                journal d&apos;audit (A06).
              </p>
            </div>
          </motion.section>
        </TabsContent>
      </Tabs>

      {/* Fiche utilisateur */}
      <UserSheet
        user={selected}
        open={selected != null}
        onOpenChange={(v) => {
          if (!v) closeSheet();
        }}
        selfEmail={selfEmail}
        onActivate={openActivate}
        onBlock={openBlock}
        onUnblock={openUnblock}
        onRole={openRole}
      />

      {/* Dialog : création de compte professionnel */}
      <Dialog
        open={dialog?.kind === "create"}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent className="rounded-2xl sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[16px]">
              <Plus className="h-4 w-4 text-coral-500" />
              Créer un compte professionnel
            </DialogTitle>
            <DialogDescription className="text-[12.5px] leading-relaxed">
              Le compte est créé « à activer » : aucun accès tant que TBM ne
              l&apos;active pas. Il sera strictement cloisonné aux données de sa
              compagnie.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3.5 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="usr-nom" className="text-[12.5px] text-neutral-600">
                Nom complet *
              </Label>
              <Input
                id="usr-nom"
                value={formNom}
                onChange={(e) => setFormNom(e.target.value)}
                placeholder="ex. Seydou BÂ"
                className="h-9.5 rounded-xl border-neutral-200 focus-visible:ring-coral-200"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="usr-email" className="text-[12.5px] text-neutral-600">
                E-mail professionnel *
              </Label>
              <Input
                id="usr-email"
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="prenom.nom@compagnie.ml"
                className="h-9.5 rounded-xl border-neutral-200 focus-visible:ring-coral-200"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="usr-tel" className="text-[12.5px] text-neutral-600">
                Téléphone * <span className="font-normal text-neutral-400">(SMS du mot de passe provisoire)</span>
              </Label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
                <Input
                  id="usr-tel"
                  value={formTel}
                  onChange={(e) => setFormTel(e.target.value)}
                  placeholder="+223 76 00 00 00"
                  className="h-9.5 rounded-xl border-neutral-200 pl-9 focus-visible:ring-coral-200"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[12.5px] text-neutral-600">Rôle *</Label>
                <Select value={formRole} onValueChange={(v) => setFormRole(v as UserRole)}>
                  <SelectTrigger className="h-9.5 w-full rounded-xl border-neutral-200 text-[13px] shadow-none hover:border-neutral-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-neutral-100">
                    {PRO_ROLES.map((r) => (
                      <SelectItem key={r} value={r} className="rounded-lg text-[13px]">
                        {USER_ROLE_META[r].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12.5px] text-neutral-600">Compagnie *</Label>
                <Select value={formCompagnie} onValueChange={setFormCompagnie}>
                  <SelectTrigger className="h-9.5 w-full rounded-xl border-neutral-200 text-[13px] shadow-none hover:border-neutral-300">
                    <SelectValue placeholder="Choisir…" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-neutral-100">
                    {compagnieNames.map((c) => (
                      <SelectItem key={c} value={c} className="rounded-lg text-[13px]">
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="rounded-xl bg-violet-50 px-3 py-2.5 text-[11.5px] leading-relaxed text-violet-700">
              <Building2 className="mr-1.5 inline h-3.5 w-3.5" />
              Le compte ne verra jamais les données privées des autres compagnies —
              isolation appliquée par la plateforme.
            </p>
            {error && (
              <p className="rounded-xl bg-rose-50 px-3 py-2 text-[12px] font-medium text-rose-600">
                {error}
              </p>
            )}
          </div>
          <DialogFooter className="gap-2 pt-1">
            <Button variant="outline" onClick={closeDialog} className="h-9 rounded-xl border-neutral-200 shadow-none">
              Annuler
            </Button>
            <Button onClick={confirmCreate} className="h-9 rounded-xl bg-coral-500 font-semibold text-white hover:bg-coral-600">
              Créer le compte
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog : activation */}
      <Dialog
        open={dialog?.kind === "activate" && selected != null}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent className="rounded-2xl sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[16px]">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Activer le compte
            </DialogTitle>
            <DialogDescription className="text-[12.5px] leading-relaxed">
              Vérifiez l&apos;identité du titulaire avant activation — l&apos;action
              est tracée au journal d&apos;audit avec votre nom.
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 py-1">
              <div className="flex items-center gap-3 rounded-2xl border border-neutral-200/70 p-3.5">
                <Avatar nom={selected.nom} />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-neutral-800">
                    {selected.nom}
                  </p>
                  <p className="truncate text-[11.5px] text-neutral-400">
                    {selected.email}
                  </p>
                </div>
              </div>
              <div className="space-y-2 rounded-2xl bg-neutral-50/70 p-3.5 text-[12.5px] text-neutral-600">
                <p>
                  Rôle : <span className="font-semibold text-neutral-800">{selected.role}</span>
                  {selected.compagnie && (
                    <>
                      {" "}— périmètre «{" "}
                      <span className="font-semibold text-violet-600">{selected.compagnie}</span>{" "}
                      » uniquement
                    </>
                  )}
                </p>
                <p>
                  Un mot de passe provisoire sera envoyé par SMS
                  {selected.telephone ? (
                    <> au <span className="font-semibold">{selected.telephone}</span>.</>
                  ) : (
                    "."
                  )}
                </p>
                <p className="text-[11.5px] text-neutral-400">
                  Le compte accèdera immédiatement à son périmètre ; il est invité à
                  changer son mot de passe à la première connexion.
                </p>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 pt-1">
            <Button variant="outline" onClick={closeDialog} className="h-9 rounded-xl border-neutral-200 shadow-none">
              Annuler
            </Button>
            <Button onClick={confirmActivate} className="h-9 rounded-xl bg-emerald-500 font-semibold text-white hover:bg-emerald-600">
              Activer le compte
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog : blocage */}
      <Dialog
        open={dialog?.kind === "block" && selected != null}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent className="rounded-2xl sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[16px]">
              <Ban className="h-4 w-4 text-rose-500" />
              Bloquer le compte
            </DialogTitle>
            <DialogDescription className="text-[12.5px] leading-relaxed">
              Le compte perdra immédiatement l&apos;accès au back-office et à
              l&apos;application mobile.
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 py-1">
              <div className="flex items-center gap-3 rounded-2xl border border-neutral-200/70 p-3.5">
                <Avatar nom={selected.nom} />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-neutral-800">
                    {selected.nom}
                  </p>
                  <p className="truncate text-[11.5px] text-neutral-400">
                    {selected.role}
                    {selected.compagnie ? ` · ${selected.compagnie}` : ""}
                  </p>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="usr-motif" className="text-[12.5px] text-neutral-600">
                  Motif du blocage * <span className="font-normal text-neutral-400">(obligatoire, tracé)</span>
                </Label>
                <Textarea
                  id="usr-motif"
                  value={motif}
                  onChange={(e) => setMotif(e.target.value)}
                  placeholder="ex. Activité suspecte détectée sur les ventes — vérification requise avant rétablissement."
                  className="min-h-[84px] rounded-xl border-neutral-200 text-[13px] focus-visible:ring-coral-200"
                />
                <p className="text-[11px] text-neutral-400">
                  Le motif sera tracé au journal d&apos;audit (A06) et visible dans la
                  fiche du compte.
                </p>
              </div>
              {error && (
                <p className="rounded-xl bg-rose-50 px-3 py-2 text-[12px] font-medium text-rose-600">
                  {error}
                </p>
              )}
            </div>
          )}
          <DialogFooter className="gap-2 pt-1">
            <Button variant="outline" onClick={closeDialog} className="h-9 rounded-xl border-neutral-200 shadow-none">
              Annuler
            </Button>
            <Button onClick={confirmBlock} className="h-9 rounded-xl bg-rose-500 font-semibold text-white hover:bg-rose-600">
              Bloquer le compte
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog : déblocage */}
      <Dialog
        open={dialog?.kind === "unblock" && selected != null}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent className="rounded-2xl sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[16px]">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              Débloquer le compte
            </DialogTitle>
            <DialogDescription className="text-[12.5px] leading-relaxed">
              Après vérification de l&apos;identité du titulaire, l&apos;accès sera
              rétabli. Les échecs de connexion restent visibles dans
              l&apos;historique.
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="flex items-center gap-3 rounded-2xl border border-neutral-200/70 p-3.5">
              <Avatar nom={selected.nom} />
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-neutral-800">
                  {selected.nom}
                </p>
                <p className="truncate text-[11.5px] text-neutral-400">
                  {selected.role}
                  {selected.compagnie ? ` · ${selected.compagnie}` : ""}
                </p>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 pt-1">
            <Button variant="outline" onClick={closeDialog} className="h-9 rounded-xl border-neutral-200 shadow-none">
              Annuler
            </Button>
            <Button onClick={confirmUnblock} className="h-9 rounded-xl bg-emerald-500 font-semibold text-white hover:bg-emerald-600">
              Débloquer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog : changement de rôle */}
      <Dialog
        open={dialog?.kind === "role" && selected != null}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent className="rounded-2xl sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[16px]">
              <UserCog className="h-4 w-4 text-coral-500" />
              Changer le rôle
            </DialogTitle>
            <DialogDescription className="text-[12.5px] leading-relaxed">
              Les permissions et le périmètre d&apos;isolation sont recalculés
              automatiquement à partir du nouveau rôle.
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-3.5 py-1">
              <div className="flex items-center gap-3 rounded-2xl border border-neutral-200/70 p-3.5">
                <Avatar nom={selected.nom} />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-neutral-800">
                    {selected.nom}
                  </p>
                  <p className="truncate text-[11.5px] text-neutral-400">
                    Rôle actuel : {selected.role}
                  </p>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12.5px] text-neutral-600">Nouveau rôle *</Label>
                <Select value={newRole} onValueChange={(v) => setNewRole(v as UserRole)}>
                  <SelectTrigger className="h-9.5 w-full rounded-xl border-neutral-200 text-[13px] shadow-none hover:border-neutral-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-neutral-100">
                    {(Object.keys(USER_ROLE_META) as UserRole[])
                      .filter((r) => r !== selected.role)
                      .map((r) => (
                        <SelectItem key={r} value={r} className="rounded-lg text-[13px]">
                          {USER_ROLE_META[r].label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-neutral-400">
                  Périmètre cible : {USER_ROLE_META[newRole].scopeLabel.toLowerCase()}.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="usr-justif" className="text-[12.5px] text-neutral-600">
                  Justification * <span className="font-normal text-neutral-400">(obligatoire, tracée)</span>
                </Label>
                <Textarea
                  id="usr-justif"
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="ex. Promotion suite au départ de l'ancien gestionnaire — validé par la direction."
                  className="min-h-[84px] rounded-xl border-neutral-200 text-[13px] focus-visible:ring-coral-200"
                />
                <p className="text-[11px] text-neutral-400">
                  La justification sera citée au journal d&apos;audit (A06) avec votre
                  nom.
                </p>
              </div>
              {error && (
                <p className="rounded-xl bg-rose-50 px-3 py-2 text-[12px] font-medium text-rose-600">
                  {error}
                </p>
              )}
            </div>
          )}
          <DialogFooter className="gap-2 pt-1">
            <Button variant="outline" onClick={closeDialog} className="h-9 rounded-xl border-neutral-200 shadow-none">
              Annuler
            </Button>
            <Button onClick={confirmRole} className="h-9 rounded-xl bg-coral-500 font-semibold text-white hover:bg-coral-600">
              Modifier le rôle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
