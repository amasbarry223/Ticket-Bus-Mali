# Ticket Bus Mali (TBM) 🇲🇱 🚌

Plateforme de gestion et de réservation de billets de bus pour les compagnies de transport au Mali.

## 📋 Présentation

**Ticket Bus Mali (TBM)** est une application web moderne développée avec **Next.js** et **Tailwind CSS**, offrant une interface intuitive pour les compagnies de transport et les passagers.

### Fonctionnalités principales :
- 🎫 **Réservations en direct** : Recherche de trajets, sélection de places, génération de billets avec code QR sécurisé.
- 🏢 **Gestion des Compagnies & Lignes** : Administration des compagnies partenaires, trajets interurbains (Bamako, Ségou, Sikasso, Mopti, Kayes, Gao...).
- 💳 **Paiement Mobile & Transactions** : Suivi des règlements (Orange Money, Moov Money, Wave, etc.) et gestion des remboursements.
- 📊 **Tableau de Bord & Statistiques** : Suivi du chiffre d'affaires, taux de remplissage et audit complet des activités.
- 👥 **Gestion des Utilisateurs & Rôles** : Contrôle d'accès basé sur les rôles (Super Admin, Gestionnaire Compagnie, Guichetier, etc.).

---

## 🛠️ Stack Technique

- **Framework** : [Next.js](https://nextjs.org/) (App Router, React 19)
- **Langage** : TypeScript
- **Styling** : Tailwind CSS, Lucide React Icons
- **Base de données & ORM** : Prisma ORM, SQLite
- **Gestion d'état** : Zustand
- **Export & Rapports** : jsPDF / html2canvas / QR Code styling

---

## 🚀 Installation et Lancement

### Prérequis
- [Node.js](https://nodejs.org/) (v18 ou supérieur recommandé)
- `npm` ou `bun`

### 1. Cloner le projet
```bash
git clone https://github.com/amasbarry223/Ticket-Bus-Mali.git
cd Ticket-Bus-Mali
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Configurer l'environnement
Copiez `.env.example` en `.env` :
```bash
cp .env.example .env
```

Générez le client Prisma et synchronisez la base :
```bash
npx prisma generate
npx prisma db push
```

### 4. Lancer le serveur de développement
```bash
npm run dev
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000).

---

## 📄 Licence
Tous droits réservés © Ticket Bus Mali.