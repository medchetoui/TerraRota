# « سول بالدارجة » : questions du fellah à la voix (page /advisor)

## Ce qui est ajouté

- **Page `/advisor`** : nouveau bloc « سول بالدارجة » au-dessus du conseil vocal « عمي أحمد » (inchangé).
  - 🎤 : reconnaissance vocale du navigateur (Web Speech API, `ar-MA`, puis `ar` si Chrome refuse `ar-MA`).
  - Champ « اكتب سؤالك » et 6 boutons de questions : toujours affichés, la démo marche sans micro.
  - Réponse en darija (écriture arabe, `dir="rtl"`), 2 ou 3 phrases courtes, traduction en petit.
  - 🔊 joue les clips enregistrés (voix humaine) l'un après l'autre ; clip absent = texte seul, jamais de voix de synthèse.
  - Composant : `frontend/src/components/FellahQuestion.tsx` ; appels : `frontend/src/api/client.ts`.
- **Backend `backend/fellah/`** (aucun modèle de base de données, aucun appel réseau) :
  - `POST /api/v1/fellah/question/` `{"question": "...", "scenario": "cereales_apres_cereale"}` → intention, culture, phrases (darija, français, URL du clip ou `null`), texte, temps en ms.
  - `GET /api/v1/fellah/scenarios/` → scénarios de démo, suggestions, 10 questions de test.
  - `POST /api/v1/fellah/journal/` → note un essai du test voix (seulement si `DEBUG`), dans `backend/sorties/voix_app_<date>.jsonl` (ignoré par git).
  - Le texte de la question est compris par mots-clés (darija en écriture arabe ou en lettres latines) ; la réponse
    vient de la sortie du moteur du Membre 2 (`moteur/engine`, `report.analyze`) : aucun nombre inventé, une
    question hors sujet est renvoyée vers le conseiller.
- **Clips** : `frontend/public/audio/darija/<id>.wav` (WAV mono 16 bits, 16000 ou 22050 Hz). Liste des 21 clips de la démo : `CLIPS_DEMO_HIBA.md` (Membre 3).

## Lancer

```
cd backend
set DB_ENGINE=sqlite            (si MySQL n'est pas lancé)
..\.venv\Scripts\python manage.py runserver 8000
cd ..\frontend
npm run dev                      → http://localhost:5173/advisor
```

## Tester

```
cd backend   &&  set DB_ENGINE=sqlite  &&  python -m pytest            (tests de l'équipe + backend/fellah/tests.py)
cd frontend  &&  npm run build
cd frontend  &&  npm run test:e2e   (serveurs lancés ; Chrome sans interface ; l'appel /recommendations, qui interroge NASA, est bloqué)
```

Le test de bout en bout vérifie : chargement de `/advisor` sans erreur dans la console, question écrite,
suggestions, « salam » et questions hors sujet, absence de chiffres, navigateur sans reconnaissance vocale,
micro refusé / sans internet, lecture 🔊 si des clips existent, et que `/`, `/recommendation`, `/weather` s'affichent.

**Test voix (à faire par une personne)** : ouvrir `http://localhost:5173/advisor?test-voix`, choisir la question
dans la liste en pointillé, toucher 🎤 et la dire ; la liste passe à la suivante. Score GO / NO-GO (au moins 8
types corrects sur 10) avec `evaluer_voix.py` du Membre 3 sur `backend/sorties/voix_app_<date>.jsonl`.

## Limites

- Questions et phrases : brouillons corrigés, **à valider par une locutrice native** (statut « corrigé – à valider »).
- **2 scénarios de démo** seulement (« blé après blé », « plan équilibré ») ; pas encore relié à la parcelle saisie dans le formulaire.
- **Clips à enregistrer** : 0 / 21 pour l'instant ; sans clip, la réponse reste en texte.
- **Micro** : Chrome (ou Edge) et une connexion internet (la reconnaissance passe par le service du navigateur) ;
  la reconnaissance de la darija n'est pas encore mesurée avec de vraies voix. Ailleurs : texte et boutons.
- Les fichiers du modèle darija (`backend/fellah/darija/`) sont une copie du dépôt du Membre 3 ; les mettre à jour ensemble.
