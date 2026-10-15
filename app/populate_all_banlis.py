import json

with open('data-db-backup.json', 'r') as f:
    data = json.load(f)

# Comprehensive image mapping function for any food/drink/shisha item
def get_image(name, category=""):
    n = name.lower()
    c = category.lower()
    
    if 'hummus' in n:
        return 'https://images.unsplash.com/photo-1577968897966-3d4325b36b61?auto=format&fit=crop&w=600&q=80'
    elif 'foul' in n or 'bean' in n:
        return 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=600&q=80'
    elif 'cheese' in n:
        return 'https://images.unsplash.com/photo-1452195100486-9cc805987862?auto=format&fit=crop&w=600&q=80'
    elif 'potato' in n or 'mfarakeh' in n or 'fries' in n:
        return 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80'
    elif 'labneh' in n or 'yogurt' in n:
        return 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80'
    elif 'pastry' in n or 'dough' in n or 'pie' in n or 'za’atar' in n or 'zaatar' in n or 'lahme' in n:
        return 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80'
    elif 'baba ghanoush' in n or 'mutabbal' in n or 'eggplant' in n:
        return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'
    elif 'muhammara' in n or 'dip' in n:
        return 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80'
    elif 'tabbouleh' in n or 'salad' in n or 'fattoush' in n or 'greek' in n:
        return 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80'
    elif 'kibbeh' in n or 'rolls' in n or 'appetizer' in n or 'samosa' in n:
        return 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=600&q=80'
    elif 'falafel' in n:
        return 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=600&q=80'
    elif 'chicken' in n or 'grill' in n or 'meat' in n or 'steak' in n or 'beef' in n or 'kebab' in n or 'tikka' in n:
        return 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80'
    elif 'pasta' in n or 'fettuccine' in n or 'penne' in n or 'spaghetti' in n:
        return 'https://images.unsplash.com/photo-1621996346565-e3d5d6281226?auto=format&fit=crop&w=600&q=80'
    elif 'pizza' in n:
        return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80'
    elif 'burger' in n or 'sandwich' in n or 'wrap' in n or 'shawarma' in n:
        return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80'
    elif 'shisha' in n or 'hookah' in n or 'flavor' in n or 'apple' in n or 'mint' in n or 'grape' in n or 'gum' in n:
        return 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=600&q=80'
    elif 'juice' in n or 'cocktail' in n or 'smoothie' in n or 'lemonade' in n or 'orange' in n:
        return 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80'
    elif 'coffee' in n or 'espresso' in n or 'cappuccino' in n or 'latte' in n or 'tea' in n:
        return 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80'
    elif 'dessert' in n or 'cake' in n or 'kunafa' in n or 'baklava' in n or 'ice cream' in n or 'chocolate' in n:
        return 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80'
    elif 'soup' in n:
        return 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=600&q=80'
    else:
        return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80'

updated_count = 0
for p in data.get('products', []):
    if p.get('tenantId') == 'tenant-1789921221463':
        p['image'] = get_image(p.get('name', ''), p.get('category', ''))
        updated_count += 1

with open('data-db-backup.json', 'w') as f:
    json.dump(data, f, indent=2)

print(f"Successfully updated {updated_count} BANLIS products with image URLs!")
