// Every user-facing string of the web and mobile apps.
// To add a language, copy this file, translate the values and keep the shape
// (`Dictionary`). Nothing else in the code base should contain UI text.

const plural = (n: number, one: string, many: string) => (n > 1 ? many : one);

export const fr = {
  app: {
    name: 'Classeuri',
    tagline: 'Ma bibliothèque de cours',
    androidDownload: "Télécharger l'application Android",
    androidHint: 'Fichier APK à installer sur le téléphone',
  },

  install: {
    pageTitle: "Installer l'application",
    title: 'Classeuri sur ton téléphone',
    intro: "Ajoute Classeuri à ton écran d'accueil : il s'ouvre comme une application, en plein écran, et garde les documents déjà ouverts pour les relire sans connexion.",
    footerLink: "Installer l'application",
    banner: 'Installe Classeuri sur ton iPhone',
    bannerAction: 'Comment faire',
    dismiss: 'Masquer',
    installed: "Classeuri est installé sur cet appareil. Tu peux l'ouvrir depuis ton écran d'accueil.",
    iosTitle: 'iPhone et iPad',
    iosSteps: [
      'Ouvre cette page dans <b>Safari</b>.',
      'Touche le bouton <b>Partager</b> (le carré avec une flèche vers le haut), en bas de l’écran. Si tu ne le vois pas, touche d’abord <b>•••</b>.',
      'Fais défiler et choisis <b>Sur l’écran d’accueil</b>.',
      'Touche <b>Ajouter</b>, en haut à droite. L’icône Classeuri apparaît sur ton écran d’accueil.',
    ],
    iosOtherBrowser: 'Depuis iOS 16.4, Chrome et Edge le permettent aussi, avec leur propre bouton Partager. Sinon, ouvre cette page dans Safari.',
    inAppBrowser: "Tu es dans le navigateur d'une autre application. Ouvre cette page dans Safari pour pouvoir l'installer.",
    copyLink: 'Copier le lien',
    linkCopied: 'Lien copié',
    androidTitle: 'Android',
    androidApk: "Télécharger l'application Android (APK)",
    androidApkHint: "L'application complète, avec téléchargements hors ligne. Autorise l'installation depuis cette source si Android le demande.",
    androidPwa: "Ou installer la version web",
    androidPwaSteps: "Dans Chrome, touche le menu <b>⋮</b> puis <b>Installer l'application</b> (ou <b>Ajouter à l'écran d'accueil</b>).",
    desktop: "Ouvre cette page sur ton téléphone pour installer Classeuri :",
    offlineNote: 'Hors ligne, seuls les documents déjà ouverts sur cet appareil restent lisibles.',
  },

  tabs: {
    courses: 'Cours',
    downloads: 'Téléchargements',
    settings: 'Réglages',
  },

  common: {
    back: 'Retour',
    cancel: 'Annuler',
    confirm: 'Confirmer',
    close: 'Fermer',
    retry: 'Réessayer',
    remove: 'Supprimer',
    download: 'Télécharger',
    open: 'Ouvrir',
    loading: 'Chargement…',
    pagesShort: (n: number) => `${n} p.`,
    pages: (n: number) => `${n} ${plural(n, 'page', 'pages')}`,
    documents: (n: number) => `${n} ${plural(n, 'document', 'documents')}`,
    files: (n: number) => `${n} ${plural(n, 'fichier', 'fichiers')}`,
  },

  format: {
    months: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'],
    sizeUnits: ['o', 'Ko', 'Mo', 'Go'],
    decimalSeparator: ',',
    today: "aujourd'hui",
    yesterday: 'hier',
    justNow: "à l'instant",
  },

  years: {
    premiere: '1ʳᵉ année',
    deuxieme: '2ᵉ année',
    troisieme: '3ᵉ année',
    quatrieme: '4ᵉ année',
    cinquieme: '5ᵉ année',
  },
  semester: (n: number) => `Semestre ${n}`,

  sections: {
    lesson: 'Leçon',
    exercices: 'Exercices',
    resume: 'Résumé',
    autres: 'Autres documents',
  },

  badges: {
    updated: 'Mis à jour',
    new: 'Nouveau',
  },

  home: {
    title: 'Cours',
    syncedAt: (time: string) => `Synchronisé à ${time} · tirez pour actualiser`,
    lastSyncedAt: (when: string) => `Dernière synchronisation : ${when}`,
    neverSynced: 'Jamais synchronisé · tirez pour actualiser',
    continueReading: 'Reprendre la lecture',
    continueMeta: (course: string, section: string, page: number, pages: number) =>
      `${course} · ${section} · page ${page} sur ${pages}`,
    myCourses: 'Mes cours',
    chooseYear: "Choisir l'année",
    chooseSemester: 'Choisir le semestre',
    // Kept short: it has to fit on one line of a course tile.
    tileMeta: (documents: number, offline: number) =>
      offline === 0
        ? `${documents} ${plural(documents, 'document', 'documents')}`
        : offline >= documents
          ? `${documents} docs · hors ligne`
          : `${documents} docs · ${offline} hors ligne`,
    tileMetaWeb: (documents: number) => `${documents} ${plural(documents, 'document', 'documents')}`,
    needsInternet: 'Connexion requise',
    empty: 'Aucun cours pour ce semestre.',
    emptyHint: 'Ajoutez un dossier de PDF au dépôt : il apparaîtra ici.',
  },

  pullToRefresh: {
    pull: 'Tirez pour actualiser',
    release: 'Relâchez pour actualiser',
    refreshing: 'Actualisation…',
  },

  offline: {
    banner: 'Hors ligne — les cours téléchargés restent disponibles',
  },

  sync: {
    inProgress: 'Synchronisation…',
    upToDate: 'Synchronisé. Tout est à jour',
    summary: (added: number, updated: number) => {
      const parts: string[] = [];
      if (added > 0) parts.push(`${added} ${plural(added, 'nouveau document', 'nouveaux documents')}`);
      if (updated > 0) parts.push(`${updated} ${plural(updated, 'fichier mis à jour', 'fichiers mis à jour')}`);
      return `Synchronisé. ${parts.join(', ')}`;
    },
    failed: 'Synchronisation impossible. Vérifiez votre connexion.',
  },

  course: {
    onPhone: (downloaded: number, total: number) =>
      `${downloaded} sur ${total} ${plural(total, 'document', 'documents')} sur ce téléphone`,
    downloadAll: 'Tout télécharger',
    downloadingAll: (done: number, total: number) => `Téléchargement ${done}/${total}…`,
    allDownloaded: 'Tout est téléchargé',
    emptySection: 'Aucun document dans cette section.',
    notFound: 'Cours introuvable.',
  },

  document: {
    meta: (pages: number, size: string) => `${pages} ${plural(pages, 'page', 'pages')} · ${size}`,
    onPhone: 'sur ce téléphone',
    tapToDownload: 'touchez pour télécharger',
    downloading: (percent: number) => `Téléchargement… ${percent} %`,
    updatedOn: (date: string) => `Mis à jour le ${date}`,
    withoutSolution: 'Sans corrigé',
    withSolution: 'Avec corrigé',
    bothVersions: 'les deux versions',
    removeDownload: 'Supprimer le téléchargement',
    statusDownloaded: 'Téléchargé',
    statusNotDownloaded: 'Non téléchargé',
  },

  viewer: {
    pageOf: (page: number, pages: number) => `${page} / ${pages}`,
    pageShort: (page: number) => `p. ${page}`,
    resumedAt: (page: number) => `Reprise à la page ${page}`,
    allPages: 'Toutes les pages',
    goToPage: 'Aller à la page',
    goToPagePrompt: (pages: number) => `Numéro de page (1–${pages})`,
    go: 'Aller',
    previousPage: 'Page précédente',
    nextPage: 'Page suivante',
    zoomIn: 'Zoom avant',
    zoomOut: 'Zoom arrière',
    fitWidth: 'Ajuster à la largeur',
    download: 'Télécharger',
    openInNewTab: 'Ouvrir dans un nouvel onglet',
    loading: 'Ouverture du document…',
    notFound: 'Document introuvable.',
  },

  downloads: {
    title: 'Téléchargements',
    subtitle: "Tout s'ouvre ici sans connexion.",
    onThisPhone: 'sur ce téléphone',
    groupMeta: (size: string, files: number) => `${size} · ${files} ${plural(files, 'fichier', 'fichiers')}`,
    showMore: (n: number) => `Afficher ${n} ${plural(n, 'fichier', 'fichiers')} de plus`,
    showLess: 'Afficher moins',
    removeCourseTitle: (course: string) => `Supprimer les téléchargements de « ${course} » ?`,
    removeCourseBody: 'Les fichiers resteront disponibles en ligne.',
    empty: 'Aucun téléchargement',
    emptyHint: 'Téléchargez un document ou un cours entier pour le lire hors ligne.',
  },

  settings: {
    title: 'Réglages',
    content: 'Contenu',
    source: 'Source des cours',
    sourceEdit: "Modifier l'adresse",
    sourceInvalid: 'Adresse invalide. Elle doit commencer par https://',
    lastSynced: 'Dernière synchronisation',
    never: 'Jamais',
    checkNow: 'Vérifier maintenant',
    downloads: 'Téléchargements',
    autoUpdate: 'Mettre à jour les fichiers téléchargés',
    autoUpdateHint: 'Quand un document change en ligne',
    wifiOnly: 'Uniquement en Wi-Fi',
    wifiOnlyHint: 'Économise vos données mobiles',
    storage: 'Stockage',
    removeAll: 'Supprimer tous les téléchargements',
    removeAllTitle: 'Supprimer tous les téléchargements ?',
    removeAllBody: (size: string) => `${size} seront libérés. Les cours resteront disponibles en ligne.`,
    appearance: 'Apparence',
    theme: 'Thème',
    themeSystem: 'Système',
    themeLight: 'Clair',
    themeDark: 'Sombre',
    version: (v: string) => `Version ${v}`,
  },

  errors: {
    generic: "Une erreur s'est produite.",
    network: 'Pas de connexion. Réessayez plus tard.',
    catalog: 'Impossible de charger la liste des cours.',
    catalogVersion: "Cette version de l'application est trop ancienne. Installez la dernière version.",
    pdf: "Impossible d'ouvrir ce PDF.",
    download: 'Le téléchargement a échoué.',
    wifiRequired: 'Connectez-vous au Wi-Fi pour tout télécharger, ou désactivez « Uniquement en Wi-Fi » dans Réglages.',
    offlineNotDownloaded: "Ce document n'est pas téléchargé. Connectez-vous pour l'ouvrir.",
    storageFull: "Espace insuffisant sur l'appareil.",
    pageNotFound: 'Page introuvable',
    backHome: "Retour à l'accueil",
  },
};

export type Dictionary = typeof fr;
