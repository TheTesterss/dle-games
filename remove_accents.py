#!/usr/bin/env python3
import re
import sys

def remove_accents(text):
    """Remove accents from text using Unicode normalization"""
    import unicodedata
    nfkd_form = unicodedata.normalize('NFKD', text)
    return ''.join([c for c in nfkd_form if not unicodedata.combining(c)])

# Files to process
files = [
    r'C:\Users\morga\Documents\dlegames\dle-games\backend\dist\data\pokemons.csv',
    r'C:\Users\morga\Documents\dlegames\dle-games\frontend\src\data\pokemons.csv'
]

for filepath in files:
    try:
        print(f"Processing: {filepath}")
        
        # Read file
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Remove accents
        content = remove_accents(content)
        
        # Write file back
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"✓ Completed: {filepath}")
    except Exception as e:
        print(f"✗ Error: {e}")

print("\nAll files processed successfully!")
