import json

with open('data-db-backup.json', 'r') as f:
    data = json.load(f)

# Keyword to image mapping for Unsplash
def get_image_for_name(name):
    n = name.lower()
    if 'hummus' in n:
        return 'https://images.unsplash.com/photo-1577805947697-89e18249d767?auto=format&fit=crop&w=800&q=80'
    elif 'foul' in n or 'fool' in n or 'medames' in n:
        return 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80'
    elif 'cheese mix' in n or 'labneh' in n:
        return 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80'
    elif 'mfarakeh' in n or 'potato' in n and 'mfarakeh' in n:
        return 'https://images.unsplash.com/photo-1518977676601-b5ff321036b9?auto=format&fit=crop&w=800&q=80'
    elif 'labneh' in n:
        return 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=80'
    elif 'dough' in n or 'pastry' in n or 'za’atar' in n or 'zaatar' in n or 'lahme' in n:
        return 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80'
    elif 'baba ghanoush' in n or 'mutabbal' in n:
        return 'https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&w=800&q=80'
    elif 'muhammara' in n:
        return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'
    elif 'tabbouleh' in n:
        return 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80'
    elif 'kibbeh' in n:
        return 'https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&w=800&q=80'
    elif 'cheese rolls' in n:
        return 'https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&w=800&q=80'
    elif 'spicy potatoes' in n or 'batata' in n:
        return 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=80'
    elif 'falafel' in n:
        return 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=800&q=80'
    elif 'sausage' in n or 'makanek' in n or 'sujuk' in n:
        return 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80'
    elif 'tahini' in n:
        return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'
    elif 'garlic sauce' in n or 'toum' in n:
        return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'
    elif 'chicken' in n and ('grill' in n or 'basic' in n or 'parmesan' in n or 'limon' in n):
        return 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=800&q=80'
    elif 'fettuccine' in n or 'alfredo' in n or 'pasta' in n or 'arrabbiata' in n or 'pesto' in n or 'futchini' in n or 'pini arabiata' in n:
        return 'https://images.unsplash.com/photo-1621996346565-e3d5d6281298?auto=format&fit=crop&w=800&q=80'
    elif 'garlic bread' in n:
        return 'https://images.unsplash.com/photo-1619531003657-37a505b768e1?auto=format&fit=crop&w=800&q=80'
    elif 'fattoush' in n or 'salad' in n or 'greek' in n or 'caesar' in n:
        return 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80'
    elif 'steak' in n or 'meat' in n or 'beef' in n:
        return 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=800&q=80'
    elif 'pepper sauce' in n or 'mushroom sauce' in n or 'dynamite sauce' in n or 'dipping sauce' in n or 'syrup' in n:
        return 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=800&q=80'
    elif 'shrimp' in n or 'dynamite shrimp' in n:
        return 'https://images.unsplash.com/photo-1565680314427-a5ab529b53d4?auto=format&fit=crop&w=800&q=80'
    elif 'mashed' in n:
        return 'https://images.unsplash.com/photo-1618897996318-5a901fa6ca71?auto=format&fit=crop&w=800&q=80'
    elif 'vegetables' in n:
        return 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80'
    elif 'kebab' in n or 'shish tawook' in n:
        return 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=800&q=80'
    elif 'shawarma' in n:
        return 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=800&q=80'
    elif 'pizza' in n:
        return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80'
    elif 'cheesecake' in n or 'brownie' in n or 'kunafa' in n or 'mahalabia' in n or 'umm ali' in n or 'harissa' in n or 'basbousa' in n or 'dessert' in n:
        return 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80'
    elif 'pepsi' in n or 'cola' in n or '7up' in n or 'sprite' in n or 'water' in n or 'sparkling' in n or 'red bull' in n or 'cod red' in n or 'heineken' in n:
        return 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80'
    elif 'espresso' in n or 'turkish' in n or 'americano' in n or 'v60' in n or 'latte' in n or 'cappuccino' in n or 'mocha' in n or 'macchiato' in n or 'cortado' in n or 'flat white' in n or 'coffee' in n:
        return 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80'
    elif 'tea' in n or 'zhourat' in n or 'baboung' in n or 'yansoun' in n or 'genger' in n or 'karak' in n:
        return 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80'
    elif 'orange' in n or 'strawberry' in n or 'mango' in n or 'avocado' in n or 'limon' in n or 'lemon' in n or 'mint' in n or 'cocktail' in n or 'pineapple' in n or 'pomegranate' in n or 'banana' in n or 'kiwi' in n or 'juice' in n:
        return 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=800&q=80'
    elif 'mojito' in n or 'mohito' in n or 'berry' in n or 'passion' in n or 'peche' in n:
        return 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80'
    elif 'shisha' in n or 'fakher' in n or 'nakhla' in n or 'gum' in n or 'grapes' in n or 'love' in n or 'peach' in n or 'watermelon' in n:
        return 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80'
    elif 'milkshake' in n:
        return 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80'
    elif 'burger' in n:
        return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80'
    elif 'chakriya' in n or 'كبة' in n or 'مجدرة' in n:
        return 'https://images.unsplash.com/photo-1543353071-10c8ba85a904?auto=format&fit=crop&w=800&q=80'
    elif 'breakfast' in n or 'platter' in n:
        return 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=800&q=80'
    else:
        return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80'

count = 0
for p in data.get('products', []):
    if p.get('tenantId') == 'tenant-1789921221463':
        p['image'] = get_image_for_name(p.get('name', ''))
        count += 1

with open('data-db-backup.json', 'w') as f:
    json.dump(data, f, indent=2)

print(f'Successfully updated {count} BANLIS products with matched Unsplash image URLs!')
