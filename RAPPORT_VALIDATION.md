# Rapport de validation — ZonAI (mode live)

*Généré le 2026-06-03T02:30:20.257Z · 36 tests · 36 réussis · 0 échoués · 0 échecs critiques · 2224 ms*

## Mode

Les données mock ont été supprimées. La suite teste maintenant :
- Les fonctions pures de business-rules (référentiel Mauricie, validation, avertissements)
- Les connecteurs locaux (CPTAQ in-memory, zonage Trois-Rivières in-memory)
- Les connecteurs réseau (Adresses Québec, MELCCFP BDZI)
- L'aggregator end-to-end avec adresses réelles

## Sources branchées

| Source | Mode d'accès | Couverture |
|---|---|---|
| Adresses Québec (MRNF) | ArcGIS GeocodeServer public | Québec entier |
| OpenStreetMap Nominatim | API publique, fallback | Mondial |
| MELCCFP BDZI | ArcGIS REST MapServer public | Québec entier |
| CPTAQ Déméter | Shapefile officiel, snapshot mai 2026, clipé Mauricie | Mauricie (275 polygones) |
| Canards Illimités Canada, milieux humides 2022 | ArcGIS REST public | Sud du Québec habité, 34 512 polygones bbox Mauricie |
| MAMH, rôle d'évaluation foncière géoréférencé 2026 | GPKG provincial 2.6 GB, extrait Mauricie 4.3 MB | 121 915 unités d'évaluation (31 codes municipaux) |
| Ville de Trois-Rivières, zonage municipal | Données ouvertes Données Québec, snapshot | Trois-Rivières (1 663 zones) |

## Résultats par section

### A. Règles métier pures

#### Référentiel Mauricie

| Statut | Test | Critique | Détail |
|:---:|---|:---:|---|
| ✅ | MAURICIE_MUNICIPALITIES contient >= 30 entrées |  |  |
| ✅ | MAURICIE_MRC contient exactement 6 entrées |  |  |
| ✅ | Niveaux de confiance valides |  |  |

#### Validation de fiche

| Statut | Test | Critique | Détail |
|:---:|---|:---:|---|
| ✅ | validateParcel(null) renvoie des erreurs |  |  |
| ✅ | validateParcel(objet vide) signale les champs manquants |  |  |
| ✅ | Superficie négative déclenche INVALID_AREA | 🔒 |  |

#### Avertissements dérivés

| Statut | Test | Critique | Détail |
|:---:|---|:---:|---|
| ✅ | Zone inondable oui ⇒ FLOOD_ZONE danger | 🔒 |  |
| ✅ | milieux_humides a_verifier ⇒ warn (jamais ok) | 🔒 |  |
| ✅ | Confiance partielle ⇒ PARTIAL_DATA |  |  |
| ✅ | Hors région ⇒ OUT_OF_REGION danger | 🔒 |  |

#### Détection requête vague

| Statut | Test | Critique | Détail |
|:---:|---|:---:|---|
| ✅ | Vide ⇒ vague EMPTY |  |  |
| ✅ | < 3 caractères ⇒ vague TOO_SHORT |  |  |
| ✅ | « lot » seul ⇒ vague GENERIC_TERM |  |  |
| ✅ | « Sherbrooke » accepté (laisser le moteur décider) |  |  |

### B. Connecteurs locaux

#### CPTAQ

| Statut | Test | Critique | Détail |
|:---:|---|:---:|---|
| ✅ | Centre Trois-Rivières ⇒ non agricole | 🔒 |  |
| ✅ | Louiseville rang rural ⇒ oui agricole | 🔒 |  |
| ✅ | Saint-Tite rural ⇒ oui agricole |  |  |
| ✅ | Coordonnées invalides gérées proprement |  |  |

#### Zonage Trois-Rivières

| Statut | Test | Critique | Détail |
|:---:|---|:---:|---|
| ✅ | Centre TR trouve un polygone municipal | 🔒 |  |
| ✅ | Coordonnées hors TR (La Tuque) ⇒ pas de polygone |  |  |

### C. Connecteurs réseau

#### Adresses Québec

| Statut | Test | Critique | Détail |
|:---:|---|:---:|---|
| ✅ | Adresse standard Trois-Rivières géocodée | 🔒 |  |
| ✅ | Sherbrooke géocodé hors Mauricie |  |  |
| ✅ | Chaîne vide ⇒ null |  |  |

#### MELCCFP zones inondables

| Statut | Test | Critique | Détail |
|:---:|---|:---:|---|
| ✅ | Point bord du fleuve ⇒ inondable oui | 🔒 |  |
| ✅ | La Tuque centre ⇒ non inondable |  |  |

#### Milieux humides CIC

| Statut | Test | Critique | Détail |
|:---:|---|:---:|---|
| ✅ | Polygone humide connu ⇒ humide oui + classe | 🔒 |  |
| ✅ | Centre urbain Trois-Rivières ⇒ non humide |  |  |

#### Rôle d'évaluation foncière 2026

| Statut | Test | Critique | Détail |
|:---:|---|:---:|---|
| ✅ | Adresse TR connue ⇒ unité d'évaluation trouvée avec valeur | 🔒 |  |
| ✅ | Adresse Louiseville ⇒ logements rapportés |  |  |
| ✅ | inferPotentielResidentiel sur CUBF 1212 (bifamiliale) |  |  |
| ✅ | inferPotentielResidentiel sur CUBF 1215 (4-6 logements) |  |  |

### D. Aggregator live

#### Rôle d'évaluation foncière 2026

| Statut | Test | Critique | Détail |
|:---:|---|:---:|---|
| ✅ | Trois-Rivières urbaine ⇒ status ok, 6 couches | 🔒 |  |
| ✅ | Sherbrooke ⇒ status out_of_region | 🔒 |  |
| ✅ | Requête vide ⇒ status needs_clarification | 🔒 |  |
| ✅ | Trois-Rivières inclut couche zonage municipal |  |  |
| ✅ | Cap-de-la-Madeleine bord du fleuve ⇒ zone inondable oui |  |  |

## Conclusion

✅ Tous les tests passent. Les couches branchées sont opérationnelles.
