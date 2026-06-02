# Rapport de validation — TerraMauricie

*Généré le 2026-06-01T23:54:14.818Z · 158 tests · 158 réussis · 0 échoués · 0 échecs critiques · 84 ms*

## Couverture

- **Dataset mock** : 15 fiches
- **Région Mauricie** : 14 fiches
- **Hors région (test de rejet)** : 1 fiche(s)
- **MRC représentées** : 6/6
- **Cas avec données partielles** : 3
- **Cas en zone inondable** : 2
- **Cas humides à vérifier** : 4
- **Cas piège (superficie invalide)** : 1

## Résultats par section

### A. Données

#### Intégrité des fiches

| Statut | Test | Critique | Détail |
|:---:|---|:---:|---|
| ✅ | [TM-001] Tous les champs obligatoires sont présents | 🔒 |  |
| ✅ | [TM-002] Tous les champs obligatoires sont présents | 🔒 |  |
| ✅ | [TM-003] Tous les champs obligatoires sont présents | 🔒 |  |
| ✅ | [TM-004] Tous les champs obligatoires sont présents | 🔒 |  |
| ✅ | [TM-005] Tous les champs obligatoires sont présents | 🔒 |  |
| ✅ | [TM-006] Tous les champs obligatoires sont présents | 🔒 |  |
| ✅ | [TM-007] Tous les champs obligatoires sont présents | 🔒 |  |
| ✅ | [TM-008] Tous les champs obligatoires sont présents | 🔒 |  |
| ✅ | [TM-009] Tous les champs obligatoires sont présents | 🔒 |  |
| ✅ | [TM-010] Tous les champs obligatoires sont présents | 🔒 |  |
| ✅ | [TM-011] Tous les champs obligatoires sont présents | 🔒 |  |
| ✅ | [TM-012] Tous les champs obligatoires sont présents | 🔒 |  |
| ✅ | [TM-013] Tous les champs obligatoires sont présents | 🔒 |  |
| ✅ | [TM-014] Tous les champs obligatoires sont présents | 🔒 |  |
| ✅ | [TM-015] Tous les champs obligatoires sont présents | 🔒 |  |

#### Types et plages

| Statut | Test | Critique | Détail |
|:---:|---|:---:|---|
| ✅ | [TM-001] Superficie cohérente avec la règle métier | 🔒 |  |
| ✅ | [TM-001] Valeur foncière numérique ou null |  |  |
| ✅ | [TM-001] niveau_confiance dans la liste autorisée |  |  |
| ✅ | [TM-001] zone_inondable / milieux_humides ternaires |  |  |
| ✅ | [TM-001] date_mise_a_jour est une date valide |  |  |
| ✅ | [TM-001] usages_permis, contraintes, sources sont des tableaux |  |  |
| ✅ | [TM-002] Superficie cohérente avec la règle métier | 🔒 |  |
| ✅ | [TM-002] Valeur foncière numérique ou null |  |  |
| ✅ | [TM-002] niveau_confiance dans la liste autorisée |  |  |
| ✅ | [TM-002] zone_inondable / milieux_humides ternaires |  |  |
| ✅ | [TM-002] date_mise_a_jour est une date valide |  |  |
| ✅ | [TM-002] usages_permis, contraintes, sources sont des tableaux |  |  |
| ✅ | [TM-003] Superficie cohérente avec la règle métier | 🔒 |  |
| ✅ | [TM-003] Valeur foncière numérique ou null |  | null autorisé (données partielles) |
| ✅ | [TM-003] niveau_confiance dans la liste autorisée |  |  |
| ✅ | [TM-003] zone_inondable / milieux_humides ternaires |  |  |
| ✅ | [TM-003] date_mise_a_jour est une date valide |  |  |
| ✅ | [TM-003] usages_permis, contraintes, sources sont des tableaux |  |  |
| ✅ | [TM-004] Superficie cohérente avec la règle métier | 🔒 |  |
| ✅ | [TM-004] Valeur foncière numérique ou null |  |  |
| ✅ | [TM-004] niveau_confiance dans la liste autorisée |  |  |
| ✅ | [TM-004] zone_inondable / milieux_humides ternaires |  |  |
| ✅ | [TM-004] date_mise_a_jour est une date valide |  |  |
| ✅ | [TM-004] usages_permis, contraintes, sources sont des tableaux |  |  |
| ✅ | [TM-005] Superficie cohérente avec la règle métier | 🔒 |  |
| ✅ | [TM-005] Valeur foncière numérique ou null |  |  |
| ✅ | [TM-005] niveau_confiance dans la liste autorisée |  |  |
| ✅ | [TM-005] zone_inondable / milieux_humides ternaires |  |  |
| ✅ | [TM-005] date_mise_a_jour est une date valide |  |  |
| ✅ | [TM-005] usages_permis, contraintes, sources sont des tableaux |  |  |
| ✅ | [TM-006] Superficie cohérente avec la règle métier | 🔒 |  |
| ✅ | [TM-006] Valeur foncière numérique ou null |  |  |
| ✅ | [TM-006] niveau_confiance dans la liste autorisée |  |  |
| ✅ | [TM-006] zone_inondable / milieux_humides ternaires |  |  |
| ✅ | [TM-006] date_mise_a_jour est une date valide |  |  |
| ✅ | [TM-006] usages_permis, contraintes, sources sont des tableaux |  |  |
| ✅ | [TM-007] Superficie cohérente avec la règle métier | 🔒 |  |
| ✅ | [TM-007] Valeur foncière numérique ou null |  |  |
| ✅ | [TM-007] niveau_confiance dans la liste autorisée |  |  |
| ✅ | [TM-007] zone_inondable / milieux_humides ternaires |  |  |
| ✅ | [TM-007] date_mise_a_jour est une date valide |  |  |
| ✅ | [TM-007] usages_permis, contraintes, sources sont des tableaux |  |  |
| ✅ | [TM-008] Superficie cohérente avec la règle métier | 🔒 |  |
| ✅ | [TM-008] Valeur foncière numérique ou null |  |  |
| ✅ | [TM-008] niveau_confiance dans la liste autorisée |  |  |
| ✅ | [TM-008] zone_inondable / milieux_humides ternaires |  |  |
| ✅ | [TM-008] date_mise_a_jour est une date valide |  |  |
| ✅ | [TM-008] usages_permis, contraintes, sources sont des tableaux |  |  |
| ✅ | [TM-009] Superficie cohérente avec la règle métier | 🔒 |  |
| ✅ | [TM-009] Valeur foncière numérique ou null |  |  |
| ✅ | [TM-009] niveau_confiance dans la liste autorisée |  |  |
| ✅ | [TM-009] zone_inondable / milieux_humides ternaires |  |  |
| ✅ | [TM-009] date_mise_a_jour est une date valide |  |  |
| ✅ | [TM-009] usages_permis, contraintes, sources sont des tableaux |  |  |
| ✅ | [TM-010] Superficie cohérente avec la règle métier | 🔒 |  |
| ✅ | [TM-010] Valeur foncière numérique ou null |  |  |
| ✅ | [TM-010] niveau_confiance dans la liste autorisée |  |  |
| ✅ | [TM-010] zone_inondable / milieux_humides ternaires |  |  |
| ✅ | [TM-010] date_mise_a_jour est une date valide |  |  |
| ✅ | [TM-010] usages_permis, contraintes, sources sont des tableaux |  |  |
| ✅ | [TM-011] Superficie cohérente avec la règle métier | 🔒 |  |
| ✅ | [TM-011] Valeur foncière numérique ou null |  |  |
| ✅ | [TM-011] niveau_confiance dans la liste autorisée |  |  |
| ✅ | [TM-011] zone_inondable / milieux_humides ternaires |  |  |
| ✅ | [TM-011] date_mise_a_jour est une date valide |  |  |
| ✅ | [TM-011] usages_permis, contraintes, sources sont des tableaux |  |  |
| ✅ | [TM-012] Superficie cohérente avec la règle métier | 🔒 |  |
| ✅ | [TM-012] Valeur foncière numérique ou null |  | null autorisé (données partielles) |
| ✅ | [TM-012] niveau_confiance dans la liste autorisée |  |  |
| ✅ | [TM-012] zone_inondable / milieux_humides ternaires |  |  |
| ✅ | [TM-012] date_mise_a_jour est une date valide |  |  |
| ✅ | [TM-012] usages_permis, contraintes, sources sont des tableaux |  |  |
| ✅ | [TM-013] Superficie cohérente avec la règle métier | 🔒 |  |
| ✅ | [TM-013] Valeur foncière numérique ou null |  |  |
| ✅ | [TM-013] niveau_confiance dans la liste autorisée |  |  |
| ✅ | [TM-013] zone_inondable / milieux_humides ternaires |  |  |
| ✅ | [TM-013] date_mise_a_jour est une date valide |  |  |
| ✅ | [TM-013] usages_permis, contraintes, sources sont des tableaux |  |  |
| ✅ | [TM-014] Superficie cohérente avec la règle métier | 🔒 |  |
| ✅ | [TM-014] Valeur foncière numérique ou null |  |  |
| ✅ | [TM-014] niveau_confiance dans la liste autorisée |  |  |
| ✅ | [TM-014] zone_inondable / milieux_humides ternaires |  |  |
| ✅ | [TM-014] date_mise_a_jour est une date valide |  |  |
| ✅ | [TM-014] usages_permis, contraintes, sources sont des tableaux |  |  |
| ✅ | [TM-015] Superficie cohérente avec la règle métier | 🔒 |  |
| ✅ | [TM-015] Valeur foncière numérique ou null |  |  |
| ✅ | [TM-015] niveau_confiance dans la liste autorisée |  |  |
| ✅ | [TM-015] zone_inondable / milieux_humides ternaires |  |  |
| ✅ | [TM-015] date_mise_a_jour est une date valide |  |  |
| ✅ | [TM-015] usages_permis, contraintes, sources sont des tableaux |  |  |

#### Couverture régionale

| Statut | Test | Critique | Détail |
|:---:|---|:---:|---|
| ✅ | Les 6 MRC de la Mauricie sont représentées |  |  |
| ✅ | Chaque municipalité Mauricie utilisée est connue du registre |  |  |
| ✅ | Au moins une fiche hors région existe (test de rejet) |  |  |
| ✅ | Au moins un cas avec données partielles |  |  |
| ✅ | Au moins un cas en zone inondable |  |  |
| ✅ | Au moins un cas avec milieux humides à vérifier |  |  |

#### Cohérence résumé IA ↔ contraintes

| Statut | Test | Critique | Détail |
|:---:|---|:---:|---|
| ✅ | [TM-001] Résumé IA cohérent avec les contraintes structurées | 🔒 |  |
| ✅ | [TM-002] Résumé IA cohérent avec les contraintes structurées | 🔒 |  |
| ✅ | [TM-003] Résumé IA cohérent avec les contraintes structurées | 🔒 |  |
| ✅ | [TM-004] Résumé IA cohérent avec les contraintes structurées | 🔒 |  |
| ✅ | [TM-005] Résumé IA cohérent avec les contraintes structurées | 🔒 |  |
| ✅ | [TM-006] Résumé IA cohérent avec les contraintes structurées | 🔒 |  |
| ✅ | [TM-007] Résumé IA cohérent avec les contraintes structurées | 🔒 |  |
| ✅ | [TM-008] Résumé IA cohérent avec les contraintes structurées | 🔒 |  |
| ✅ | [TM-009] Résumé IA cohérent avec les contraintes structurées | 🔒 |  |
| ✅ | [TM-010] Résumé IA cohérent avec les contraintes structurées | 🔒 |  |
| ✅ | [TM-011] Résumé IA cohérent avec les contraintes structurées | 🔒 |  |
| ✅ | [TM-012] Résumé IA cohérent avec les contraintes structurées | 🔒 |  |
| ✅ | [TM-013] Résumé IA cohérent avec les contraintes structurées | 🔒 |  |
| ✅ | [TM-014] Résumé IA cohérent avec les contraintes structurées | 🔒 |  |
| ✅ | [TM-015] Résumé IA cohérent avec les contraintes structurées | 🔒 |  |

### B. Règles métier

#### Avertissements automatiques

| Statut | Test | Critique | Détail |
|:---:|---|:---:|---|
| ✅ | Zone inondable = oui ⇒ avertissement danger visible | 🔒 |  |
| ✅ | Milieux humides = à_vérifier ⇒ avertissement de prudence | 🔒 |  |
| ✅ | Niveau de confiance = partiel ⇒ avertissement « données partielles » | 🔒 |  |
| ✅ | Aucune fiche avec milieux_humides=a_verifier n'est marquée « sans contrainte » | 🔒 |  |
| ✅ | Hors région ⇒ règle bloquante | 🔒 |  |
| ✅ | Superficie négative ⇒ règle bloquante | 🔒 |  |
| ✅ | Zonage ambigu / contradictoire ⇒ avertissement |  |  |
| ✅ | Zone agricole sans mention CPTAQ ⇒ rappel info |  |  |
| ✅ | Usages permis vides ⇒ avertissement « aucun usage documenté » | 🔒 |  |

### C. Recherche

#### Requêtes vagues

| Statut | Test | Critique | Détail |
|:---:|---|:---:|---|
| ✅ | Requête vide ⇒ status needs_clarification | 🔒 |  |
| ✅ | Requête « lot » seule ⇒ besoin de clarification |  |  |
| ✅ | Requête de 2 caractères ⇒ besoin de clarification |  |  |

#### Requêtes par numéro de lot

| Statut | Test | Critique | Détail |
|:---:|---|:---:|---|
| ✅ | Lot exact retrouve la fiche | 🔒 |  |
| ✅ | Lot sans espaces retrouve la fiche |  |  |

#### Requêtes par municipalité

| Statut | Test | Critique | Détail |
|:---:|---|:---:|---|
| ✅ | Recherche « Shawinigan » renvoie au moins 2 fiches |  |  |
| ✅ | Recherche « Trois-Rivières » ne propose que des fiches Mauricie | 🔒 |  |
| ✅ | Recherche avec accents / sans accents donne le même résultat |  |  |

#### Requêtes naturelles

| Statut | Test | Critique | Détail |
|:---:|---|:---:|---|
| ✅ | « terrain résidentiel Shawinigan » trouve des résultats pertinents |  |  |
| ✅ | « agricole Maskinongé » retourne au moins 1 fiche agricole |  |  |

#### Filtres

| Statut | Test | Critique | Détail |
|:---:|---|:---:|---|
| ✅ | Filtre MRC=Mékinac réduit aux fiches Mékinac |  |  |
| ✅ | Filtre exclureRisques masque les fiches zone inondable=oui |  |  |

#### Rejets et masquages

| Statut | Test | Critique | Détail |
|:---:|---|:---:|---|
| ✅ | Recherche « Sherbrooke » ne renvoie aucun résultat affichable | 🔒 |  |
| ✅ | La fiche TM-006 (superficie négative) n'apparaît jamais dans les résultats | 🔒 |  |
| ✅ | Recherche d'une chaîne aléatoire ⇒ empty + suggestion |  |  |

### D. Cas limites

#### Rejets et masquages

| Statut | Test | Critique | Détail |
|:---:|---|:---:|---|
| ✅ | getParcelById sur ID inexistant renvoie null |  |  |
| ✅ | getParcelById sur ID valide renvoie la fiche |  |  |
| ✅ | validateParcel sur objet null renvoie des erreurs |  |  |
| ✅ | validateParcel sur objet vide renvoie tous les champs manquants |  |  |
| ✅ | detectVagueQuery sur null/undefined ⇒ vague |  |  |
| ✅ | deriveWarnings sur null ne plante pas |  |  |
| ✅ | Volumes : la recherche reste rapide (<100 ms sur dataset complet, 1000 itérations) |  | 1000 recherches en 79 ms |
| ✅ | Une fiche bâtiment_existant=oui n'efface pas les avertissements environnementaux | 🔒 |  |

## Cas limites explicitement évalués

| Cas | Fiche / scénario | Comportement attendu | Vérifié |
|---|---|---|:---:|
| Superficie négative ou nulle | TM-006 (`superficie_m2 = -250`) | Bloquée par règle métier, jamais affichée | ✅ |
| Région hors Mauricie | TM-015 (Sherbrooke, Estrie) | Bloquée + comptée dans `blockedFromDisplay` | ✅ |
| Valeur foncière manquante | TM-003, TM-012 (`valeur_fonciere = null`) | Acceptée, affichée « Non disponible » | ✅ |
| Usages permis vides | TM-008 (Parent, La Tuque) | Avertissement « aucun usage documenté » | ✅ |
| Milieux humides à vérifier | TM-003, TM-005, TM-006, TM-008 | Avertissement de prudence (jamais « sans contrainte ») | ✅ |
| Zone inondable confirmée | TM-002, TM-011 | Avertissement `danger` visible avant le résumé | ✅ |
| Zonage contradictoire | TM-014 (Saint-Tite) | Avertissement « zonage ambigu » | ✅ |
| Requête vide | `""` | Status `needs_clarification` + message guide | ✅ |
| Requête trop courte | `"ab"` | Status `needs_clarification` | ✅ |
| Requête générique | `"lot"`, `"terrain"` | Status `needs_clarification` | ✅ |
| Requête sans correspondance | `"zxqwertyplanet"` | Status `empty` + suggestion | ✅ |
| Recherche hors région | `"Sherbrooke"` | Status `empty` + `blockedFromDisplay >= 1` | ✅ |
| Insensibilité aux accents | `Trois-Rivières` vs `Trois-Rivieres` | Mêmes résultats | ✅ |
| Lot avec/sans espaces | `"2 510 783"` vs `"2510783"` | Même fiche TM-005 trouvée | ✅ |
| ID inconnu sur page détail | `getParcelById("TM-XXX")` | Renvoie `null` → 404 `not-found` | ✅ |
| Charge : 1000 recherches | dataset complet | < 1500 ms (réel ≈ 85 ms) | ✅ |

## Historique des corrections appliquées

### Itération 1 — Régression détectée par les tests

**Échec critique** : « Recherche `Sherbrooke` ne renvoie aucun résultat affichable »

- **Cause** : `detectVagueQuery` rejetait toute requête mono-mot sans ancrage Mauricie (« Sherbrooke », chaîne aléatoire) en renvoyant `needs_clarification`. La fiche hors région n'était donc jamais comparée à la règle bloquante `OUT_OF_REGION`, et l'utilisateur ne voyait pas que des fiches avaient été masquées.
- **Correction** : assouplissement de `detectVagueQuery` — seules les requêtes vides, < 3 caractères ou réduites à un terme générique strict (`lot`, `terrain`, `maison`…) sont bloquées en amont. Le reste est transmis au moteur, qui retourne `empty` + `blockedFromDisplay` lorsque toutes les correspondances sont rejetées.
- **Conséquence** : la transparence sur les rejets régionaux est restaurée. Une recherche « Sherbrooke » affiche maintenant un état vide explicite, et le bandeau « 1 fiche masquée par les règles métier » est rendu.
- **Tests qui re-passent** : 2 tests (1 critique).

### Itération 2 — Vérification post-correction

- 158 tests exécutés, 158 réussis, 0 échec critique.
- Aucune régression ailleurs (filtres, accents, lots, NL, cas limites).

## Conclusion

✅ **Tous les tests passent.** La plateforme TerraMauricie respecte ses règles métier sur le dataset mock fourni.

---
_Suite exécutée par `node tests/validate.mjs` — aucune dépendance npm requise._
