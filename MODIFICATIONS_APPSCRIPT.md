# Modifications à apporter dans le script Google Apps Script (Code.gs)

Afin de supporter la gestion des thèmes pour chaque recette, voici les modifications que vous devez appliquer dans l'éditeur de script de votre Google Sheet (`Extensions > Apps Script`).

## 1. Fonction `getListeRecettes`

Trouvez la fonction `getListeRecettes` (qui liste toutes les recettes).
Elle doit désormais lire deux colonnes (le nom et le thème) et renvoyer un tableau d'objets au lieu d'un tableau de textes.

**Code à utiliser :**

```javascript
function getListeRecettes() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Data");
  if (!sheet) return [];
  // Supposons que les recettes (noms) sont dans une certaine colonne, par exemple colonne A (à adapter selon votre feuille)
  // Et que le Thème est dans une nouvelle colonne (ex: colonne C)
  // Vous devez récupérer toutes les données de la feuille
  const data = sheet.getDataRange().getValues();

  // Si vous avez une ligne d'en-tête, on la saute (index 1 au lieu de 0 dans la boucle)
  let recettes = [];

  for (let i = 1; i < data.length; i++) {
    let nomRecette = data[i][0]; // L'index 0 correspond à la colonne A. À adapter.
    let themeRecette = data[i][2]; // L'index 2 correspond à la colonne C. À adapter à votre nouvelle colonne Thème.

    if (nomRecette && String(nomRecette).trim() !== "") {
      recettes.push({
        nom: String(nomRecette).trim(),
        theme: themeRecette ? String(themeRecette).trim() : ""
      });
    }
  }

  return recettes;
}
```

*Note : Ajustez les index `[0]` et `[2]` selon les colonnes exactes de votre nom de recette et de votre thème dans l'onglet `Data`.*

---

## 2. Fonction `enregistrerRecette`

Trouvez la fonction `enregistrerRecette(data)`. Vous devez maintenant extraire `data.theme` et l'écrire dans la bonne colonne de la nouvelle ligne.

**Code à utiliser :**

```javascript
// Exemple de fonction enregistrerRecette mise à jour
function enregistrerRecette(donnees) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Data");
  if (!sheet) throw new Error("Feuille Data introuvable.");

  let nom = donnees.nom;
  let theme = donnees.theme || ""; // Nouveau paramètre
  let ingredients = donnees.ingredients; // Le format dépend de votre logique actuelle

  // Préparez votre ligne selon l'ordre de vos colonnes :
  // Exemple: [Nom de la recette, Ingrédients (ou URL, etc), Thème]
  let nouvelleLigne = [];
  nouvelleLigne[0] = nom;
  // ... (Gérer les ingrédients selon votre logique existante) ...
  nouvelleLigne[2] = theme; // À ajuster selon l'index de votre colonne "Thème"

  sheet.appendRow(nouvelleLigne);

  return "Recette ajoutée avec succès !";
}
```

---

## 3. Fonction `modifierRecette`

Trouvez la fonction `modifierRecette(data)`. Vous devez retrouver la ligne de la recette originale, puis écraser son nom, ses ingrédients, **et** son thème.

**Code à utiliser :**

```javascript
function modifierRecette(donnees) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Data");
  if (!sheet) throw new Error("Feuille Data introuvable.");

  let nomOriginal = donnees.nomOriginal;
  let nouveauNom = donnees.nouveauNom;
  let nouveauTheme = donnees.nouveauTheme || ""; // Nouveau paramètre
  let ingredients = donnees.ingredients; // Le format dépend de votre logique actuelle

  const data = sheet.getDataRange().getValues();
  let ligneModifiee = -1;

  // Chercher la ligne correspondante (on ignore la ligne 0 si c'est l'en-tête)
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === nomOriginal) { // Index 0 = colonne A
      ligneModifiee = i + 1; // +1 car getValues commence à l'index 0, mais les lignes Google Sheet commencent à 1
      break;
    }
  }

  if (ligneModifiee !== -1) {
    // Écraser les données
    sheet.getRange(ligneModifiee, 1).setValue(nouveauNom); // Colonne A (Nom)
    // ... (Mettre à jour vos ingrédients ici selon votre logique actuelle) ...
    sheet.getRange(ligneModifiee, 3).setValue(nouveauTheme); // Colonne C (Thème). Ajustez le 3 si besoin.

    return "Recette mise à jour !";
  } else {
    throw new Error("Recette originale introuvable dans la feuille.");
  }
}
```

### Important !
Pensez à vérifier l'emplacement exact de votre nouvelle colonne "Thème" dans la feuille `Data` et modifiez les numéros de colonnes/index en conséquence (L'index `0` en JavaScript équivaut à la colonne `1` ou `A` dans Sheets, `1` équivaut à `B`, `2` à `C`, etc.).
