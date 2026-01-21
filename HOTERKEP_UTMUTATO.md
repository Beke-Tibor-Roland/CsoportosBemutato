# 🔥 Válogatottak Hőtérkép - Működési Útmutató

## ✅ A hőtérkép használata

### 1. Helyi szerver szükséges!
A hőtérkép **nem működik** közvetlenül a fájl megnyitásával (`file:///`), mert a JSON fájl betöltéséhez **helyi webszerver** szükséges.

### 2. Helyi szerver indítása

**Opció A - VS Code Live Server (ajánlott):**
1. Nyisd meg a projektet VS Code-ban
2. Telepítsd a "Live Server" extension-t
3. Jobb klikk az `index.html` vagy `win-rate.html` fájlon
4. "Open with Live Server"

**Opció B - Python:**
```bash
# Python 3
cd C:\Users\PC\Desktop\bicsoportos
python -m http.server 8000

# Aztán nyisd meg: http://localhost:8000/win-rate.html
```

**Opció C - Node.js:**
```bash
npm install -g http-server
cd C:\Users\PC\Desktop\bicsoportos
http-server -p 8000

# Aztán nyisd meg: http://localhost:8000/win-rate.html
```

### 3. Adatok frissítése

Ha friss adatokat szeretnél:
```bash
python scraper.py
```

Ez újragenerálja a `data/team_stats.json` fájlt az `data/adatokfoci.csv` alapján.

### 4. Hőtérkép ellenőrzése

**Teszt oldalak:**
- `simple-test.html` - Egyszerű lista nézet (gyors teszt)
- `test-heatmap.html` - Debug információkkal
- `win-rate.html` - Teljes hőtérkép vizualizáció

### 5. Hibaelhárítás

**Nincs adat / üres oldal:**
1. Ellenőrizd, hogy fut-e a helyi szerver (nem `file:///` URL)
2. Nyisd meg a böngésző konzolt (F12)
3. Nézd meg a console.log üzeneteket
4. Ellenőrizd, hogy létezik-e a `data/team_stats.json` fájl

**Konzol hibák:**
```
❌ CORS error → Indíts helyi szervert!
❌ 404 error → Ellenőrizd a fájl elérési utat
❌ createViz3 not found → script.js nem töltődött be
```

**Sikeres betöltés jelei:**
```
✅ createViz3 meghívva
✅ Adatok betöltve: 261 csapat
✅ TOP 30 csapat kiválasztva
```

## 📊 Milyen adatokat mutat?

- **Forrás:** `adatokfoci.csv` (4912 mérkőzés, 2019-2024)
- **Csapatok:** 261 válogatott
- **Szűrés:** Csak minimum 10 mérkőzést játszott csapatok
- **TOP 30:** Legmagasabb gólátlaggal rendelkező válogatottak
- **Színskála:** Zöld (világos = kevés gól, sötét = sok gól)

## 📁 Fájlstruktúra

```
bicsoportos/
├── data/
│   ├── adatokfoci.csv          # Forrás adatok (4912 meccs)
│   └── team_stats.json         # Generált statisztikák
├── scraper.py                  # Python szkript (generálja a JSON-t)
├── script.js                   # JavaScript (createViz3 függvény)
├── win-rate.html               # Hőtérkép oldal
├── simple-test.html            # Egyszerű teszt
└── test-heatmap.html           # Debug teszt
```

## 🎨 Vizualizáció részletei

### Amit a hőtérkép mutat:
- **Y tengely:** Válogatottak nevei (30 csapat)
- **X tengely:** Gólátlag kategóriák (0-0.5, 0.5-1.0, 1.0-1.5, stb.)
- **Színek:** Zöld intenzitás = átlagos gólszám
- **Száok:** Pontos gólátlag (pl. 2.65)
- **Hover:** Tooltip részletes infóval

### TOP csapatok várható listája:
1. Székely Land: 4.00 gól/meccs
2. New Zealand: 2.95 gól/meccs  
3. Japan: 2.65 gól/meccs
4. Germany: 2.59 gól/meccs
5. Belgium: 2.46 gól/meccs
...és még 25 csapat

## 🔧 Fejlesztés

Ha módosítasz a vizualizáción:
1. Szerkeszd a `script.js` fájlt
2. Keresd a `createViz3()` függvényt
3. Frissítsd a böngészőt (Ctrl+F5 = hard refresh)

---

**Fontos:** A hőtérkép csak akkor működik, ha a fájlokat **webszerverről** töltöd be, nem közvetlenül!
