# Worklog

---
Task ID: 1
Agent: Z.ai Code (main)
Task: Implémentation frontend du dashboard FiscalFlow (réplication fidèle du design fourni, modernisé)

Work Log:
- Analyse de la maquette fournie (sidebar FiscalFlow, 4 KPI cards, Cash Flow Analytics, Financial Balance donut, Recent Transactions, Tax Liabilities)
- Génération de l'avatar 3D style memoji via le skill image-generation (CLI z-ai) → public/avatar-jack.png
- Configuration du thème dans src/app/globals.css : palette coral-50→900, couleurs de chart (flipurple/fliorange/fligreen/fliviolet), scrollbar custom (.ff-scrollbar), ombre de carte (.ff-card), animations (ff-donut-in, ff-progress-in, ff-ping)
- Création de src/components/dashboard/data.ts : datasets mockés (flow weekly/monthly/yearly, kpis, transactions, taxes, balanceSegments)
- Création de src/components/dashboard/logo.tsx : LogoMark SVG (dégradé coral, swoosh + coin)
- Création de src/components/dashboard/sidebar.tsx : nav avec stagger framer-motion, badges, sous-menu Account collapsible, mode collapsed (icônes seules, badges en points), carte utilisateur Jack Williams, recherche avec ⌘F
- Création de src/components/dashboard/header.tsx : breadcrumb Spendly > Dashboard, tabs Overview/Order/Sales, refresh animé, select mois (October), bouton Download coral avec toast (use-toast)
- Création de src/components/dashboard/stats-cards.tsx : 4 KPI (Total Balance $16,745, Total Saving $5,981, Revenue $9,116, Credit $4,872), badges up/down, icônes tintées au hover
- Création de src/components/dashboard/cash-flow-chart.tsx : recharts LineChart 2 courbes (income violet #a78bfa, expense orange #f59e0b), tooltip custom épinglé par défaut sur August (18 August 2024, Income $892, Expense $374), curseur pointillé, tick actif en gras, dot actif avec effet ping, changement Weekly/Monthly/Yearly avec données distinctes
- Création de src/components/dashboard/financial-balance.tsx : donut SVG custom (45% vert / 33% orange / 22% violet), centre 48% "From Yesterday", hover segments + légende → centre dynamique + épaississement du trait, animation d'apparition
- Création de src/components/dashboard/recent-transactions.tsx : table shadcn (SPD-0051→0054), pills Paid/Pending, header gris, hover rows
- Création de src/components/dashboard/tax-liabilities.tsx : 32.872,00, select Yearly, 3 barres de progression animées (44/36/20 %) en dégradés coral
- Assemblage dans src/app/page.tsx : layout app-shell (sidebar sticky + main), sidebar collapsible via motion.aside (264px ↔ 88px), topbar mobile sticky avec Sheet (menu latéral), grille responsive (KPI 1/2/4 colonnes, charts 8/4, bottom 5/7 sur 12 colonnes)
- Mise à jour des métadonnées du layout (titre FiscalFlow — Financial Dashboard)
- Corrections suite au lint : mutation de variable pendant le render (react-hooks/immutability) extraite dans une fonction module-level buildArcs ; keys React ajoutées aux dots custom recharts ; marge droite du graphique augmentée (label "November" tronqué)
- Vérification end-to-end via agent-browser : rendu desktop 1440px fidèle à la maquette, interactions validées (tabs, sous-menu Account, collapse sidebar, toast Download, switch Weekly/Monthly, hover donut, tooltip chart), mobile 390px (topbar sticky, Sheet menu, cartes empilées), zéro erreur console/page, lint propre

Stage Summary:
- Dashboard FiscalFlow 100% frontend livré sur la route / (aucune API, aucune DB)
- Fichiers produits : src/app/page.tsx, src/app/layout.tsx (metadata), src/app/globals.css (thème), src/components/dashboard/{data,logo,sidebar,header,stats-cards,cash-flow-chart,financial-balance,recent-transactions,tax-liabilities}.tsx, public/avatar-jack.png
- Stack : Next.js 16 App Router, TypeScript, Tailwind 4, shadcn/ui, recharts 2.15, framer-motion 12
- Design fidèle à la maquette + modernisation : animations d'entrée en stagger, hover lift sur les cartes, états interactifs partout (chart, donut, selects), sidebar collapsible, menu mobile Sheet, toasts
- Note : la faute de frappe de la maquette "Financial Statment" a été corrigée en "Financial Statement"

---
Task ID: 1
Agent: Z.ai Code (main)
Task: Dashboard FiscalFlow full-screen — sidebar, header et layout uniquement, sans arrière-plan (frontend only)

Work Log:
- Lu la structure existante : page.tsx (ancienne version avec fond gris bg-neutral-100 + conteneur max-w-[1500px] centré), sidebar.tsx, header.tsx, 4 widgets, data.ts, globals.css (thème coral)
- Réécrit src/app/page.tsx en shell full-viewport : h-dvh flex overflow-hidden, fond blanc pur (aucun fond gris), sidebar épinglée pleine hauteur avec border-r, top-bar épinglée (shrink-0 + border-b), zone de contenu scrollable (flex-1 overflow-y-auto + ff-scrollbar), suppression de tous les conteneurs max-width
- Adapté src/components/dashboard/header.tsx en top-bar compacte une seule rangée sur desktop (breadcrumb + onglets + actions), breadcrumb masqué sur très petit écran (remplacé par logo), onglets sur rangée dédiée scrollable en mobile, bouton Download raccourci en "Export" sur mobile
- Ajouté h1 sr-only "FiscalFlow — Dashboard" pour l'accessibilité
- Vérifié avec Agent Browser : desktop 1440x900 (rendu, sidebar collapse, onglets, toast Download, scroll contenu avec top-bar épinglée), mobile iPhone 16 (menu hamburger, Sheet sidebar, cartes empilées)
- Lint OK, aucun erreur console/page, dev.log propre (GET / 200)

Stage Summary:
- Le dashboard occupe désormais 100% du viewport, bord à bord : sidebar (pleine hauteur, repliable 88↔264px), top-bar épinglée, contenu scrollable sur fond blanc sans aucun arrière-plan
- Aucune modification backend — 100% frontend avec données mock (data.ts)
- Artefacts : src/app/page.tsx (shell), src/components/dashboard/header.tsx (top-bar)

---
Task ID: 2
Agent: Z.ai Code (main)
Task: Adapter le cahier des charges TBM (Ticket Bus Mali) à l’interface existante — back-office A01→A08 + écran de login RBAC centré, frontend only

Work Log:
- Lu le cahier des charges (upload/Cahier_des_charges_TBM.docx) : rôles (§2), back-office A01-A08 (§3.4), paiement P01-P08 (§3.5), règles RG1/RG5/RG7/RG9/RG10/RG11, contacts TBM (§1.4)
- Supprimé les composants FiscalFlow (src/components/dashboard/*) ; conservé le design system (shell full-screen blanc, cartes ff-card, accent corail, sidebar repliable)
- Créé data.ts (mock : compagnies, transactions Orange/Moov Money avec 5 états P03, remboursements, utilisateurs, villes/gares, ventes 14j, paramètres RG) + stores zustand : auth (persist localStorage) et opérationnel (chaque action sensible alimente le journal d’audit A06)
- Écran de connexion : container centré au milieu (logo bus TBM + formulaire e-mail/mot de passe), sélecteur de rôle RBAC (Administrateur / Support), liseré tricolore malien, contacts TBM en pied de carte, validation + loading simulé
- Shell back-office : sidebar à 3 groupes (Pilotage/Opérations/Administration) filtrée par rôle, recherche de section, topbar (fil d’Ariane, refresh, notifications popover, menu compte avec déconnexion), mobile via Sheet
- 8 pages : Tableau de bord (A08 : KPIs, ventes 14j, top compagnies, dernières transactions), Compagnies (A01 : créer/activer/suspendre + toast + audit), Transactions (A02 : rapprochement TBM vs opérateurs, filtres, 5 statuts paiement, export CSV réel via Blob), Remboursements (A03 : traiter/refuser avec justification obligatoire → trace), Utilisateurs (A05 : bloquer/débloquer, admin protégé), Journal d’audit (A06 : filtrable, reflète les actions en direct), Villes & Gares (A07 : référentiel + notification ciblée), Paramétrage (A04 : frais fixe/%, commission, blocage 10 min RG1, paliers d’annulation RG5)
- Corrigé 2 erreurs ESLint set-state-in-effect (useSyncExternalStore pour l’hydratation, suppression d’effet inutile) ; ajouté SheetDescription (a11y)
- Vérifié avec Agent Browser : login admin → dashboard (KPIs FCFA sans décimales RG11), activation Sikasso Voyage → audit « À l’instant », remboursement RMB-031 traité avec justification → compteurs live + audit, transactions + export CSV, RBAC Support (4 sections seulement), paramétrage enregistré, mobile iPhone (topbar + Sheet), reload avec session persistée ; zéro erreur console/page ; lint OK

Stage Summary:
- Back-office TBM complet et cohérent avec le cahier des charges (A01→A08, RG, P03, RBAC §2), 100% frontend (mock data + état local zustand), même interface plein écran sans arrière-plan
- Le journal d’audit est alimenté automatiquement par toutes les actions sensibles (compagnies, remboursements, utilisateurs, paramétrage, notifications) — démonstration A06 en conditions réelles
- Artefacts : src/components/tbm/** (logo, login-screen, sidebar, topbar, shell, pages/*, data.ts), src/lib/auth-store.ts, src/lib/tbm-store.ts, src/app/page.tsx, src/app/layout.tsx

---
Task ID: 2
Agent: Z.ai Code (main)
Task: Supprimer la barre de recherche du sidebar (back-office TBM)

Work Log:
- Repéré le bloc « Recherche (filtre le menu) » dans src/components/tbm/sidebar.tsx (input + kbd ⌘K + bouton d'expansion en mode replié)
- Supprimé le bloc de recherche ainsi que l'état `query`, le filtrage du menu par texte et le message « Aucune section ne correspond… »
- Nettoyé les imports devenus inutiles (Search, useState, useMemo) ; le filtrage RBAC par rôle est conservé
- Déplacé le bouton déplier/replier dans l'en-tête de marque (PanelRightOpen/PanelRightClose) pour garder le toggle accessible en mode replié
- Vérifié avec `bun run lint` (0 erreur) puis Agent Browser : login RBA → sidebar sans recherche, repli/dépliage OK, aucun erreur console/serveur

Stage Summary:
- Sidebar épuré : logo + navigation (groupes Pilotage/Opérations/Administration) + carte utilisateur, sans barre de recherche
- Toggle de repli toujours disponible en mode icônes
- Aucune régression : RBAC par rôle, badges, animations conservés

---
Task ID: 3
Agent: Z.ai Code (main)
Task: Refonte de la page « Compagnies de transport » (A01) selon le cahier des charges

Work Log:
- data.ts : étendu Company (téléphone, adresse, params: CompanySalesParams — vente en ligne/guichet, réservation J, annulation gratuite h), helpers companyInitials/companyLogoColor (avatars-logo), types + mocks Bus/Ligne/Départ/CompanyEvent (flotte 9 bus, 10 lignes, 8 départs, 11 événements activité/incident) + metas de statut
- tbm-store.ts : ajouté updateCompany(id, patch, auteur) avec traçage d'audit détaillé des changements (nom, contact, tél, adresse, ville, commission, chaque paramètre de vente)
- pages/companies.tsx : réécriture complète —
  • En-tête « Compagnies de transport » + bouton Nouvelle compagnie
  • Bandeau 4 KPI (actifs x/total, en attente, commission moyenne, tickets du mois)
  • Recherche étendue (nom/contact/téléphone/ville) + filtre statut
  • Tableau enrichi : avatar-logo initiales colorées, e-mail + téléphone, commission, tickets, statut, menu actions (Voir la fiche / Modifier / Activer / Suspendre / Remettre en attente), lignes cliquables
  • Fiche détail (Sheet droite 620px) : logo, badge statut, actions rapides, 3 onglets — Aperçu (coordonnées, infos commerciales, paramètres de vente), Flotte & lignes (bus avec statuts/chauffeurs/places, lignes avec prix FCFA, prochains départs avec places libres), Activité (timeline activités + incidents)
  • Dialog Modification complet (nom, ville, commission, e-mail, tél, adresse, switches vente en ligne/guichet, réservation, annulation) — états vides gérés pour les nouvelles compagnies
- Tests Agent Browser : navigation, onglets, édition commission 10→12 + adresse (toast + audit « Fiche modifiée : … »), suspension/réactivation (badges + KPI temps réel), création CPG-006 Koutiala Express (statut attente, états vides OK), journal d'audit alimenté, mobile iPhone 16 (KPI 2×2, tableau scrollable, sheet pleine largeur), 0 erreur console/serveur sur chargement à neuf

Stage Summary:
- Page A01 conforme au cahier des charges : liste, ajouter/modifier/activer/suspendre, coordonnées+logo, commission & paramètres de vente, historique activités/incidents, consultation bus/lignes/départs
- Store étendu avec updateCompany tracée au journal d'audit
- Données de démo riches (flotte, lignes, départs, événements) sans backend

---
Task ID: 4
Agent: Z.ai Code (main)
Task: Refonte « Lignes et départs » (A09) — supervision inter-compagnies (MVP cahier des charges)

Work Log:
- data.ts : Line étendue (arrets: string[], distanceKm), Departure étendue (prix, plateforme?, retardMinutes?, statuts +« retardé » et « terminé »), DEPARTURE_STATUS_META complété (5 statuts), nouveau modèle DepartureModification (retard/annulation/changement_bus/plateforme/info) + meta + 6 modifications de démo ; companyDepartures reconstruite (13 départs sur 2 jours, toutes compagnies, capacité vendue/libre) ; companyLines enrichies (arrêts réels type Kati/Bougouni/Kita + distances)
- sidebar.tsx / shell.tsx : nouvelle section « Lignes & Départs » (icône Route, admin+support, A09) dans le groupe Opérations + routage
- pages/lines.tsx (nouveau) :
  • 4 KPI du jour (départs, places vendues, taux d'occupation, départs perturbés + nb modifications suivies)
  • Onglet « Tableau des départs » : recherche (trajet/bus/compagnie) + filtres compagnie/statut/jour, colonnes heure+jour (icône History si programme modifié), trajet+plateforme, avatar compagnie, bus, tarif FCFA, barre d'occupation (vendues/libres), badge statut (+45 min pour les retards, point pulsant)
  • Onglet « Réseau de lignes » : agrégation inter-compagnies par trajet (stack avatars ×N, tarifs min–max, arrêts listés)
  • Fiche départ (Sheet) : alerte retard avec nouvelle heure estimée (calcul shiftTime), places vendues/disponibles avec jauge, itinéraire en stepper (Départ → arrêts → Arrivée), timeline « Modifications du programme » (vide = « Programme conforme »)
  • Fiche ligne (Sheet) : parcours complet, compagnies exploitantes (statut, tarif, fréquence), départs à venir cliquables (renvoie vers fiche départ)
  • Lecture seule : aucune action d'édition (recommandation du cahier respectée)
- companies.tsx : fiche compagnie — prochains départs excluent désormais les « terminés »
- Vérifié Agent Browser : board + onglets + filtres, fiche départ retardée (alerte, 2 modifications tracées), fiche ligne multi-compagnies, navigation inter-fiches, mobile iPhone 16 (KPI 2×2, scroll horizontal), 0 erreur console/serveur

Stage Summary:
- Onglet A09 conforme au MVP : lignes interrégionales (départ/destination/arrêts), date/heure/tarif/capacité, 5 statuts de départ, suivi des modifications de programme, places vendues/disponibles
- Supervision toutes compagnies sans outil d'édition (recommandation respectée)
- Données partagées avec la fiche compagnie (une seule source : data.ts)

---
Task ID: 5
Agent: Z.ai Code (main)
Task: Refonte « Réservations & Billets » (A10) — onglet support (MVP cahier des charges)

Work Log:
- data.ts : nouveau modèle réservations — Reservation (référence RES-xxxx, téléphone, canal en_ligne/guichet, opérateur, departId → companyDepartures, statut, tickets, historique, motif), Passenger (nom, adulte/enfant, siège), Ticket (n° TKT-xxxx, tarif RG11, statut), ScanEvent (paiement/émission/scan_embarquement/contrôle/annulation/expiration) + 3 META maps ; 15 réservations de démo couvrant tous les statuts, canaux et compagnies (22 billets : 8 émis, 7 utilisés, 7 annulés) avec historiques réalistes (RG1 blocage 10 min, RG5 paliers d'annulation)
- sidebar.tsx / shell.tsx : section « Réservations » (icône Ticket, badge 2, admin+support, A10) dans le groupe Opérations + routage
- pages/reservations.tsx (nouveau) :
  • 4 KPI (réservations 10 en ligne · 5 guichet, en attente RG1, billets actifs + validés au scan, annulées/expirées)
  • Recherche support normalisée (espaces/tirets ignorés) : référence, téléphone, n° de billet, nom de passager, trajet + filtres statut/compagnie/jour
  • Tableau : référence + canal (Smartphone/Store), pile d'avatars passagers, départ associé (trajet + jour/heure), compagnie (avatar), décompte billets par statut, montant TTC (frais de service A04 : 250 FCFA/billet), badge statut
  • Fiche réservation (Sheet 620px) : copier la référence, téléphone cliquable (tel:), alertes contextuelles (annulée/expirée/en attente/retard du départ), infos (canal, paiement, bus, compagnie), liste passagers & billets (siège, n°, tarif, badge, bouton QR), montant détaillé (billets + frais + total), timeline « Historique des scans & validations »
  • Billet électronique (Dialog) : en-tête corail, QR code SVG déterministe (grille 21×21 avec motifs de repérage, seed = n° de billet), tampon diagonal VALIDÉ/ANNULÉ, siège/tarif/bus, perforation, n° de billet + note d'usage
  • Lecture seule : aucune action d'édition (l'émission reste dans l'outil des compagnies)
- Corrections lint : QR grid déplacé en fonction pure module-level (react-hooks/immutability) ; pluralisations « émis/utilisé/annulé »
- Vérifié Agent Browser : desktop 1440 (liste, filtre Annulée → RES-2044/2048/2053, fiche confirmée + QR VALIDÉ, fiche annulée + motif + QR ANNULÉ), recherches validées (téléphone « 76421805 », billet « 40812 », référence « RES-2053 », passager « Mariam Traoré »), mobile iPhone 16 (KPI 2×2, fiche en attente avec alerte RG1, scroll tableau), RBAC Support (Réservations visible, admin-only masquées), 0 erreur console/serveur sur rechargement à neuf

Stage Summary:
- Onglet A10 conforme au MVP : toutes les réservations, recherche rapide multi-critères pour le support, passagers + départ associé, 4 statuts de réservation, billet électronique avec QR code, 3 statuts de billet, historique des scans et validations
- Périmètre respecté : le support consulte et retrouve un billet ; l'émission/reporting restent chez les compagnies
- Données liées au reste du back-office : départs partagés (companyDepartures), frais de service et blocage RG1 issus du Paramétrage (A04)

---
Task ID: 5-fix
Agent: Z.ai Code (main)
Task: Corriger l'erreur « Module not found: Can't resolve '@/components/tbm/pages/reservations' » remontée par l'utilisateur

Work Log:
- Diagnostic : le fichier src/components/tbm/pages/reservations.tsx existait bien (export ReservationsPage ligne 840), data.ts exposait tous les symboles importés (reservations, RESERVATION_STATUS_META, TICKET_STATUS_META, SCAN_KIND_META, types Reservation/ScanEvent/Ticket/Settings), `bun run lint` 0 erreur → cause = état intermédiaire du cache Turbopack (fichier créé pendant un scan du compilateur), pas un vrai défaut de code
- Correctif : arrêt propre des processus `next dev`, suppression du répertoire `.next` (purge cache Turbopack), relance de `bun run dev`
- Particularité sandbox : le serveur d'origine avait été lancé par la plateforme au boot ; après kill, les relances détachées (setsid/nohup) meurent entre deux appels outils → vérification complète réalisée dans une session unique serveur + agent-browser
- Vérification Agent Browser (desktop 1440×900, rechargement à neuf) : page de connexion rendue sans erreur, login tbm2026, navigation « Réservations » → KPIs (15 réservations, 2 en attente RG1, 15 billets actifs, 5 annulées/expirées), recherche par téléphone « 76421805 » → RES-2041, par référence « RES-2053 » → fiche guichet annulée (alerte remboursement automatique), billet électronique TKT-2605-40990 avec QR code déterministe + tampon ANNULÉ, historique des scans (2 événements), 0 erreur page/console
- Vérification mobile iPhone 16 : KPIs 2×2, recherche pleine largeur, tableau scrollable horizontal, fiche RES-2041 complète (téléphone cliquable, passagers Utilisé/Émis, montant 10 500 FCFA avec frais de service, historique 3 événements), 0 erreur
- dev.log propre : uniquement GET / 200, aucune erreur compile/runtime ; serveur laissé en écoute sur le port 3000 pour le panneau de prévisualisation

Stage Summary:
- Cause racine : cache Turbopack périmé (pas de régression code) — purge `.next` + redémarrage suffit
- Page « Réservations & Billets » (A10) confirmée 100 % fonctionnelle après correction : recherche support multi-critères, 4 statuts de réservation, billet électronique + QR code, historique des scans/validations
- Aucun fichier modifié : intervention purement opérationnelle (cache + process)

---
Task ID: 6
Agent: Z.ai Code (main)
Task: Refonte « Paiements & Transactions » (A02) — supervision des paiements opérateurs (MVP cahier des charges)

Work Log:
- data.ts : modèle Transaction étendu (refOperateur OM/MM, refReservation → RES-xxxx, téléphone débité, jour de rapprochement, billetsEmis, releve, anomalie + résolution), PaymentEvent/PaymentEventKind (9 types) + PAYMENT_EVENT_META, ReconciliationEcart + meta, OperatorStatement + 7 relevés opérateurs ; 15 transactions de démo liées aux réservations A10 (montants TTC = billets + 250 FCFA/billet), dont TXN-10244 « débité sans billet » reliée au remboursement RMB-030 (A03) ; AuditAction + « Transaction » / « Rapprochement »
- tbm-store.ts : transactions + closedReconciliations dans le state ; confirmPendingPayment (retour fiable opérateur → billets émis APRÈS confirmation, point critique), resolveTransactionAnomaly (justification obligatoire), closeReconciliation — chaque action tracée à l'audit
- pages/transactions.tsx réécrite (~1000 lignes) :
  • 4 KPI live : encaissé (réussi), en attente RG1, débités sans billet, rapprochement (écarts/clôtures)
  • Onglet Transactions : recherche normalisée (réf. opérateur, réf. réservation, TXN, téléphone, compagnie) + filtres opérateur/statut/jour ; tableau avec copie de la réf. opérateur, badges Orange Money/Moov Money, réservation liée, billets émis (0 émis en rose si anomalie), statuts P03
  • Fiche transaction (Sheet) : infos complètes (téléphone cliquable, présence au relevé), chaîne de validation critique en 5 étapes (initiation → requête → débit → confirmation serveur → émission ; échec/ambers selon le statut), historique des échanges horodaté ; actions « Vérifier le retour opérateur » (en attente) et « Résoudre l'anomalie »
  • Reçu de paiement (Dialog) : en-tête corail, montant, réf. opérateur, réservation, statut, billets émis, note « Règle d'émission » (point critique), bouton Imprimer
  • Onglet Rapprochement quotidien : plateforme TBM recalculée en direct vs relevés opérateurs (montants/nb concordants), écarts documentés, statuts Clôturé/Écart/Provisoire/Conforme, clôture tracée à l'audit et bloquée tant qu'une anomalie « débité sans billet » reste ouverte
  • Onglet Anomalies : cartes débit-sans-billet (à traiter/résolues), résolution avec justification ≥ 10 caractères, rappel du lien RMB-030 (A03)
  • Export CSV étendu (13 colonnes : réf. opérateur, réf. réservation, téléphone, billets émis, présence relevé, anomalie)
- Correction pendant la revue : la clôture d'un rapprochement était bloquée par les écarts déjà documentés au relevé — désormais seule une anomalie ouverte bloque
- Fiche transaction reflète le store en temps réel (sélection par id) — statuts/badges/KPI mis à jour après chaque action
- Vérifié Agent Browser desktop 1440×900 : tableau + badges, fiche TXN-10244 (chaîne critique en échec à l'émission), résolution avec justification → badge « Anomalie résolue » + KPI 0 + bloc émeraude « Résolu par Daouda FOMBA », onglet Rapprochement (28 000/41 000/21 750 FCFA concordants) + clôture « Hier · Orange Money » → badge Clôturé, reçu TXN-10252, TXN-10251 en attente → « Vérifier le retour opérateur » → Réussi + 1 billet émis + KPI 99 750 FCFA/1 en attente, recherches RES-2041 et Moov OK, 0 erreur console/serveur
- Vérifié mobile iPhone 16 : KPIs empilés, onglets scrollables, tableau en scroll horizontal, 0 erreur

Stage Summary:
- A02 conforme au MVP : Orange Money/Moov Money, réf. opérateur + réf. réservation, montant FCFA/date/moyen, 5 statuts, détection des débits sans billet, rapprochement quotidien avec relevés, reçus de paiement + export
- Point critique incarné dans l'UI : chaîne de validation en 5 étapes où l'émission n'intervient qu'après confirmation serveur (retour fiable opérateur) — l'anomalie TXN-10244 montre exactement la panne quand le retour arrive après expiration RG1
- Toutes les actions sensibles (confirmation, résolution, clôture) alimentent le journal d'audit A06
- Artefacts : src/components/tbm/pages/transactions.tsx (réécrite), src/components/tbm/data.ts (sections Transactions + audit), src/lib/tbm-store.ts (3 actions auditées)

---
Task ID: 7
Agent: Z.ai Code (main)
Task: Refonte « Remboursements & litiges » (A03) — dossiers manuels, droits spécifiques, traçabilité complète (MVP cahier des charges)

Work Log:
- data.ts : modèle entièrement refondu — RefundReason typé (annulation / double_paiement / depart_annule / incident) + meta avec description, RefundStatus (en_attente / approuve / rembourse / refuse) + meta, REFUND_SUPPORT_LIMIT = 15 000 FCFA (plafond support), RefundVersement (tranches avec date, montant, réf. opérateur, agent), RefundEventKind (demande, prise_en_charge, decision, versement, litige_ouvert, litige_resolu) + meta, RefundEvent (par + role signés), Refund enrichi (téléphone, compagnie, opérateur, refReservation, motifDetail, litige{ouvert, detail, ouvertLe, ouvertPar, resolution, resoluPar}, versements[], historique[]) + helpers refundMontantRembourse/refundResteDu ; 9 dossiers de démo reliés aux transactions réelles A02 (TXN-10233…10247) couvrant tous les motifs et statuts, dont RMB-028 partiellement remboursé (10 000/15 000) et RMB-032 en litige ouvert (double paiement contesté, gelé) ; AuditAction + « Litige » + meta audit
- tbm-store.ts : processRefund remplacé par 5 actions auditées — claimRefund (prise en charge), decideRefund (valider/refuser avec justification obligatoire, refusé si litige ouvert), addRefundVersement (enregistre la tranche opérateur, clamp au reste dû, passage automatique à « Remboursé » quand soldé), openRefundDispute (escalade + gel), resolveRefundDispute (levée admin) — chacune ajoute un événement signé (auteur + rôle) à l'historique du dossier ET une entrée au journal d'audit (action Remboursement ou Litige)
- pages/refunds.tsx réécrite (~1 090 lignes) :
  • En-tête + bouton Exporter + bandeau « Vos droits » dynamique (admin : sans plafond + levée des litiges ; support : ≤ 15 000 FCFA + escalade, levée réservée admin)
  • 4 KPI live : à traiter (nb + montant en jeu), validés en cours (reste à verser), déjà remboursés (total versé + dossiers soldés), litiges ouverts
  • Recherche normalisée multi-critères (réf., passager, téléphone, TXN, réservation, compagnie, réf. de versement) + filtres statut / motif / litige (ouverts, sans litige)
  • Tableau : réf. + date demande, passager + tél, badge motif + détail, transaction + réservation, montant remboursable + barre de progression remboursé, statut + badge Litige + agent en charge, actions selon droits (Valider/Refuser, Verser, « Admin requis » verrouillé, « Gelé » pour litiges)
  • Fiche dossier (Sheet 600px) : en-tête sticky (badges statut / litige / litige résolu, montant remboursable), actions contextuelles, alerte rose « dossier gelé » avec détail du litige + mention droits, bloc émeraude « Litige résolu », informations (TXN copiable, réservation, opérateur, tél cliquable tel:, compagnie, demande), motif (badge + règle RG + détail de la demande), montants en 3 blocs (remboursable / déjà remboursé / reste dû) + barre + liste des versements avec réf. opérateur copiable, traitement (agent en charge, décision, justification obligatoire citée, alerte plafond pour le support), historique de l'agent (avatar initiales, rôle déduit de la traçabilité, « X dossiers traités · Y FCFA versés », liste des autres dossiers traités), timeline complète du dossier (chaque action signée auteur + rôle)
  • 4 dialogs : décision valider/refuser (justification ≥ 10 car., rappel traçabilité), versement (montant pré-rempli au reste dû + réf. opérateur obligatoire, dossier soldé automatiquement), escalade en litige (motif ≥ 10 car., gel immédiat), levée de litige (résolution ≥ 10 car., admin uniquement)
  • Export CSV 16 colonnes (réf., passager, tél, motif, transaction, réservation, opérateur, compagnie, remboursable, déjà remboursé, reste dû, statut, litige, agent, réf. versement, justification)
- Corrections en revue : phrase d'alerte litige sans double espace selon rôle ; badge opérateur sans doublon texte dans la fiche ; props RefundSheet allégées
- sidebar.tsx : badge Remboursements 2 → 4 (dossiers en attente)
- Vérifié Agent Browser desktop 1440×900 (admin Daouda FOMBA) : KPIs exacts (4 demandes · 57 500 FCFA en jeu, 2 validés · reste 22 500, 28 000 FCFA versés · 2 soldés, 1 litige) ; validation RMB-031 (erreur sans justification → validée → badge Validé + toast) ; versement RMB-031 (erreur sans réf. → OM-RMB-88125 → dossier soldé + événement) ; escalade litige RMB-035 (motif → gelé + alerte + bouton Lever) ; levée du litige (résolution → dégelé + bloc Litige résolu) ; prise en charge + refus RMB-035 (justification → Refusé) ; historique agent live « 4 dossiers traités · 23 750 FCFA versés » ; recherches téléphone « 76 22 41 09 » → RMB-030 et « RMB-032 » ; filtre litiges ouverts → RMB-032 seul ; fiche RMB-032 gelée (seule action Lever le litige) ; export CSV + toast ; journal d'audit alimenté en direct (Remboursement + Litige) ; 0 erreur console/page
- Vérifié RBAC Support (Mody BARRY) : bandeau « Traitement jusqu'à 15 000 FCFA », RMB-034 « Admin requis » (17 500 > plafond), RMB-028 bouton Verser (reste 5 000), RMB-032 « Gelé », RMB-030 Valider/Refuser ; fiche litige sans bouton de levée + mention « (résolution réservée à l'administration) »
- Vérifié mobile iPhone 16 : bandeau droits + KPIs empilés, filtres wrap, fiche pleine largeur lisible avec actions en wrap ; 0 erreur console/page
- Lint 0 erreur ; dev.log propre (GET / 200, compilations OK)

Stage Summary:
- A03 conforme au MVP : liste des demandes et remboursements, 4 motifs typés (annulation, double paiement, départ annulé, incident), montant remboursable vs déjà remboursé (versements partiels), traitement manuel avec justification obligatoire, suivi du statut ET de la référence opérateur de chaque versement, historique de l'agent ayant traité le dossier (fiche + liste de ses autres dossiers), droits spécifiques (plafond support 15 000 FCFA, litiges admin-only) et traçabilité complète (timeline signée + journal d'audit A06)
- Cycle de vie incarné : en attente → validé → remboursé (versement(s) opérateur, soldé automatiquement) ou refusé ; litige = gel total jusqu'à résolution administrative
- Cohérence inter-modules : dossiers reliés aux transactions A02 (TXN-10244 « débité sans billet » → RMB-030), audit partagé A06
- Artefacts : src/components/tbm/pages/refunds.tsx (réécrite), src/components/tbm/data.ts (section Remboursements & litiges refondue), src/lib/tbm-store.ts (5 actions auditées), src/components/tbm/sidebar.tsx (badge)

---
Task ID: 8
Agent: Z.ai Code (main)
Task: Refonte « Utilisateurs & accès » (A05) — comptes voyageurs/pros, création + activation, blocage/déblocage, rôles et permissions, historique connexions/actions sensibles, isolation par compagnie (MVP cahier des charges)

Work Log:
- data.ts : section « Utilisateurs (A05) » entièrement refondue — UserRole typé à 6 rôles (Voyageur, Agent de guichet, Gestionnaire de compagnie, Contrôleur, Support TBM, Administrateur TBM) + USER_ROLE_META (badge, kind voyageur/professionnel, scope d'isolation global/compagnie/soi + libellé) ; UserStatus (actif/attente/bloque) + meta ; ROLE_PERMISSIONS matrice complète des permissions par rôle ; LoginEvent (date, résultat succès/échec, IP, lieu, appareil, détail) + LOGIN_RESULT_META ; UserSensitiveAction ; UserAccount enrichi (téléphone, statut, bloqueMotif/Par/Le, creeLe/Par, activeLe/Par, derniereConnexion, connexions[], actionsSensibles[]) ; 12 comptes de démo couvrant tous les rôles : 4 voyageurs (dont 1 bloqué pour fraude), 2 à activer (Oumar DIARRA créé par Aminata, Kadiatou SANGARÉ), Fatoumata Cissé bloquée (5 échecs de connexion tracés), historiques de connexions réalistes (IP 41.79.x.x, Bamako/Ségou/Sikasso/Koutiala, appareils, échecs avec détail tentative) et actions sensibles reliées aux autres modules (commission, remboursement RMB-029, tarif, embarquement 42 billets)
- tbm-store.ts : toggleUserBlock remplacé par 5 actions auditées (action « Utilisateur » au journal A06) — createProAccount (statut « attente », aucun accès tant que non activé), activateUser (mot de passe provisoire par SMS, activeLe/Par), blockUser (motif obligatoire, protection RBAC : un administrateur TBM ne peut jamais être bloqué), unblockUser (accès rétabli après vérification d'identité, motif purgé), changeUserRole (justification obligatoire citée, refus si rôle identique ou compte admin, périmètre recalculé) ; userSeq pour les nouveaux USR-xx
- pages/users.tsx réécrite (~1 090 lignes) :
  • En-tête + « Compte professionnel » (coral) + Exporter ; bandeau droits admin (créer/activer, bloquer/débloquer sauf administrateurs, rôles tracés) avec item isolation violet « un compte de compagnie ne voit jamais les données d'une autre compagnie »
  • 4 KPI live : comptes (répartition voyageurs/pros), à activer, bloqués, connexions échouées 7j
  • Recherche normalisée (nom, e-mail, téléphone, compagnie, réf, rôle) + 4 filtres : type de compte, rôle, statut, compagnie
  • Tableau : utilisateur (avatar + « vous » + tél/e-mail), rôle (badge + portée), périmètre (badge compagnie violet / Plateforme TBM / Ses données), statut (badge + motif bloqué tronqué + « créé le »), dernière connexion (nb connex. + échecs), actions contextuelles (Activer en émeraude, Débloquer, Bloquer, « Protégé » pour admin/soi)
  • Fiche Sheet 600px : en-tête sticky (avatar, badges rôle/statut/kind, actions contextuelles, « Administrateur — protégé »), Tabs Profil & accès / Connexions (n) / Actions (n) — profil : alerte rose blocage (motif + auteur) ou alerte ambre « à activer », informations complètes (téléphone cliquable, créé/activé par…), bloc violet « Périmètre d'isolation des données » (isolation stricte par compagnie / plateforme entière / ses propres données), matrice ROLE_PERMISSIONS avec note « toute exception est interdite » ; connexions : timeline inversée succès/échec avec IP mono, lieu, appareil, détail d'échec ; actions sensibles : liste coral + mention journal d'audit, empty states soignés
  • 5 dialogs : création compte pro (nom/e-mail/téléphone/rôle pro/compagnie obligatoires, note isolation), activation (récap périmètre + SMS provisoire + traçabilité), blocage (motif ≥ 10 car.), déblocage (confirmation), changement de rôle (rôle cible + périmètre cible affiché, justification ≥ 10 car., garde « compte sans compagnie »)
  • Export CSV 15 colonnes (réf., rôle, type, compagnie, statut, motif, créée/activée, dernière connexion, connexions, échecs, actions sensibles)
- Correction en revue : MiniKpi `<icon>` minuscule (tag HTML invalide signalé par la console) → déstructuration `icon: Icon`
- sidebar.tsx : badge « Utilisateurs 2 » (comptes pro en attente d'activation)
- Vérifié Agent Browser desktop 1440×900 (admin Daouda FOMBA) : KPIs exacts (12 comptes · 4 voyageurs/8 pros, 2 à activer, 2 bloqués, 5 échecs) ; fiche Fatoumata (alerte blocage + motif, onglet Connexions avec 3 échecs détaillés tentative par tentative, onglet Actions) ; création compte pro (erreur e-mail invalide affichée → Seydou BÂ @ Sahel Bus créé « à activer » + toast + KPI 13/9 pros) ; activation Oumar DIARRA (fiche passe Actif + « Activé le : À l'instant · par Daouda FOMBA ») ; blocage Moussa (motif court refusé → motif valide → alerte rose + badge Bloqué) ; déblocage ; changement de rôle Agent → Gestionnaire (toast, badge violet, matrice permissions recalculée) ; onglet Actions sensibles d'Aminata (création agent + tarif) ; journal d'audit A06 alimenté en direct avec les 5 entrées « Utilisateur » (création, activation, blocage avec motif cité, déblocage, rôle modifié avec justification citée) ; recherche « sangare » + filtre statut « À activer » combinés ; export CSV ; 0 erreur console/page
- Vérifié mobile iPhone 16 : bandeau droits + KPIs empilés, boutons en wrap, tableau en scroll horizontal, fiche pleine largeur lisible (alerte blocage, isolation, informations) ; 0 erreur console/page
- Lint 0 erreur ; dev.log propre (GET / 200, compilations OK)

Stage Summary:
- A05 conforme au MVP : comptes voyageurs/gestionnaires/agents + contrôleurs/support TBM, création et activation des comptes professionnels (aucun accès avant activation, mot de passe provisoire par SMS), blocage/déblocage avec motif obligatoire tracé, gestion des rôles et permissions (matrice par rôle affichée, changement tracé avec justification), historique des connexions (IP/lieu/appareil/succès-échec) et des actions sensibles par compte
- Point critique incarné : « un agent d'une compagnie ne doit jamais accéder aux données privées d'une autre compagnie » — scope d'isolation par rôle affiché dans le bandeau, le tableau (badge périmètre) et la fiche (bloc violet « isolation stricte par compagnie »), appliqué côté plateforme ; protection RBAC : administrateur non bloquable, soi-même non bloquable
- Cohérence inter-modules : comptes de démo reliés aux compagnies A01 et aux actions retracées au journal A06 ; les 5 nouvelles actions alimentent l'audit A06 avec auteur + rôle
- Artefacts : src/components/tbm/pages/users.tsx (réécrite), src/components/tbm/data.ts (section Utilisateurs & accès refondue), src/lib/tbm-store.ts (5 actions auditées), src/components/tbm/sidebar.tsx (badge)

---
Task ID: 9
Agent: Z.ai Code (main)
Task: Nouveau module « Commissions & reversements » (A11) — montants collectés par compagnie, commissions TBM, net à reverser, historique des reversements, statuts à calculer/à valider/en cours/payé, justificatifs téléchargeables (spec utilisateur)

Work Log:
- data.ts : nouvelle section « Commissions & reversements (A11) » — EncaissementMode (plateforme/compagnie) + ENCAISSEMENT_MODE_META + TBM_ENCAISSEMENT_MODE = « plateforme » (contrainte de conception : module conçu pour les deux modèles, opérations finalisées manuellement au lancement) ; SettlementStatus (a_calculer / a_valider / en_cours / paye) + meta ; ReversementMoyen (virement_bancaire / orange_money / moov_money) + meta ; SettlementDocKind (releve_collecte / avis_commission / preuve_paiement) + meta ; SettlementEventKind (creation / calcul / validation / paiement) + meta ; Settlement (période, brutCollecte, remboursements, commissionTaux/Montant, netAReverser, nbTransactions/Billets/Remboursements, estimation provisoire, moyen, refPaiement, dates+auteurs calcul/validation/paiement, docs[], historique[]) + helper settlementNetCollecte ; SETTLEMENT_PRECOMPUTED (montants consolidés au calcul pour la démo) ; 9 reversements de démo sur 3 semaines (S39/S40/S41) couvrant les 4 statuts : 4 payés (dont Kayes Lines via Orange Money), 1 en cours (Sahel Bus, validé Hier), 2 à valider (calculés ce matin, dont Sikasso avec l'anomalie RMB-030 déduite), 2 à calculer (estimation provisionnelle) ; AuditAction + « Reversement » + meta audit
- tbm-store.ts : settlements dans le state + 3 actions auditées (action « Reversement » au journal A06) — calculateSettlement (a_calculer → a_valider : consolidation brut − remboursements − commission = net, génération relevé de collecte + avis de commission, événement signé), validateSettlement (a_valider → en_cours, net engagé, rappel manualisation), paySettlement (en_cours → paye, moyen + référence de paiement obligatoire ≥ 4 car., preuve de reversement rattachée) — chaque action ajoute un événement à l'historique du reversement ET une entrée au journal d'audit
- pages/settlements.tsx (nouvelle, ~1 050 lignes) :
  • En-tête + Exporter + bandeau « modèle d'encaissement retenu : TBM encaisse, puis reverse » (conçu pour les deux modèles, manualisation au lancement) + droits selon rôle (admin : calcul/validation/exécution ; support : calcul et consultation, validation et paiement réservés à l'administration)
  • 4 KPI live : collecté (périodes traitées), commissions TBM (8–12 %), net à reverser en attente, reversements payés
  • Onglet « Cycle de reversement » : recherche (réf., compagnie, période, réf. paiement) + filtres statut/compagnie ; tableau avec avatar compagnie + taux, collecté (− remboursements · net), badge taux + commission, net à reverser en gras, statut + date de l'étape, pills de téléchargement des justificatifs, actions contextuelles (Calculer en sky / Valider en émeraude / Reversement en corail / « Admin requis » verrouillé pour le support)
  • Onglet « Historique des paiements » : reversements payés avec moyen (badge), référence de paiement copiable, preuve téléchargeable, total reversé en pied de tableau
  • Onglet « Par compagnie » : agrégats par compagnie (collecté cumulé, commissions cumulées, net reversé, en attente / au calcul, dernier reversement cliquable)
  • Fiche Sheet 600px : en-tête sticky (réf. + statut, net à reverser ou estimation provisoire), actions contextuelles, alerte ambre « exécution du paiement finalisée manuellement au lancement » (en cours), décompte en cascade (collecté brut − remboursements = collecté net − commission TBM = net à reverser, bloc corail), estimation provisionnelle pour les à calculer, informations (période, taux, modèle, moyen, réf. copiable, dates/auteurs calcul-validation-paiement), justificatifs & relevés téléchargeables (relevé de collecte / avis de commission / preuve avec descriptions), historique complet signé (par + rôle)
  • 2 dialogs : validation (récap du décompte → « Valider et passer en cours »), paiement (moyen + référence obligatoire, erreur < 4 caractères)
  • Export CSV 16 colonnes (réf., période, compagnie, taux, brut, remboursements, net collecté, commission, net à reverser, statut, moyen, réf. paiement, calculé/validé/payé)
- sidebar.tsx / shell.tsx : section « Reversements » (icône Percent, badge 5, admin+support) dans le groupe Opérations après Remboursements + routage
- Lint 0 erreur ; serveur dev sain
- Vérifié Agent Browser desktop 1440×900 (admin Daouda FOMBA) : KPIs exacts (2 316 000 collecté · 224 930 commissions · 967 790 en attente · 1 031 780 payés) ; fiche REV-2026-042 à calculer → « Calculer le reversement » → décompte 305 000 − 7 500 − 23 800 (8 %) = 273 700 FCFA + statut À valider + 2 justificatifs générés + événement signé ; validation (dialog récap) → En cours + alerte manualisation ; paiement (erreur « AB » refusée → BCEAO-88402-TBM) → Payé avec preuve rattachée ; onglet Historique des paiements (5 payés dont REV-2026-042 « À l'instant », badge cycle 5 → 4) ; onglet Par compagnie (Bamako Express 1 260 000 collecté / 120 650 commissions / 521 550 en attente…) ; journal d'audit alimenté en direct avec 3 entrées « Reversement » (calculé → validé → payé) ; 0 erreur console/page
- Vérifié RBAC Support (Mody BARRY) : KPIs recalculés (2 621 000 / 248 730 / 1 305 480), bandeau « validation et paiement réservés à l'administration », REV-2026-040 et REV-2026-039 verrouillés « Admin requis », bouton Calculer accessible, toast téléchargement justificatif (« Justificatif téléchargé — REV-2026-035 — avis-commission… (14 Ko) »)
- Vérifié mobile iPhone 16 : bandeau droits + KPIs empilés, onglets scrollables, tableau en scroll horizontal, fiche REV-2026-040 lisible avec décompte (aucun bouton Valider pour le support — RBAC cohérent) ; 0 erreur console/page

Stage Summary:
- A11 conforme à la spec : montants collectés pour chaque compagnie (onglet « Par compagnie » + tableau par période), commissions prélevées par TBM (taux contractuels 8–12 %), montants nets à reverser (décompte en cascade brut − remboursements − commission), historique des reversements (onglet dédié + timeline signée), 4 statuts à calculer/à valider/en cours/payé avec cycle complet en 3 actions auditées, justificatifs et relevés téléchargeables (relevé de collecte, avis de commission, preuve de reversement)
- Contrainte de conception incarnée : bandeau modèle d'encaissement (TBM encaisse → reverse ; module conçu pour les deux modèles) et alerte « exécution du paiement finalisée manuellement au lancement » — le paiement n'est pas automatisé, il est enregistré avec sa référence probante
- Cohérence inter-modules : reversements liés aux compagnies A01 (taux contractuels), aux transactions A02 (collecté brut = transactions confirmées) et aux remboursements A03 (déductions, dont l'anomalie RMB-030) ; toutes les actions alimentent le journal d'audit A06
- Artefacts : src/components/tbm/pages/settlements.tsx (nouvelle), src/components/tbm/data.ts (section A11 + AuditAction), src/lib/tbm-store.ts (3 actions auditées), src/components/tbm/sidebar.tsx + shell.tsx (navigation)
