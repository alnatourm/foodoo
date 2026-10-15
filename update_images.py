import json

with open('src/components/MenuAndRecipes.tsx', 'r') as f:
    content = f.read()

target1 = """                  className={`p-3 rounded-xl border transition flex flex-wrap items-center justify-between gap-3 cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800/90 border-amber-500 shadow-md'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex-1 min-w-[200px]">"""

replacement1 = """                  className={`p-3 rounded-xl border transition flex flex-wrap items-center justify-between gap-3 cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800/90 border-amber-500 shadow-md'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-lg object-cover border border-slate-700 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 text-xs shrink-0">
                        🍽️
                      </div>
                    )}
                    <div className="flex-1">"""

if target1 in content:
    content = content.replace(target1, replacement1, 1)
    with open('src/components/MenuAndRecipes.tsx', 'w') as f:
        f.write(content)
    print("MenuAndRecipes.tsx updated successfully.")
else:
    print("Target1 not found in MenuAndRecipes.tsx")


# Now update QrSelfOrder.tsx to show product image thumbnails
with open('src/components/QrSelfOrder.tsx', 'r') as f:
    qr_content = f.read()

qr_target = """                  <div
                    key={product.id}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-left flex items-start justify-between gap-3"
                  >
                    <div className="flex-1">"""

qr_replacement = """                  <div
                    key={product.id}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-left flex items-start justify-between gap-3"
                  >
                    {product.image && (
                      <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-slate-800">
                        <img src={product.image} alt={product.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1">"""

if qr_target in qr_content:
    qr_content = qr_content.replace(qr_target, qr_replacement, 1)
    with open('src/components/QrSelfOrder.tsx', 'w') as f:
        f.write(qr_content)
    print("QrSelfOrder.tsx updated successfully.")
else:
    print("Target not found in QrSelfOrder.tsx")


# Now update WaiterApp.tsx to show product image thumbnails
with open('src/components/WaiterApp.tsx', 'r') as f:
    waiter_content = f.read()

waiter_target = """                  <button
                    key={product.id}
                    disabled={product.is86d}
                    onClick={() => handleProductClick(product)}
                    className={`p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/60 ${isRTL ? 'text-right' : 'text-left'} transition flex flex-col justify-between`}
                  >
                    <div>"""

waiter_replacement = """                  <button
                    key={product.id}
                    disabled={product.is86d}
                    onClick={() => handleProductClick(product)}
                    className={`p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/60 ${isRTL ? 'text-right' : 'text-left'} transition flex flex-col justify-between`}
                  >
                    {product.image && (
                      <div className="h-20 w-full overflow-hidden rounded-lg mb-2 border border-slate-800">
                        <img src={product.image} alt={product.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div>"""

if waiter_target in waiter_content:
    waiter_content = waiter_content.replace(waiter_target, waiter_replacement, 1)
    with open('src/components/WaiterApp.tsx', 'w') as f:
        f.write(waiter_content)
    print("WaiterApp.tsx updated successfully.")
else:
    print("Target not found in WaiterApp.tsx")
