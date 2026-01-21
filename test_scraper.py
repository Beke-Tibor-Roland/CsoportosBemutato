#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gyors teszt a scraper működéséhez
"""

from odds_scraper import OddsScraper

print("⚽ GYORS TESZT - Odds Scraper")
print("="*50)

# Scraper létrehozása
scraper = OddsScraper()

# 1. Minta adatok generálása (gyors teszt)
print("\n1️⃣ Minta adatok generálása...")
scraper.generate_sample_data(50)

# 2. Statisztikák
scraper.get_summary()

# 3. Mentés
print("\n💾 Fájlok mentése...")
scraper.save_to_csv('data/odds_data.csv')
scraper.save_to_json('data/odds_data.json')

print("\n✅ TESZT SIKERES!")
print("\n📁 Ellenőrizd a data/ mappát:")
print("   - odds_data.csv")
print("   - odds_data.json")
print("\n🌐 Most nyisd meg a strategy.html oldalt!")
