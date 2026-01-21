# Sportmonks API Integráció

## Csapat Statisztikák API Beállítása

A főoldalon található csapat statisztikák widget most a Sportmonks API-t használja valós idejű tabella adatok betöltéséhez.

### Használt API Endpoint

```
https://api.sportmonks.com/v3/football/standings/seasons/25583?includes=participant;league;stage;form;rule;details
```

### Beállítás

1. **API Token beszerzése:**
   - Regisztrálj a [Sportmonks](https://www.sportmonks.com/) oldalon
   - Szerezz be egy API tokent a dashboard-ból

2. **Token beállítása:**
   - Nyisd meg a `script.js` fájlt
   - Keresd meg a `loadStandingsData()` függvényt
   - Cseréld le a `YOUR_API_TOKEN_HERE` szöveget a saját API tokeneddel:
   
   ```javascript
   const API_TOKEN = 'your_actual_api_token_here';
   ```

3. **Season ID testreszabása (opcionális):**
   - Az aktuális Season ID: `25583`
   - Ez lecserélhető bármely érvényes Sportmonks season ID-re
   - Az URL-ben módosítsd: `standings/seasons/YOUR_SEASON_ID`

### Adatok az API-ból

A widget a következő statisztikákat jeleníti meg:

- **Pozíció a tabellában**
- **Pontszám**
- **Játszott mérkőzések száma**
- **Győzelem / Döntetlen / Vereség**
- **Legutóbbi forma** (utolsó 5 meccs eredménye)
- **Rúgott és kapott gólok**
- **Gólkülönbség**
- **Győzelmi arány**

### Fallback Mechanizmus

Ha az API hívás sikertelen (pl. nincs token beállítva vagy elérhetetlen az API):
- A rendszer automatikusan visszavált a helyi `rawData` adatokra
- A csapat lista a korábban betöltött mérkőzés adatokból lesz generálva
- Ez biztosítja, hogy a widget mindig működjön, még API probléma esetén is

### Includes Paraméterek

Az API hívás a következő related data-kat is betölti:

- `participant` - Csapat részletes információk
- `league` - Bajnokság adatok
- `stage` - Szakasz információk
- `form` - Forma adatok (legutóbbi eredmények)
- `rule` - Tabella számítási szabályok
- `details` - További részletes statisztikák

### Hibaelhárítás

**A csapatok nem jelennek meg:**
- Ellenőrizd, hogy beállítottad-e az API tokent
- Nézd meg a böngésző konzolt hibaüzenetekért
- Győződj meg róla, hogy a Season ID érvényes

**CORS hibák:**
- Próbálj helyi szervert használni a fájlok kiszolgálására
- Alternatívaként használhatsz proxy szervert az API hívásokhoz

**Rate limiting:**
- A Sportmonks API-nak van rate limitje
- Fontold meg a válaszok cache-elését production környezetben

### API Dokumentáció

További információért látogasd meg a [Sportmonks API Documentation](https://docs.sportmonks.com/) oldalt.
