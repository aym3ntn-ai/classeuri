# Classeuri

Ma bibliothèque de cours : un site web et une application Android alimentés par
les PDF de ce dépôt. Pas de serveur, pas de base de données, pas de compte.

- **Site :** https://aym3ntn-ai.github.io/classeuri/
- **iPhone et iPad :** [installer depuis le site](https://aym3ntn-ai.github.io/classeuri/installer/)
- **Application Android :** [télécharger l'APK](https://github.com/aym3ntn-ai/classeuri/releases/latest/download/classeuri.apk) · [toutes les versions](https://github.com/aym3ntn-ai/classeuri/releases)

## Ajouter un cours

Un cours est un dossier de PDF. Il suffit de le pousser sur `main` : le site et
l'application le récupèrent tout seuls, sans toucher au code.

```
<année>/<semestre>/<NOM DU COURS>/<section>/<fichier>.pdf
```

Exemple :

```
premiere/semestre-1/CIRCUIT NUMERIQUE/lesson/Chapitre 1.pdf
premiere/semestre-1/CIRCUIT NUMERIQUE/exercices/serie 1.pdf
premiere/semestre-1/CIRCUIT NUMERIQUE/exercices/serie 1 corrigé.pdf
premiere/semestre-1/CIRCUIT NUMERIQUE/resume/Fiche.pdf
```

| Dossier | Affiché comme |
|---|---|
| `lesson` | Leçon |
| `exercices` (ou `excercices`) | Exercices |
| `resume` | Résumé |
| autre dossier | Autres documents |

À savoir :

- **Titre du document** : le nom du fichier, sans `.pdf`.
- **Corrigés** : un fichier dont le nom contient « corrigé », « correction » ou
  « solution » est associé à la série du même nom. Le lecteur propose alors
  « Sans corrigé » / « Avec corrigé ».
- **PDF posé directement dans le dossier du cours** : la section est devinée
  d'après le nom (`Cours…` → Leçon, `serie…` / `TD…` → Exercices, `Resume…` →
  Résumé).
- **Ignorés** : les fichiers qui ne sont pas des PDF et les dossiers vides.
- **PDF illisible** : la publication échoue et indique le fichier en cause.

Ensuite :

```bash
git add . && git commit -m "Ajout de cours" && git push
```

Le site est à jour quelques minutes plus tard. Dans l'application, tirez
l'écran « Cours » vers le bas : les nouveautés sont marquées « Nouveau » et
« Mis à jour ».

### Personnaliser un cours (facultatif)

Par défaut, le nom affiché vient du nom du dossier
(`CIRCUIT ELECT ET MAGNETIQUE` → « Circuit Élect. et Magnétique »). Pour le
changer, ajoutez un fichier `course.yml` dans le dossier du cours :

```yaml
name: Circuits électriques et magnétiques
code: CEM 101
accent: teal        # teal, cobalt, vermilion, saffron ou #RRGGBB
icon: bolt          # book, bolt, chip, wave, atom, function, code, flask, globe, gear
```

## Installer l'application Android

1. Sur le téléphone, téléchargez
   [classeuri.apk](https://github.com/aym3ntn-ai/classeuri/releases/latest/download/classeuri.apk)
   (toujours la dernière version). Aucun compte GitHub n'est nécessaire.
2. Les versions précédentes sont sur la page
   [Releases](https://github.com/aym3ntn-ai/classeuri/releases).
3. Ouvrez le fichier téléchargé. Si Android le demande, autorisez l'installation depuis cette
   source (navigateur ou gestionnaire de fichiers).
4. Pour mettre à jour, installez simplement la version suivante par-dessus :
   les cours téléchargés et les réglages sont conservés.

Une nouvelle version n'est publiée que lorsque le code de l'application change,
jamais lors d'un simple ajout de PDF.

## Installer sur iPhone ou iPad

Pas d'App Store : le site s'installe comme une application (PWA), gratuitement.

1. Ouvrez https://aym3ntn-ai.github.io/classeuri/ dans **Safari**.
2. Touchez **Partager** (le carré avec une flèche vers le haut). S'il n'est pas
   visible, touchez d'abord **•••**.
3. Choisissez **Sur l'écran d'accueil**, puis **Ajouter**.

Classeuri s'ouvre alors en plein écran depuis son icône. Les documents déjà
ouverts restent lisibles sans connexion. Les instructions détaillées sont sur la
page [Installer l'application](https://aym3ntn-ai.github.io/classeuri/installer/).

## Contenu

Le dépôt et le site sont publics : n'y déposez que des documents que vous avez
le droit de partager. Les pages demandent aux moteurs de recherche de ne pas
les indexer.

## Pour aller plus loin

Documentation technique, en anglais :

- [app/README.md](app/README.md) — application Android
- [web/README.md](web/README.md) — site web
- [docs/ANDROID_SIGNING.md](docs/ANDROID_SIGNING.md) — clé de signature et publication d'une version
- [docs/catalog.example.json](docs/catalog.example.json) — exemple de `catalog.json`
