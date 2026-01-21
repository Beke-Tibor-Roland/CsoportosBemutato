# Football Betting Odds Analytics - University Project

## Overview
This is a data visualization web application analyzing football betting odds and their relationship to actual match outcomes. The project focuses on **data storytelling** for investors and decision-makers, examining bookmaker pricing efficiency and market patterns.

## Features

### 6 Interactive Visualizations

1. **Odds Accuracy Chart** - Scatter plot comparing implied probabilities with actual win rates
2. **Bookmaker Margin Distribution** - Histogram showing the overround across matches
3. **Win Rate Heatmap** - Heat map displaying win frequencies by odds ranges
4. **Betting Strategy Simulation** - Line chart comparing cumulative profits of different strategies
5. **Home Advantage Analysis** - Bar chart comparing expected vs actual home win rates
6. **League Comparison** - Grouped bar chart showing efficiency metrics by league

## Getting Started

### Option 1: Using Your Own Data

1. Download historical football data from [Football-Data.co.uk](https://www.football-data.co.uk/)
2. Place the CSV file in the `data/` folder as `football_data.csv`
3. Ensure the CSV has these columns:
   - `Date` - Match date
   - `League` - League name
   - `HomeTeam` - Home team name
   - `AwayTeam` - Away team name
   - `FTHG` - Full-time home goals
   - `FTAG` - Full-time away goals
   - `FTR` - Full-time result (H/D/A)
   - `B365H` - Bet365 home win odds
   - `B365D` - Bet365 draw odds
   - `B365A` - Bet365 away win odds

### Option 2: Demo Mode (No Data File)

If no CSV file is found, the application automatically generates **sample data** for demonstration purposes. This allows you to view all visualizations immediately without downloading any data.

## How to Run

1. **Open in Browser**
   - Simply open `index.html` in any modern web browser
   - The page will load and display all visualizations

2. **Using a Local Server (Recommended)**
   ```bash
   # If you have Python installed:
   python -m http.server 8000
   
   # Then visit: http://localhost:8000
   ```

3. **Using VS Code Live Server**
   - Right-click on `index.html`
   - Select "Open with Live Server"

## Project Structure

```
bicsoportos/
│
├── index.html          # Main HTML structure
├── style.css           # Styling and layout
├── script.js           # Data processing and D3.js visualizations
├── data/               # Data folder (create this)
│   └── football_data.csv  # Your CSV data (optional)
└── README.md           # This file
```

## Data Processing

The JavaScript code automatically:
- Loads CSV data or generates sample data
- Calculates implied probabilities from odds (1/odds)
- Derives betting profits/losses
- Identifies favorites and underdogs
- Bins odds into ranges
- Aggregates statistics by league

## Key Insights

The analysis reveals:
- **Bookmaker accuracy** in pricing match outcomes
- **Market efficiency** across different leagues
- **Home field advantage** pricing patterns
- **Long-term profitability challenges** due to bookmaker margins
- **Risk and variance** in different betting strategies

## Technologies Used

- **HTML5** - Structure
- **CSS3** - Styling with gradients and responsive design
- **JavaScript (ES6)** - Data processing
- **D3.js v7** - Data visualization library

## Educational Purpose

⚠️ **Important**: This project is for **educational and analytical purposes only**. It examines market efficiency and decision-making under uncertainty. It is **not** intended to promote gambling or guarantee any financial returns.

## Customization

### Change Colors
Edit the color schemes in `style.css` and `script.js`:
```css
/* In style.css */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

```javascript
// In script.js
const colorScale = d3.scaleOrdinal()
    .range(['#3498db', '#95a5a6', '#e74c3c']);
```

### Adjust Sample Data
Modify the `generateSampleData()` function in `script.js` to change:
- Number of matches (default: 500)
- Leagues included
- Team names
- Date ranges

## Browser Compatibility

- Chrome/Edge (recommended)
- Firefox
- Safari
- Opera

Requires JavaScript enabled and SVG support.

## Credits

- **Data Source**: Football-Data.co.uk
- **Visualization Library**: D3.js
- **Design**: Custom responsive design

## License

This is an educational project for university coursework.

---

**Created for**: University Group Project on Sports Analytics  
**Topic**: Betting Market Efficiency and Data-Driven Decision Making  
**Date**: January 2026
