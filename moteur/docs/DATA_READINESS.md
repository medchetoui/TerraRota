DATA_READINESS – Préparation des données NASA (TerraRota)
NASA Space Apps Challenge 2026 – Défi « Field Shift: Adapting Farms with NASA Data »
Responsable : Membre 2
Dernière mise à jour : 25 octobre 2026
> **Règle d'or :** ne jamais inventer de valeurs NASA, de variables, d'unités ou de faits agricoles. Toute donnée synthétique est marquée **FICTIF**. Ce document sera mis à jour le 28 octobre avec la documentation officielle.
---
1. Ce qui est confirmé
Défi : « Field Shift: Adapting Farms with NASA Data » (NASA Space Apps Challenge 2026).
Page officielle : spaceappschallenge.org (page du défi Field Shift).
Niveau indiqué sur la page : Intermediate / Advanced. Sujets : Earth Science, Software, Arts & Multimedia.
Description du défi : créer un outil d'aide à la décision qui utilise des observations de la Terre par la NASA, des informations locales sur les sols, les caractéristiques des cultures et les priorités des agriculteurs, pour explorer des stratégies de rotation des cultures.
État au 25 octobre 2026 : la section Resources de la page du défi indique « coming soon ». Aucun dataset n'est publié.
Date de sortie attendue : 28 octobre 2026, le même jour que la réunion d'équipe (à confirmer sur le site officiel).
2. Ce qui est inconnu (rien n'est supposé)
Nom du dataset et page officielle de documentation.
Méthode d'accès (téléchargement, API, autre).
Conditions d'utilisation.
Variables disponibles, unités, résolution spatiale et temporelle, couverture temporelle.
Format de fichier et système de coordonnées.
Codage des valeurs manquantes.
Couverture géographique, en particulier du Maroc.
3. Hypothèses à vérifier (non confirmées)
Ces points sont plausibles pour un défi agricole, mais la page du défi ne les mentionne pas. Ils ne doivent pas être traités comme des faits.
Des variables liées aux précipitations, à la température ou à l'humidité du sol pourraient être utiles.
Le dataset pourrait être fourni sous forme de fichiers téléchargeables ou d'une API.
4. Questions ouvertes
Le dataset sera-t-il publié le 28 octobre, avant ou après la réunion ?
Couvre-t-il le Maroc, et à quelle résolution ?
Quelles variables correspondent aux besoins des cultures candidates choisies par le Membre 1 ?
Quelles sont les conditions d'utilisation et les obligations de citation ?
Les données ont-elles une date de fraîcheur claire (dernière mise à jour) ?
5. Plan d'accès aux données
Vérifier la page du défi sur spaceappschallenge.org le 28 octobre (section Resources).
Ouvrir la documentation officielle du dataset et lire les conditions d'utilisation.
Noter la méthode d'accès (téléchargement ou API) et les limites éventuelles.
Télécharger un petit échantillon pour inspecter le vrai schéma.
Si le dataset n'est pas accessible à temps : documenter le blocage ici et fixer la prochaine étape avec l'équipe.
6. Contrat de données proposé
Proposition au 25 octobre 2026. Les champs et les unités seront confirmés ou corrigés avec la documentation officielle le jour de la sortie. Les exemples sont FICTIFS.
Champ	Type	Exemple (FICTIF)	Règle de validation
`observation`	texte	`precipitation`	non vide
`value`	nombre	`12.4`	nombre valide, pas vide
`unit`	texte	`mm`	non vide, cohérente avec l'observation
`date`	date	`2026-10-01`	format valide, pas dans le futur
`source`	texte	`FICTIF`	non vide
`latitude`	nombre	`33.57`	entre -90 et 90
`longitude`	nombre	`-7.58`	entre -180 et 180
`resolution`	texte	`0.5deg`	optionnel
`quality_flag`	texte	`good`	optionnel
7. Plan de validation
Le script `validate_dataset.py` doit détecter et signaler :
valeurs manquantes ;
doublons ;
coordonnées invalides (latitude ou longitude hors limites) ;
dates invalides ou mal formatées ;
unités inattendues ;
observations trop anciennes (données périmées) ;
observations non disponibles.
Les noms de colonnes et les unités attendues sont placés en haut du script pour être modifiés facilement le 28 octobre.
Les tests sont dans `tests/test_dataset_validation.py`, avec au moins un test par type d'erreur.
8. Données fictives utilisées avant la sortie
Fichier : `tests/fixtures/sample_fictif.csv` (environ 10 lignes).
Il est entièrement fictif et la colonne `source` indique `FICTIF`.
Il contient volontairement des erreurs pour tester le validateur : date invalide, valeur manquante, doublon, coordonnée impossible, unité inattendue, observation trop ancienne.
Ces données ne doivent jamais être présentées comme de vraies observations NASA.
9. Plan du jour de la sortie (28 octobre)
Lire la documentation officielle et les conditions d'utilisation.
Noter le vrai schéma : colonnes, unités, dates, résolution, valeurs manquantes, coordonnées.
Comparer avec le contrat de données proposé et le corriger. Ne pas supposer que la proposition est exacte.
Adapter `validate_dataset.py` (noms de colonnes et unités attendues).
Relancer les tests, puis tester sur un échantillon réel.
Mettre à jour ce document : passer les hypothèses confirmées en section 1 et noter ce qui reste inconnu.
10. Sources et liens
Page du défi Field Shift : spaceappschallenge.org (https://www.spaceappschallenge.org/2026/challenges/adapting-farms-with-nasa-data/?tab=resources).
Documentation officielle du dataset : à ajouter après publication.
Conditions d'utilisation : à ajouter après publication.
11. Hors périmètre avant le 28
Le calcul des indicateurs et le moteur de recommandation sont traités après le 28 octobre. Avant cette date, l'équipe utilise une recommandation fictive clairement étiquetée FICTIF.