# « سول بالدارجة » : questions du fellah à la voix (page /advisor)

## Ce qui est ajouté

- **Page `/advisor`** : bloc « سول بالدارجة » au-dessus du conseil vocal « عمي أحمد » (inchangé).
  - 🎤 : reconnaissance vocale du navigateur (Web Speech API, `ar-MA`, puis `ar` si Chrome refuse `ar-MA`).
  - Champ « اكتب سؤالك » et 6 boutons de questions : toujours affichés, la démo marche sans micro.
  - **« الأرض ديالي »** : si le formulaire a donné un résultat, la question porte sur CETTE parcelle (résumé affiché) ;
    **« أمثلة »** : un des 2 scénarios de démo.
  - Réponse en darija (`dir="rtl"`), 2 ou 3 phrases courtes ; 🔊 joue les clips enregistrés (voix humaine), clip absent = texte seul.
- **Backend `backend/fellah/`** (aucune base de données, aucun appel réseau) :
  - `POST /api/v1/fellah/question/` : `{"question", "parcelle": {...}}` (moteur du Membre 2 lancé sur la parcelle) ou `{"question", "scenario"}`.
  - `GET /api/v1/fellah/scenarios/` : scénarios de démo, suggestions, 10 questions de test.
  - Développement seulement (`DEBUG`) : `journal/` (test voix), `phrases/` et `phrases/<id>/` (relecture), `clips/<id>/` (enregistrement).

## Parcelle du formulaire → moteur du Membre 2 (`fellah/parcelle.py`)

| Formulaire | Moteur (`report.analyze`) | Absent ou inconnu du moteur |
|---|---|---|
| `indicators.annual_rain_mm` (NASA, `live`/`cached`) | `conditions.rain_mm` | inconnu (`None`), aussi si données `sample` |
| `indicators.mean_annual_temp_c` | `conditions.temp_c` | inconnu |
| — | `conditions.ph`, `conditions.salinity_dsm` | toujours inconnus (pas dans le formulaire) |
| `water_access` rainfed / irrigated / partial | `irrigated` False / True / inconnu | |
| `previous_crop` wheat_hard, wheat_soft, barley, olive, chickpea, potato, lentil, faba_bean | `history` ble_dur, ble_tendre, orge, olivier, pois_chiche, pomme_de_terre, lentille, feve (année − 1) | argan, tomato, cactus_pear, almond, fallow → historique vide |
| `field_size_ha` | `area_ha` | inconnu si absent ou ≤ 0 |
| `soil_type` | non utilisé (le moteur attend pH et salinité) | |
| culture citée dans la question | plan `[{P1, culture, surface}]` | pas de culture → pas de plan, le moteur propose |

« القمح » sans précision = le blé cultivé l'an dernier (dur ou tendre) s'il est connu. Une donnée inconnue n'est
jamais remplacée : le moteur baisse sa confiance et la réponse le dit (« ما عندنا حتى معلومة على هاد الأرض »,
« ما عرفناش واش عندك السقي »…), toujours suivie de « سول المستشار ».

## Micro : darija, arabe standard ou mélange

Le navigateur écrit souvent en arabe standard (« ماذا أزرع هذا العام؟ ») : mots-clés ajoutés pour ces formes ;
normalisation أ/إ/آ → ا, ة → ه, ى → ي, mots collés à و/ف/ب/ال. Testé : 51 variantes des 10 questions de test.

## Préparer la démo (développement)

- **`/advisor?enregistrer`** : chaque phrase des 21 clips de la démo en grand, avec le nom du fichier ;
  ⏺ / ⏹ / ▶ / ✓ garder / ↺ refaire ; conversion dans le navigateur en WAV mono 16 bits 16000 Hz (silences coupés),
  écrit par le backend dans `frontend/public/audio/darija/<id>.wav` ; compteur « X / 21 ». Case « toutes les phrases ».
- **`/advisor?relire`** : chaque phrase avec son sens ; ✓ OK ou ✎ modifier (écriture arabe, sans chiffre).
  Statut « validé par Ranya » dans `backend/fellah/darija/templates_darija.json` ; les 20 questions de test sont
  relancées sur les 2 scénarios (types corrects, chiffres) ; un clip dont le texte a changé est marqué « à refaire ».

## Lancer et tester

```
cd backend   &&  set DB_ENGINE=sqlite  &&  ..\.venv\Scripts\python manage.py runserver 8000
cd frontend  &&  npm run dev                     → http://localhost:5173/advisor
cd backend   &&  set DB_ENGINE=sqlite  &&  python -m pytest
cd frontend  &&  npm run build  &&  npm run test:e2e   (serveurs lancés ; /recommendations bloqué ou simulé : aucun appel NASA)
```

## Limites

| Limite | État |
|---|---|
| Phrases darija | corrigées ; à valider une par une sur `/advisor?relire` |
| Parcelle | reliée au formulaire ; pH et salinité toujours inconnus ; cultures hors moteur (argan, tomate, figuier de Barbarie, amandier) non évaluées |
| Clips | page d'enregistrement prête ; 0 / 21 enregistrés |
| Micro | Chrome/Edge + internet ; arabe standard et mélange compris en texte ; pas encore mesuré sur 10 vraies voix |
| Copie du modèle | `backend/fellah/darija/` copie le dépôt du Membre 3 ; corrections reprises avec `importer_validations.py` |
