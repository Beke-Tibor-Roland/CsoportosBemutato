# ⚽ Odds Scraper Útmutató

## 📋 Követelmények

1. Python 3.7+
2. Csomagok telepítése:
```bash
pip install requests beautifulsoup4
```

Vagy:
```bash
pip install -r requirements.txt
```

## 🚀 Használat

### 1. Alapvető futtatás

```bash
python odds_scraper.py
```

A script interaktív menüt mutat:
- **Opció 1**: The Odds API (API kulcs kell)
- **Opció 2**: Football-Data.co.uk (ingyenes!)
- **Opció 3**: Minta adatok generálása
- **Opció 4**: Mindhárom módszer

### 2. The Odds API használata

**Előny**: Élő odds, sok bajnokság  
**Hátrány**: 500 kérés/hó ingyenes limittel

1. Regisztrálj: https://the-odds-api.com/
2. Másold ki az API kulcsod
3. Válaszd az 1-es opciót
4. Illeszd be az API kulcsot

**Támogatott bajnokságok:**
- Premier League
- La Liga
- Bundesliga
- Serie A
- Ligue 1

### 3. Football-Data.co.uk (Ajánlott!)

**Előny**: Ingyenes, nincs limit, történelmi adatok  
**Hátrány**: Nincs élő adat

- Válaszd a 2-es opciót
- Automatikusan letölti az aktuális szezon adatait
- Odds + eredmények is benne vannak!

### 4. Minta adatok generálása

**Teszteléshez ideális:**

```bash
python odds_scraper.py
# Válaszd: 3
# Add meg: 200 (mérkőzések száma)
```

## 📁 Kimeneti fájlok

A script két fájlt hoz létre a `data/` mappában:

1. **odds_data.csv** - Excel-kompatibilis
2. **odds_data.json** - JavaScript-kompatibilis

### CSV struktúra:
```csv
date,league,home_team,away_team,odds_home,odds_draw,odds_away,home_goals,away_goals,result,bookmaker
15/03/2024,Premier League,Arsenal,Liverpool,2.10,3.40,3.60,2,1,H,Bet365
```

### JSON struktúra:
```json
[
  {
    "date": "15/03/2024",
    "league": "Premier League",
    "home_team": "Arsenal",
    "away_team": "Liverpool",
    "odds_home": 2.10,
    "odds_draw": 3.40,
    "odds_away": 3.60,
    "home_goals": 2,
    "away_goals": 1,
    "result": "H",
    "bookmaker": "Bet365"
  }
]
```

## 🔧 Python scriptből használat

```python
from odds_scraper import OddsScraper

# Scraper létrehozása
scraper = OddsScraper()

# 1. Football-Data scraping (ajánlott)
scraper.scrape_football_data()

# 2. The Odds API (ha van kulcsod)
scraper.scrape_odds_api('YOUR_API_KEY_HERE')

# 3. Minta adatok
scraper.generate_sample_data(150)

# Mentés
scraper.save_to_csv('data/odds_data.csv')
scraper.save_to_json('data/odds_data.json')

# Statisztikák
scraper.get_summary()
```

## 📊 Integráció a Stratégia Szimulátor oldalba

### 1. Módosítsd a script.js-t

Cseréld ki a `loadData()` függvényt:

```javascript
async function loadData() {
    try {
        // Betöltjük az odds adatokat
        const response = await fetch('data/odds_data.json');
        const oddsData = await response.json();
        
        // Feldolgozás
        processedData = oddsData.map(match => {
            return {
                // Odds alapján profit számítás
                profitH: match.result === 'H' ? (match.odds_home - 1) : -1,
                profitD: match.result === 'D' ? (match.odds_draw - 1) : -1,
                profitA: match.result === 'A' ? (match.odds_away - 1) : -1,
                
                // Favorite/Underdog
                favoriteProfit: match.odds_home < match.odds_away ? 
                    (match.result === 'H' ? (match.odds_home - 1) : -1) :
                    (match.result === 'A' ? (match.odds_away - 1) : -1),
                    
                underdogProfit: match.odds_home > match.odds_away ? 
                    (match.result === 'H' ? (match.odds_home - 1) : -1) :
                    (match.result === 'A' ? (match.odds_away - 1) : -1),
                    
                // Egyéb adatok
                league: match.league,
                date: match.date
            };
        });
        
        createAllVisualizations();
    } catch (error) {
        console.error('Adatbetöltési hiba:', error);
    }
}
```

### 2. Mappa struktúra

```
FociVizualisation/
├── data/
│   ├── odds_data.json    ← A scraper ezt készíti
│   └── odds_data.csv     ← Excel-ben is nézheted
├── odds_scraper.py       ← A scraper script
├── strategy.html
└── script.js
```

## 💡 Tippek

### Gyakori frissítés

Hozz létre egy batch fájlt (update_odds.bat):

```batch
@echo off
cd /d "c:\Users\beker\OneDrive\Asztali gép\FociVizualisation"
python odds_scraper.py
pause
```

### Automata üzemmód

Módosítsd a `main()` függvényt:

```python
def main():
    scraper = OddsScraper()
    scraper.scrape_football_data()  # Ingyenes
    scraper.generate_sample_data(50)  # Kiegészítés
    scraper.save_to_csv()
    scraper.save_to_json()
    print("✅ Kész!")
```

### Több szezon letöltése

Módosítsd a `scrape_football_data()` függvényt:

```python
# Több szezon
seasons = ['2324', '2223', '2122']  # 2023-24, 2022-23, 2021-22
```

## ⚠️ Fontos

1. **The Odds API**: Max 500 kérés/hó ingyenesen
2. **Football-Data**: Legyen udvarias, ne túl gyakran
3. **Rate limiting**: A script automatikusan késleltet
4. **Jogok**: Csak oktatási célra!

## 🐛 Hibaelhárítás

### ModuleNotFoundError: No module named 'requests'

```bash
pip install requests beautifulsoup4
```

### CSV encoding hiba

A script UTF-8-at használ, Excel-ben "Import From CSV" opcióval nyisd meg.

### 403 Forbidden hiba

Football-Data blokkolhat túl sok kérés esetén. Várj 1-2 percet.

## 📞 Támogatás

Ha problémád van:
1. Ellenőrizd a requirements.txt telepítését
2. Használd a 3-as opciót (minta adatok) teszteléshez
3. Nézd meg a console hibákat

---

**Készítve a Stratégia Szimulátor oldalhoz** 🚀
